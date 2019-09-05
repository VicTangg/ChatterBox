const express = require('express');
const router = express.Router();
const multer = require('multer')
const upload = multer()

// Item Model
const Item = require('../models/Item');
const User = require('../models/User');
const Message = require('../models/Message');

router.get('/test', (req, res) => {
  res.json({'hello': 'world'})
})

// @route   GET load
// @desc    Get All Items
// @access  Public
router.get('/load', (req, res) => {
  if (req.session.userId){
    // Check if userId is set in session
    User.findOne({_id: req.session.userId})
      // Find user
      .then(user => {
        var friendsName = [];
        var friendsLastMsgId = {};
        user.friends.forEach(function(friend){
          friendsName.push(friend.name)
          friendsLastMsgId[friend.name] = friend.lastMsgId 
        });
        User.find({name:{$in: friendsName}})
          // Find friends of user
          .then(friends => {
            var friendsList = [];            
            friends.forEach(function(friend){
              friendsList.push({
                'name': friend.name,
                'id': friend._id,
                'lastMsgId': friendsLastMsgId[friend.name]
              })              
            })
            // Unread messages from friends not between friends
            let friendIds = friendsList.map(friend => friend.id)
            Message.find({
            // Probably need a fix here condition query ***************
              senderId: {$in: friendIds}, 
              receiverId: user._id
            }).sort({receiverId: 1, date: -1, time: -1})
            .then(messages => {
              // For each friend, loop until lastMsg is found, or messages are empty
              var response = []
              friendsList.forEach(function(friend){
                let messagesFromThisFriend = messages.filter(
                  message => message.senderId == friend.id
                )
                let count = 0;
                if (messagesFromThisFriend){
                  for (let message of messagesFromThisFriend){
                    if(message._id != friend.lastMsgId){
                      count += 1;
                    } else {
                      break;
                    }
                  }  
                }
                response.push({
                  'name': friend.name,
                  'id': friend.id,
                  'lastMsgId': friend.lastMsgId,
                  'unReadMessageCount': count
                })
                console.log('----------------------------------------')
              })
              res.json({
                'name': user.name,
                'id': user._id,
                'icon': user.icon,
                'friends': response
              })  
            })
            .catch(err => res.status(404).json({success: false}));
          })
          .catch(err => res.status(404).json({success: false}));
      })
      .catch(err => res.status(404).json({success: false}));
    return;
  } else {
    res.json('');
    return;
  }
});


// @route   POST login
// @desc    User login action
// @access  Public
router.post('/login', upload.array(), (req, res) => {
  User.findOne({name: req.body.username})
    .then(user => {
      if (user){
        if (req.body.password == user.password) {
          req.session.userId = user._id
          user.status = 'online';
          user.save().then(user => {
            console.log(user)
            res.redirect('/load')
            return;
          });
        } else {
          res.json('Login failure')
        }
      } else {
        res.json('Login failure')
      }
    })
    .catch(err => res.status(404).json({success: false}));
});


// @route   GET logout
// @desc    Logout from current session
// @access  Public
router.get('/logout', function (req, res) {
  console.log(req.session.userId)
  if (req.session.userId) {
    User.findOne({_id: req.session.userId})
    .then(user => {
      user.status = 'offline';
      user.save().then(user => {
        req.session.destroy()
        res.json('')
      })
    })
    .catch(err => res.status(404).json({success: false}));
  } else {
    res.json('')
  }
})


// @route   GET userInfo
// @desc    Get user Information
// @access  Public
router.get('/getuserinfo', function (req, res) {
  console.log(req.session.userId)
  if (req.session.userId) {
    User.findOne({_id: req.session.userId})
    .then(user => {
      res.json({
        'name': user.name,
        'mobileNumber': user.mobileNumber,
        'homeNumber': user.homeNumber,
        'address': user.address
      })
    })
    .catch(err => res.status(404).json({success: false}));
  } else {
    res.json('')
  }
})


