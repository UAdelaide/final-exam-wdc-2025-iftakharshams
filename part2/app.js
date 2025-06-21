const express = require('express');
const path = require('path');
require('dotenv').config();
//q13 added sessions
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

//q13 added sessions
app.use(session({
  name: 'dogwalk.sid',
  secret: 'secretKey123',
  resave: false,
  saveUninitialized: false
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');
//question 17
const dogRoutes = require('./routes/dogRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
//added for question 17
app.use('/api/dogs', dogRoutes);

// Export the app instead of listening here
module.exports = app;
