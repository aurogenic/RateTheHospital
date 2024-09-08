const express = require('express');
require('dotenv').config()

let database;
import('./database.mjs')
  .then((db) => {
    database = db;
  })
  .catch((error) => {
    console.error('Error loading database module:', error);
  });
//importing routes
const simple = require('./routes/simple');
const auth = require('./routes/auth');
const upload = require('./routes/upload');

const app = express();
const port = process.env.PORT || 80;

//joining routes
app.use('/', simple);
app.use('/', auth);
app.use('/', upload);


app.listen(port, ()=>{
    console.log(`app is running on port ${port}`);
})