// @route PUT userInfo
// @desc Update user information
// @access Public
router.put('/saveuserinfo', upload.array(), function (req, res) {
  res.json(req.body)
  if (req.session.userId) {
    User.findOne({_id: req.session.userId})
    .then(user => {
      user.mobileNumber = req.body.mobileNumber
      user.homeNumber = req.body.homeNumber
      user.address = req.body.address
      user.save().then(user => {
        res.json(user)
      })
    })
    .catch(err => res.status(404).json({success: false}));
  } else {
    res.json('')
  }

})


// @route GET friendid
// @desc Get conversation of this friend
// @access Public
router.get('/getconversation/:friendid', function (req, res) {
  if (req.session.userId) {
    User.findOne({_id: req.params.friendid})
    .then(friend => {
      Message.find({ $or: [
        // This query cannot change because all messages between 2 parties are needed
        {senderId: req.session.userId, receiverId: friend._id}, 
        {senderId: friend._id, receiverId: req.session.userId}]})
        .sort({date: -1, time: -1})
        .then(messages => {
          console.log(messages)
          if (messages) {
            //A loop to find latest message from friend
            let lastestMsgIdFromFriend = 0;
            for (let message of messages){
              if(message.senderId == friend._id){
                lastestMsgIdFromFriend = message._id
                break;
              }
            }        
            console.log(lastestMsgIdFromFriend)
            User.findOneAndUpdate(
              {_id: req.session.userId, "friends.name": friend.name}, 
              {$set: {"friends.$.lastMsgId": lastestMsgIdFromFriend}},
              {new: true, useFindAndModify: false}
            ).then(user => {
              res.json({
                'friend_name': friend.name,
                'friend_icon': friend.icon,
                'friend_status': friend.status,
                'messages': messages
              })
            })
          }
        })
        .catch(err => res.status(404).json({success: false}));
      })
      .catch(err => res.status(404).json({success: false}));
  } else {
    res.json('No session for this client')
  }
})


// @route   POST postmessage
// @desc    Create a new message with friend
// @access  Public
router.post('/postmessage/:friendid', upload.array(), (req, res) => {
  if (req.session.userId) {
    const newMessage = new Message({
      senderId: req.session.userId,
      receiverId: req.params.friendid,
      message: req.body.message,
      date: req.body.date,
      time: req.body.time 
    });
  
    newMessage.save().then(message => {
      // Consider updating lastMsg of this friend? 
      // But it requires 2 User.find (find friend.name and User)
      res.json({
        'id': message._id,
        'message': message.message,
        'senderId': message.senderId,
        'receiverId': message.receiverId
      })
    })
    .catch(err => res.status(404).json({success: false}));  
  } else {
    res.json('No session for this client')
  }
});


// @route   DELETE deletemessage/:msgid
// @desc    Delete a message and update lastMsgId
// @access  Public
router.delete('/deletemessage/:msgid', (req, res) => {
  if (req.session.userId) {
    Message.findById(req.params.msgid)
    .then(message => {
      if (!message) {
        res.json('No message with ID: ' + req.params.msgid)
        return;
      }
      if (message.senderId != req.session.userId) {
        res.json('Cannot delete a message sent by friends!')
        return;
      }
      message.remove().then(() => {
        let friend_id;
        if (req.session.userId == message.senderId) {
          friend_id = message.receiverId
        } else {
          friend_id = message.senderId
        }
        User.findOne({_id: req.session.userId})
          .then(user => {
            console.log(user.name)
            // Use user.name to find himself in friends' records
            Message.find({
              senderId: req.session.userId, receiverId: friend_id
            })
              .sort({date: -1, time: -1})
              .then(messages => {
                let lastMsgId = 0;
                if (messages) {
                  lastMsgId = messages[0]._id
                }
                User.findOneAndUpdate(
                  {_id: friend_id, "friends.name": user.name}, 
                  {$set: {"friends.$.lastMsgId": lastMsgId}},
                  {new: true, useFindAndModify: false}
                ).then(friend => {
                  res.json('Message is successfully deleted')
                })

              })
              .catch(err => res.status(404).json({success: false}));      
          })
          .catch(err => res.status(404).json({success: false}));      
        })
      .catch(err => res.status(404).json({success: false}));
    })
    .catch(err => res.status(404).json({success: false}));
  } else {
    res.json('No session for this client')
  }
});


