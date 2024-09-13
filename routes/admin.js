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


  app.get('/admin/login', (req, res) => {
    res.status(200).render('admin_login');
  })

  app.post('/hospital_login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    try {
      const hospital = await database.hospitalLogin(email, password);
      if (hospital) {
        const {hospital_id, name} = hospital
        const token = jwt.sign({hospital_id, name }, process.env.JWT_SECRET, {
          expiresIn: '2h'
      });
        res.cookie('hospital_id', token, { httpOnly: true, secure: process.env.JWT_SECRET, sameSite: 'strict' });
        res.status(200).json({ success: true, hospital });
      } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Error during hospital login:', error);
      res.status(500).json({ message: 'An error occurred during login', error });
    }
  });
// Route to get hospital data by ID

  // Endpoint to update hospital details
app.put('/admin/update_hospital/:hospital_id', async (req, res) => {
    const { hospital_id } = req.params;
    const {
      name, lat, lon, address, location, hospital_type, description, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email, password
    } = req.body;
  
    try {
      const affectedRows = await database.updateHospital(
        hospital_id,
        name, lat, lon, address, location, hospital_type, description, total_beds, total_doctors, total_nurses, facilities, specialists, contact_number, email,  password
      );
  
      if (affectedRows > 0) {
        res.status(200).json({
          success: true,
          message: 'Hospital details updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Hospital not found'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating hospital details',
        error: error.message
      });
    }
  });




function get_id(req) {
  const token = req.cookies.token;
  if (!token) {
      return {user_id:0};
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return {user_id:0};    
      }

      return decoded.hospital_id

  });
}
module.exports = app;