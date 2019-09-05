const express = require('express');
const parseurl = require('parseurl')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session')
const cors = require('cors')

const items = require('./routes/api/items')
const chats = require('./routes/chats');
const path = require('path');

const app = express();

// Bodyparser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// DB Config
const db_uri = require('./config/keys').mongoURI;

// Connect to Mongo
mongoose
  .connect(db_uri, { useNewUrlParser: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// Serve icons from public folder
app.use(express.static('public'));

// Use Session
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  maxAge: Date.now() + (3600000)
}))

app.use(function (req, res, next) {
  if (!req.session.views) {
    req.session.views = {}
  }

  // get the url pathname
  var pathname = parseurl(req).pathname

  // count the views
  req.session.views[pathname] = (req.session.views[pathname] || 0) + 1

  next()
})


// Use Routes
app.use('/', chats);
app.use('/api/items', items)
app.use(cors())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(
      path.resolve(__dirname, 'client', 'build', 'index.html')
    );
  });
}

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
