const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// Add dayjs library for validation of date format
const dayjs = require('dayjs');

// Middleware to encode the post request
app.use(express.urlencoded({extended: false}));

// Add mongoose
const mongoose = require('mongoose');

// Connect to database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, err => err ? console.log(err) : console.log('Connected to database'));

// Define Schema
const userLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
});

// Create model and assign it to url variable
const User = mongoose.model('userLog', userLogSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// POST /api/users create new User
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  User.create({ username: username }, function(err, data) {
    if (err) return console.log(err);
    res.json({ username: data.username, _id: data._id });
    });
});

// POST /api/users/:_id/exercises update exercise log
app.post('/api/users/:_id/exercises', (req, res) => {
  
  const userId = req.params._id;
  const desc = req.body.description;
  const duration = req.body.duration;
  let date = req.body.date;
  let logDate;
  
  if (date === undefined) {
    date = Date.now();
    logDate = new Date(date).toDateString();
  } else if(dayjs(date).isValid()) {
    logDate = new Date(date).toDateString();
  } else {
    res.json({ error: 'Invalid date' });
  };
  
  User.findById({_id: userId}, function (err, data) {
    if (err) return console.log(err);
    data.log.push({
      description: desc,
      duration: duration,
      date: logDate
    });
    data.count++;
    data.save((err, updatedUser) => {
      if(err) return console.log(err);
      const index = updatedUser.count - 1;
      res.json({
        username: updatedUser.username,
        description: updatedUser.log[index].description,
        duration: updatedUser.log[index].duration,
        date: updatedUser.log[index].date,
        _id: updatedUser._id
      });
    })
  });
});

// GET request to /api/users to get all users
app.get('/api/users', (req, res) => {
  User.find({}, function (err, data) {
    if (err) return console.log(err);
    const usersOnly = data.map(user => {
      return {
        username: user.username,
        _id: user._id
      }
    });
    res.send(usersOnly);
  });
});

// GET request to /api/users/:_id/logs to get exercise log of a user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;
  User.findById({_id: userId}, function (err, data) {
    if (err) return console.log(err);
    const logNoId = data.log.map(log => {
      return {
        description: log.description,
        duration: log.duration,
        date: log.date
      }
    });
    res.json({
      username: data.username,
      count: data.count,
      _id: data._id,
      log: logNoId
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
