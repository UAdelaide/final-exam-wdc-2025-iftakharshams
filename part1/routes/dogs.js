const express = require('express');
var router = express.Router();
var db = require('../db/db');

// /api/dogs route  (dog_name, size, owner_username)
router.get('/', async function(req, res) {
    try {
        const [results] = await db.query(`
        SELECT
            Dogs.name AS dog_name,
            Dogs.size,
            Users.username AS owner_username
        FROM Dogs
        JOIN Users ON Dogs.owner_id = Users.user_id
        `);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

module.exports = router;
