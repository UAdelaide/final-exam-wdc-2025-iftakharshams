var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2/promise');

/* var indexRouter = require('./routes/index'); */
/* var usersRouter = require('./routes/users'); */

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* app.use('/', indexRouter); */
/* app.use('/users', usersRouter); */


const PORT = process.env.PORT || 8080;

/* ------ DB connection settings (override with env vars) ------ */
const pool = mysql.createPool({
  host: 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME     || 'DogWalkService',
  waitForConnections: true,
  connectionLimit: 10
});

/* ----------  Seed demo rows (idempotent) ---------- */
async function seed() {
  try {
    /* USERS */
    await pool.query(`
      INSERT IGNORE INTO Users (username,email,password_hash,role) VALUES
        ('alice123','alice@example.com','hashed123','owner'),
        ('bobwalker','bob@example.com','hashed456','walker'),
        ('carol123','carol@example.com','hashed789','owner'),
        ('davewalker','dave@example.com','hashed000','walker'),
        ('emilyowner','emily@example.com','hashed111','owner');
    `);

    /* DOGS */
    await pool.query(`
      INSERT IGNORE INTO Dogs (owner_id,name,size) VALUES
        ((SELECT user_id FROM Users WHERE username='alice123'),'Max','medium'),
        ((SELECT user_id FROM Users WHERE username='carol123'),'Bella','small'),
        ((SELECT user_id FROM Users WHERE username='alice123'),'Rocky','large'),
        ((SELECT user_id FROM Users WHERE username='carol123'),'Charlie','medium'),
        ((SELECT user_id FROM Users WHERE username='emilyowner'),'Luna','large');
    `);

    /* WALK REQUESTS */
    await pool.query(`
      INSERT IGNORE INTO WalkRequests (dog_id,requested_time,duration_minutes,location,status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name='Max'),    '2025-06-10 08:00:00',30,'Parklands','open'),
        ((SELECT dog_id FROM Dogs WHERE name='Bella'),  '2025-06-10 09:30:00',45,'Beachside Ave','accepted'),
        ((SELECT dog_id FROM Dogs WHERE name='Rocky'),  '2025-06-11 10:00:00',60,'Riverbank Rd','open'),
        ((SELECT dog_id FROM Dogs WHERE name='Charlie'),'2025-06-12 07:30:00',30,'Central Park','open'),
        ((SELECT dog_id FROM Dogs WHERE name='Luna'),   '2025-06-12 18:00:00',45,'Sunset Trail','open');
    `);
  } catch (err) {
    console.error('🔴  Seeding failed:', err);
  }
}

/* ----------  ROUTES  ---------- */

/* /api/dogs  — all dogs with size + owner username */
app.get('/api/dogs', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.name AS dog_name,
             d.size,
             u.username AS owner_username
        FROM Dogs d
        JOIN Users u ON u.user_id = d.owner_id;
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch dogs' });
  }
});

/* /api/walkrequests/open — list of open requests */
app.get('/api/walkrequests/open', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT wr.request_id,
             d.name  AS dog_name,
             wr.requested_time,
             wr.duration_minutes,
             wr.location,
             u.username AS owner_username
        FROM WalkRequests wr
        JOIN Dogs  d ON d.dog_id  = wr.dog_id
        JOIN Users u ON u.user_id = d.owner_id
       WHERE wr.status = 'open';
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch open walk requests' });
  }
});

/* /api/walkers/summary — ratings + completed walks per walker */
app.get('/api/walkers/summary', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.username AS walker_username,
             COUNT(r.rating_id)     AS total_ratings,
             ROUND(AVG(r.rating),2) AS average_rating,
             COUNT(r.rating_id)     AS completed_walks
        FROM Users u
   LEFT JOIN WalkRatings r ON r.walker_id = u.user_id
       WHERE u.role = 'walker'
    GROUP BY u.user_id;
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch walker summary' });
  }
});

/* ----------  START ---------- */
(async () => {
  await seed(); // put demo data in place
  app.listen(PORT, () =>
    console.log(`🚀  API running on http://localhost:${PORT}`)
  );
})();

module.exports = app;
