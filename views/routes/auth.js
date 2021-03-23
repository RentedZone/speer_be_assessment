const router = require('express').Router();
const {UserModel} = require('../../Users');
const {registrationValidation, loginValidation} = require('../../validation');
const bcrypt = require('bcrypt');

// Register account
router.post('/register', async (req, res) => {
    // Data validation
    const {error} = registrationValidation(req.body);
    if (error) {
        return res.status(400).cookie('errorMessage',error.details[0].message, {maxAge: 1000}).send(error.details[0].message);
    }

    // check if user already exists
    const { name, email, password } = req.body;
    const userExists = await UserModel.findOne({name: name});
    const emailExists = await UserModel.findOne({email: email});

    if (userExists){
        return res.status(400).cookie('errorMessage','Username already exists...', {maxAge: 1000}).send("Username already exists...");
    } else if (emailExists) {
        return res.status(400).cookie('errorMessage','Email already in use...', {maxAge: 1000}).send("Email already in use...");
    }

    // password hashing
    const hash = await bcrypt.hash(password, 10);

    // user creation
    const user = new UserModel ({name, email, password: hash});
    try {
        await user.save();
        req.session.userId = user._id;
        return res.status(201).send("Account created successfully.");
    } catch(err) {
        return res.status(400).cookie('errorMessage',err, {maxAge: 1000}).send("Error creating account.");
    }
});

// Login
router.post('/login',  async (req, res) => {
    // Data validation
    const { error } = loginValidation(req.body);
    if (error) {
        return res.status(400).cookie('errorMessage',error.details[0].message, {maxAge: 1000}).send(error.details[0].message);
    }

    // check if user exists
    const { name, password } = req.body;
    const user = await UserModel.findOne({name: name});

    if(!user){
        return res.status(400).cookie('errorMessage','Username doesn\'t exist...', {maxAge: 1000}).send("User doesn't exist. Invalid username.");
    } else {
        // check password
        const validPassword = await bcrypt.compare(password, user.password);

        if(!validPassword) {
            return res.status(400).cookie('errorMessage','Incorrect password', {maxAge: 1000}).send("Invalid password!");
        }
    }

    req.session.userId = user._id;
    await user.save();
    return res.status(200).send("Login successful.");
});

// resets the password of a user
router.post('/resetPassword', async (req, res) => {
    const user = await UserModel.findOne({email: req.body.email});

    if (user) {
        const password = Math.random().toString(36).substring(3);
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.isPasswordReset = true;
        await user.save();

        return res.status(200).send("Password reset. New password: " + password);
    } else {
        return res.status(400).cookie('errorMessage','No user has that email...', {maxAge: 1000}).send("Invalid email address.");
    }
});

// changes the password of a user who reset their password
router.post('/changePassword', async (req, res) => {
    const { password, passwordRetyped, oldPassword} = req.body;
    const user = await UserModel.findOne({_id: req.session.userId});

    if(!user){
        return res.status(400).send('No one is logged in.');
    } else {

        if (password === passwordRetyped && await bcrypt.compare(oldPassword, user.password)) {
            user.password = await bcrypt.hash(password, 10);
        } else {
            return res.status(400).send('Passwords don\'t match...');
        }
    }

    await user.save();
    return res.status(200).send("Password successfully changed.");
});

// handles logging out
router.post('/logout', async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if (user) {
        await user.save();

        req.session.destroy(err => {
            if (err) reject(err);
            res.clearCookie('test');
            return res.status(200).send("Logging out... bye!");
        });
    } else {
        return res.status(400).send("Cannot logout. No one is logged in!");
    }
});

router.post("/buy-shares", async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if(user) {
        const {shareID, shares, cost} = req.body;
        if(shares < 1) return res.status(400).send("Invalid amount of shares requested.");
        if(await canAffordShares(user.balance, shares, cost)) {
            let index = await ownsShare(shareID, user.shares);
            if(index !== -1) {
                UserModel.updateOne(
                    {name: user.name},
                    {$set: {[`shares.$[outer].${shares}`]: (parseInt(user.shares[index].shares) + parseInt(shares))}},
                    {"arrayFilters": [{"outer.id": shareID}]}
                );
            } else {
                let newShare = {"id": shareID, "shares": shares};

                UserModel.updateOne(
                    {name: user.name},
                    {$push: {shares: newShare}}
                );
            }
            user.balance -= shares * cost;
            await user.save();
            return res.status(200).send("Purchased " + shares + " share(s) of: " + shareID);
        } else return res.status(400).send("You do not have the funds to make this purchase.");
    } else return res.status(400).send("Login to buy shares.");
});

router.post("/sell-shares", async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if(user) {
        const {shareID, amount, price} = req.body;
        if(amount < 1) return res.status(400).send("You must enter a valid number of shares to sell.");
        let index = await hasEnoughShares(shareID, amount, user.shares);
        if(index !== -1) {
            if(user.shares[index].shares === amount) {
                UserModel.updateOne(
                    {name: user.name},
                    {$pull: {[`shares.$[outer]`]: shareID}},
                    {"arrayFilters": [{"outer.id": shareID}]}
                );
            } else {
                UserModel.updateOne(
                    {name: user.name},
                    {$set: {[`shares.$[outer].${'shares'}`]: (parseInt(user.shares[index].shares) - parseInt(amount))}},
                    {"arrayFilters": [{"outer.id": shareID}]}
                );
            }
            user.balance += amount * price;
            await user.save();
            return res.status(200).send("Sold " + amount + " share(s) of: " + shareID);
        } else return res.status(400).send("You do not have enough shares to sell./You don't own that share.");
    } else return res.status(400).send("Login to sell shares.");
});

router.post("/add-funds", async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if(user) {
        const {amount} = req.body;
        if(amount > 0 && amount <= 10000) {
            user.balance += amount;
            await user.save();
            return res.status(200).send("$" + amount + " successfully added to your account.");
        } else return res.status(400).send("Please deposit $1 - $10,000.");
    } return res.status(400).send("You must be logged in to add funds.");
});

router.post("/withdraw-funds", async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if(user) {
        const {amount} = req.body;
        if(amount > 0 && amount <= user.balance) {
            user.balance -= amount;
            await user.save();
            return res.status(200).send("$" + amount + " successfully withdrawn from your account.");
        } else return res.status(400).send("You can only withdraw an amount less than or equal to your balance.");
    } return res.status(400).send("You must be logged in to withdraw funds.");
});

router.get("/portfolio", async (req, res) => {
    const user = await UserModel.findOne({_id: req.session.userId});
    if(user) {
        return res.status(200).send(user.shares);
    } else return res.status(400).send("You must be logged in to see your portfolio.");
});


// FOR ASSESSMENT USE ONLY (NO NEED IF THIS WAS REAL)
router.get("/users", async (req, res) => {
    const users = await UserModel.find({});
    if(users) return res.status(200).send(users);
    return res.status(400).send("No users in this database.");
});


// HELPERS
async function ownsShare(shareID, shares) {
    for(let i = 0; i < shares.length; i++) if(shares[i].id === shareID) return i;
    return -1;
}

async function canAffordShares(funds, numShares, cost) {
    return (funds - (numShares * cost) >= 0);
}

async function hasEnoughShares(share, numShares, sharesOwned) {
    let index = await ownsShare(share, sharesOwned);
    if (index !== -1 && parseInt(sharesOwned[index].shares) >= parseInt(numShares)) return index;
    return -1;
}

module.exports = router;