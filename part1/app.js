var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let db;

(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      // host: 'localhost',
      socketPath: '/var/run/mysqld/mysqld.sock',
      user: 'root',
      password: 'root'
    });

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      // host: 'localhost',
      socketPath: '/var/run/mysqld/mysqld.sock',
      user: 'root',
      password: 'root',
      database: 'DogWalkService'
    });

    // Add record to show up back-end implemetation
    await db.execute(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES
      ('alice123', 'alice@example.com', 'hashed123','owner'),
      ('bobwalker', 'bob@example.com', 'hashed456','walker'),
      ('carol123', 'carol@example.com', 'hashed789','owner'),
      ('davewalker', 'dave@example.com',   'hashed000',  'walker'),
      ('emilyowner', 'emily@example.com',  'hashed111',  'owner')
    `);

    await db.execute(`
      INSERT INTO Dogs (owner_id, name, size)
      VALUES
      ((SElECT user_id FROM Users WHERE email = 'alice@example.com' LIMIT 1),'Max', 'medium'),
      ((SElECT user_id FROM Users WHERE email = 'carol@example.com' LIMIT 1), 'Bella', 'small'),
      ((SElECT user_id FROM Users WHERE email = 'alice@example.com' LIMIT 1), 'Rocky', 'large'),
      ((SElECT user_id FROM Users WHERE email = 'carol@example.com' LIMIT 1), 'Charlie', 'medium'),
      ((SElECT user_id FROM Users WHERE email = 'alice@example.com' LIMIT 1), 'Luna', 'large')
    `);

    await db.execute(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      VALUES
      ((SELECT dog_id FROM Dogs WHERE name = 'Max' LIMIT 1), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Bella' LIMIT 1), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Rocky' LIMIT 1), '2025-06-11 10:00:00', 60, 'Riverbank Rd', 'completed'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Charlie' LIMIT 1), '2025-06-12 07:30:00', 30, 'Central Park', 'completed'),
      ((SELECT dog_id FROM Dogs WHERE name = 'Luna' LIMIT 1), '2025-06-12 18:00:00', 45, 'Sunset Trail', 'open')
    `);

    await db.execute(`
      INSERT INTO WalkApplications (request_id, walker_id, status)
      VALUES
        (3, 2, 'accepted'),
        (4, 2, 'accepted'),
        (1, 5, 'pending')
    `);

    await db.execute(`
      INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating)
      VALUES
        (3, 2, 1, 5),
        (4, 2, 3, 4)
    `);
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
