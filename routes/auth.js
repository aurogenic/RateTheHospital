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


app.get("/login", (req, res) => {
  res.status(200).render('login', decodeToken(req));
}) 

app.get("/logout", (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

app.get("/signup", (req, res) => {
  res.status(200).render('signup', decodeToken(req));
});


app.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required' });
  }

  try {
    const result = await database.login(mobile, password);

    if (result.err) {
      return res.status(401).json({ error: result.err });
    }

    const token = jwt.sign(
      { user_id: result.user_id, username: result.name },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ err: 'Internal Server Error' });
  }
});

app.post('/signup', async (req, res) => {
  const { username, mobile, password } = req.body;

  if (!username || !mobile || !password) {
      return res.status(400).json({ error: 'All fields are required' });
  }

  try {
      const existingUser = await database.getUserByMobile(mobile);
      if (existingUser) {
          return res.status(400).json({ error: 'Phone number taken' });
      }

      const userId = await database.createUser(username, mobile, password);
      if (userId > 0) {
          return res.status(200).json({ error: 'signed up.' });
      } else {
          return res.status(500).json({ error: 'Error creating user' });
      }
  } catch (error) {
      console.error('Error during signup:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
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



module.exports = app;