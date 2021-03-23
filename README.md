# speer_be_assessment
This is my submission for an interview @ Speer Technologies. Hours spent: 6hrs

## Features
- Adding/withdraw funds
- Creating an account
- Login/Logout
- Reset password
- Subscribing/Unsubscribed from a stock ticker (API)
- Seeing information regarding all subscribed stocks (API)
- Seeing all users in the database, along with SOME of their information
- See your portfolio of "purchased" stocks

## Improvements
My buy/sell stock requests could have benefited from actually using the API, but I ran out of time. Realistically, instead of the user choosing the cost/sell price, it would be collected through the use of the API. It would also confirm that the stocks exist.

## What I Learned
This is the first time I've used an API so it was interesting to see how I can query data from a website and use it for my own programs. This is certainly a feature I will be using more often down the road.

## How to Use
1. Download the files
2. Open your terminal and locate the folder
3. Type "npm i package.json" to install all dependencies
4. Type "npm run start" to start up the server
5. Open up PostMan to start testing (!IMPORTANT! USE THE localhost LINK BELOW FOR ALL QUERIES)!
6. Also, most of these queries require you to be logged in. I have included a sample user in the database. Feel free to make a new account, however.


## Sample User
name:       DavidAddison
password:   123456
email:      test@email.com

## Sample Queries on PostMan (http://localhost:3000/api/user/)
### POST '/register' (create a new account in the database)
{
  "name"      : "myNewUsername",
  "password"  : "myNewHashedPassword",
  "email"     : "myNewEmail"
}

### POST '/login' (registering for an account will have already logged you in)
{
  "name"          : "myUsername",
  "password"      : "myPassword"
}

### POST '/resetPassword' (would normally send an email, instead sends new password as a response) (also, this resets the password no matter what, which is obviously flawed)
{
  "email":        : "myEmail" 
}

### POST '/changePassword' (allows you to modifying an existing password)
{
  "password"        : "myNewPassword",
  "passwordRetyped" : "myNewPassword",
  "oldPassword"     : "myOldPassword"
}

### POST '/logout' (logs you out, assuming you're currently logged in)

### POST '/buy-shares'
{
  "shareID"          : "theShareIWant",
  "shares"           : "theAmoutIWant",
  "cost"             : "theCostOfShare"
}

### POST '/sell-shares'
{
  "shareID"           : "theShareImSelling",
  "amount"            : "theAmountIWantToSell",
  "price"             : "thePriceIWantToSellFor"
}

### POST '/add-funds'
{
  "amount"            : "theAmountOfMoney"
}

### POST '/withdraw-funds'
{
  "amount"            : "theAmountOfMoney"
}

### GET '/portfolio' (returns the purchased shares of the user that is logged in)

### POST '/subscribe-to-stock'
{
  "ticker"            : "tickerOfStock"
}

### POST '/unsubscribe-from-stock'
{
  "ticker"            : "tickerOfStock"
}

### GET '/subscribed-stocks' (returns the stocks that the user is subscribed to)

### GET '/users' (returns all users in the database)
