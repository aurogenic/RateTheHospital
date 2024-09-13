const express = require('express');
const app = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config()

let database;
import('../database.mjs')
  .then((db) => {
    database = db;
  })
  .catch((error) => {
    console.error('Error loading database module:', error);
  });

app.get('/hospital', async (req, res) => {
    const hospital_id = req.query.id;
    if (!hospital_id) {
        return res.status(400).json({ error: 'Invalid hospital ID' });
    }
    const hospital = await database.getHospital(hospital_id);
    if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
    }
    res.render('hospital', {hospital});
})

app.get('/get_hospital_rating', async (req, res) => {
    const { hospital_id } = req.query;

    try {
        const ratingData = await database.getHospitalRating(hospital_id);
        if (ratingData) {
            res.json({ success: true, data: ratingData });
        } else {
            res.json({ success: false, message: 'Failed to fetch ratings or no ratings available' });
        }
    } catch (error) {
        console.error('Error fetching hospital rating', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


module.exports = app;