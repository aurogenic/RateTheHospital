const express = require('express');
const app = express.Router();
const path = require('path');
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


app.get('/searchpage', (req, res) => {
  res.status(200).render('searchpage', decodeToken(req));
})


app.get('/search', async (req, res) => {
const searchTerm = req.query.exp;

if (!searchTerm) {
    return res.status(400).json({ error: 'Search term is required' });
}

try {
    const results = await database.searchHospitals(searchTerm);
    res.json(results);
} catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
})

app.get('/nearby', async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Latitude and longitude must be valid numbers' });
    }
  
    let distanceLimit = 10;
    let hospitals = [];
  
    while (hospitals.length < 10 && distanceLimit <= 50) {
      try {
        hospitals = await database.getNearbyHospitals(lat, lon, distanceLimit);
        distanceLimit += 5;
      } catch (error) {
        console.error('Error fetching nearby hospitals:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  
    if (hospitals.length === 0) {
      return res.status(404).json({ message: 'No hospitals found within the maximum search distance' });
    }
  
    res.json(hospitals);
  });


app.get('/locate', async (req, res) => {
    try {
      const { state, district, city } = req.query;
  
      const stateValue = state === 'all' ? null : state;
      const districtValue = district === 'all' ? null : district;
      const cityValue = city.toLowerCase() === 'all' ? null : city;
      let results = [];
      if (stateValue && districtValue && cityValue) {
        results = await database.getHospitalsByLocation(stateValue, districtValue, cityValue);
      } 
      else if (cityValue){
        results = await database.getHospitalsByCity(cityValue);
      }
      else if (districtValue){
        results = await database.getHospitalsByDistrict(districtValue);
      }
      else if (stateValue){
        results = await database.getHospitalsByState(stateValue);
      }
  
      res.json(results);
    } catch (error) {
      console.error('Error in /locate endpoint', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

function decodeToken(req) {
  const token = req.cookies.token;
  if (!token) {
      return {};
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
          return {};
      }

      user_id = decoded.user_id;
      username = decoded.username;
      return {user_id, username, username}

  });
}

module.exports = app;