const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const MessageSchema = new Schema({
    senderId: {
        type: String,
        require: true
    },
    receiverId: {
        type: String,
        require: true
    },
    message: {
        type: String,
        require: true
    },
    date: {
        type: Date,
        require: true
    },
    time: {
        type: String,
        require: true
    }
}, {versionKey: false});

module.exports = Message = mongoose.model('message', MessageSchema, 'messageList');