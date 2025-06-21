const express = require('express');
var router = express.Router();
var db = require('../db/db');

// /api/walkers/summary
// (walker_username, total_ratings, average_rating, completed_walks)
router.get('/', async function(req, res) {
    try {
        const [results] = await db.query(`
        SELECT
            Users.username AS walker_username,
            COUNT(WalkRatings.rating_id) AS total_ratings,
            AVG(WalkRatings.rating) AS average_rating,
            SUM(CASE WHEN WalkRequests.status = 'completed' THEN 1 ELSE 0 END) AS completed_walks
        FROM Users
        LEFT JOIN WalkRatings ON Users.user_id = WalkRatings.walker_id
        LEFT JOIN WalkRequests ON WalkRatings.request_id = WalkRequests.request_id
        WHERE Users.role = 'walker'
        GROUP BY Users.user_id;
        `);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch walkers' });
    }
});

module.exports = router;