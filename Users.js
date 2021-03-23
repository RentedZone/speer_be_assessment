const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
        name: {
            type: String,
            required: true,
            min: 3,
            max: 255,
            unique: true
        },
        email: {
            type: String,
            required: true,
            min: 6,
            max: 255,
            unique: true
        },
        password: {
            type: String,
            required: true,
            min: 6,
            max: 1024
        },
        balance: {
            type: Number,
            default: 0
        },
        shares: {
            type: Array,
            default: []
        },
        subscriptions: {
            type: Array,
            default: []
        }
    }, {timestamps: true});

const UserModel = mongoose.model('User', UserSchema);

module.exports = {UserModel};