// @route   Get new messages of a friend
// @desc    Get new messages
// @access  Public
router.get('/getnewmessages/:friendid', (req, res) => {
  if (req.session.userId) {
    Message.find({ $or: [
      {senderId: req.session.userId, receiverId: req.params.friendid}, 
      {senderId: req.params.friendid, receiverId: req.session.userId}]})
      .sort({date: -1, time: -1})
      .then(messages => {
        if (messages) {
          // allMessagesIds
          console.log(messages)
          let allMessagesIds = messages.map(message => message._id)
          User.findOne({_id: req.session.userId})
            .then(user => {
              // Get lastMsgId of that friend with id
              let lastMsgId;
              let friends = user.friends;
              friends.forEach(function(friend){
                if (friend.userId == req.params.friendid){
                  lastMsgId = friend.lastMsgId
                }
              })    
  
              // Loop through messages with lastMsgId
              // Push to newMessages if ID not same
              let newMessages = [];
              let newLastMsgId = lastMsgId;
              let count = 0;
          
              for (let message of messages){
                if (message.senderId == req.params.friendid){
                  if (message._id == lastMsgId) {
                    break;
                  } else {
                    if (count == 0) {
                      newLastMsgId = message._id
                    }
                    newMessages.push(message)
                    count += 1;
                  }
                }
              }  
              // Update lastMsgId of user record
              friend_index = user.friends.findIndex(
                (friend => friend.userId == req.params.friendid)
              )
              user.friends[friend_index].lastMsgId = newLastMsgId
              user.save().then(user => {
                User.findOne({_id: req.params.friendid})
                  .then(friend => {
                    res.json({
                      'friendName': friend.name,
                      'friendId': friend._id,
                      'friendStatus': friend.status,
                      'newMessages': newMessages,
                      'allMessageIds': allMessagesIds
                    })      
                  })
                  .catch(err => res.status(404).json({success: false}));                  
              })
            })
            .catch(err => res.status(404).json({success: false}));
        } else {
          res.json('No messages between these 2 users')
        }
      })
      .catch(err => res.status(404).json({success: false}));
  } else {
    res.json('No session for this client')
  }
})


// @route   Get new messages sum from a friend
// @desc    Get new messages
// @access  Public
router.get('/getnewmsgnum/:friendid', (req, res) => {
  if (req.session.userId) {
    Message.find({senderId: req.params.friendid, receiverId: req.session.userId})
      .sort({date: -1, time: -1})
      .then(messages => {
        if (messages) {
          // allMessagesIds
          User.findOne({_id: req.session.userId})
            .then(user => {
              // Get lastMsgId of that friend with id
              let lastMsgId;
              let friends = user.friends;
              friends.forEach(function(friend){
                if (friend.userId == req.params.friendid){
                  lastMsgId = friend.lastMsgId
                }
              })    
              // Loop through messages with lastMsgId
              // Push to newMessages if ID not same
              let newMessages = [];
          
              for (let message of messages){
                if (message.senderId == req.params.friendid){
                  if (message._id == lastMsgId) {
                    break;
                  } else {
                    newMessages.push(message)
                  }
                }
              }
              res.json({
                'friendId': req.params.friendid,
                'newMessageCount': newMessages.length
              })
              return;
            })
            .catch(err => res.status(404).json({success: false}));
        } else {
          res.json('No messages between these 2 users')
        }
      })
      .catch(err => res.status(404).json({success: false}));
  } else {
    res.json('No session for this client')
  }
})

module.exports = router;
