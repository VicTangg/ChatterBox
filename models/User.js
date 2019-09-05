const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
    name: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    icon: {
        type: String,
        require: true
    },
    status: {
        type: String,
        require: true
    },
    mobileNumber: {
        type: String,
        require: true
    },
    homeNumber: {
        type: String,
        require: true
    },
    address: {
        type: String,
        require: true
    },
    friends: [{
        name: String,
        lastMsgId: String,
        userId: String
    }]
}, {versionKey: false});

module.exports = User = mongoose.model('user', UserSchema, 'userList');