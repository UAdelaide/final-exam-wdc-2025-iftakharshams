var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

var db;

(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      socketPath: '/var/run/mysqld/mysqld.sock',
      host: '127.0.0.1',
      user: 'root',
      password: '', // Set MySQL root password
      database: 'DogWalkService'
    });

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS DogWalkService');
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      socketPath: '/var/run/mysqld/mysqld.sock',
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // Create a table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS Dogs (
        dog_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        size ENUM('small', 'medium', 'large') NOT NULL
      )
    `);

    // Insert data if table is empty
    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (rows[0].count === 0) {
      await db.execute(`
        INSERT INTO Dogs (name, size) VALUES
        (  'Max',  'medium'),
        (  'Bella',  'small'),
        (  'Toro',  'large'),
        (  'Min',  'small'),
        (  'Noel',  'large')
      `);
    }
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

// Route to return dogs as JSON
app.get('/', async (req, res) => {
  try {
    const [dogs] = await db.execute('SELECT * FROM Dogs');
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));


// routers
var dogsRouter = require('./routes/dogs');
var walkersRouter = require('./routes/walkers');
var walkRequestsRouter = require('./routes/walkrequests');

app.use('/api/dogs', dogsRouter);
app.use('/api/walkers/summary', walkersRouter);
app.use('/api/walkrequests/open', walkRequestsRouter);



module.exports = app;
