const express = require('express');
const jwt = require('jsonwebtoken');
const app = express.Router();
require('dotenv').config()

let database;
import('../database.mjs')
  .then((db) => {
    database = db;
  })
  .catch((error) => {
    console.error('Error loading database module:', error);
  });


app.get('/', (req, res) => {
  res.status(200).render('home', decodeToken(req))
});

function decodeToken(req) {
  const token = req.cookies.token;
  if (!token) {
      return {user_id:0};
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return {user_id:0};    
      }

      user_id = decoded.user_id;
      username = decoded.username;
      return {user_id, username, username}

  });
}

app.get('/admin_login', (req, res) => {
  res.status(200).render('admin_login');
})

app.get('/get_hospital/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const hospital = await database.getHospital(id);
    if (hospital) {
      res.status(200).json(hospital);
    } else {
      res.status(404).json({ message: 'Hospital not found' });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error"});
  }

});


app.get('/add_hospital', (req, res) => {
  res.render('hospitalregister', {user_id:req.user_id});
});

app.post('/add_hospital', async (req, res) => {
const {
    name, lat, lon, address, location, hospital_type, description, 
    total_beds, total_doctors, total_nurses, facilities, specialities, 
    contact_number, email, password
} = req.body;

try {
    const emailExists = await database.checkIfEmailExists(email);
    if (emailExists) {
        return res.status(400).json({ error: 'Email is already registered' });
    }

    const hospitalId = await database.createHospital(
        name, lat, lon, address, location, hospital_type, description, 
        total_beds, total_doctors, total_nurses, facilities, specialities, 
        contact_number, email, password
    );

    if (hospitalId === 0) {
        return res.status(500).json({ error: 'Failed to create hospital' });
    }

    const token = jwt.sign({ hospitalId, name }, process.env.JWT_SECRET, {
        expiresIn: '2h'
    });

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        maxAge: 2 * 60 * 60 * 1000 // 2 hours expiration
    });

    res.status(201).json({ message: 'Hospital created successfully', hospitalId });
} catch (error) {
    console.error('Error in /add_hospital:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});

app.get('/dashboard', async (req, res) => {
  try {
    const id = await get_id(req); // Await the result from get_id
    if (!id) {
      console.log("No ID found");
      return res.redirect('/admin_login');
    }
    res.status(200).render('dashboard', { id });
  } catch (error) {
    console.error("Error in /dashboard route:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function get_id(req) {
  const token = req.cookies.hospital_id;
  if (!token) {
    return 0; // Return 0 directly if token is missing
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err);
        return resolve(0); // Resolve with 0 if verification fails
      }
      resolve(decoded.hospital_id); // Resolve with hospital_id if token is valid
    });
  });
}
module.exports = app;