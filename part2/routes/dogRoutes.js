const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', async (req,res) => {
  try {
    const [dogs] = await db.query('SELECT * FROM Dogs');
    res.json(dogs);
  } catch (err) {
    console.error('Error fetching dogs for route /api/dogs:', err);
    res.status(500).json({error: 'Failed to fetch dogs through /api/dogs route'});
  }
});

module.exports = router;
