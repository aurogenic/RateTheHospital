const express = require('express');
const app = express.Router();
const multer = require('multer');
const path = require('path');
require('dotenv').config()

let database;
import('../database.mjs')
  .then((db) => {
    database = db;
  })
  .catch((error) => {
    console.error('Error loading database module:', error);
  });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext); // Unique filename
    }
  });
  
  const upload = multer({ storage });


  app.post('/add_review', upload.array('attachments'), async (req, res) => {
    const {
      hospital_id, review_content, ratings, overall_rating
    } = req.body;
    const user_id = req.user_id;
  
    const attachments = req.files.map(file => file.filename);
  
    try {
      if (!hospital_id || !user_id || !overall_rating) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      const reviewId = await database.createReview(
        hospital_id, user_id, review_content, attachments, ratings, overall_rating
      );
  
      if (reviewId === 0) {
        return res.status(500).json({ error: 'Failed to create review' });
      }
  
      res.status(201).json({ message: 'Review created successfully', reviewId });
    } catch (error) {
      console.error('Error in /add_review:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

module.exports = app;