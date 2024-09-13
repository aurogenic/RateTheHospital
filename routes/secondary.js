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


  
  app.get("/profile", (req, res) => {
    res.send("you are logged in")
  })

app.get("/writefeedback", async (req,  res)=>{
  try {
    const user_id = req.user_id;
    const username = req.username;
    const hospital_id = req.query.id;
    const hospital = await database.getHospital(hospital_id);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }
    console.log(hospital);

    hospital.facilities = JSON.parse(hospital.facilities);
    res.render("feedback", {user_id, hospital, username});
  }
  catch(err){
    console.error("error adding feedback:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


  app.post('/getUserReviews', async (req, res) => {
    const user_id = req.user_id;
    const page = req.body.page || 1;
  
    try {
      const results = await database.getUserReviews(user_id, page);
  
      res.json({
        success: true,
        page: parseInt(page),
        reviews: results,
      });
    } catch (error) {
      console.error("Error fetching user reviews", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reviews",
      });
    }
  });


module.exports = app;