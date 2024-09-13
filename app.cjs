const express = require("express");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();

let database;
import("./database.mjs")
  .then((db) => {
    database = db;
  })
  .catch((error) => {
    console.error("Error loading database module:", error);
  });
//importing routes
const search = require("./routes/search");
const primary = require("./routes/primary");
const auth = require("./routes/auth");
const secondary = require("./routes/secondary");
const upload = require("./routes/upload");
const hospital = require("./routes/hospital");
const admin = require("./routes/admin");
const app = express();
const port = process.env.PORT || 80;

app.use(express.json());
app.use(cookieParser());

app.use("/static", express.static("static"));
app.use(express.urlencoded({ extended: true }));

//set the template engine for pug
app.set("view engine", "pug");

//set the views directory
app.set("views", path.join(__dirname, "views"));

//joining routes
app.use("/admin", admin);
app.use("/", search);
app.use("/", primary);
app.use("/", hospital)
app.use("/", auth);
app.use("/", verifyToken);
app.use("/", secondary);
app.use("/", upload);


app.listen(port, () => {
  console.log(`app is running on port ${port}`);
});


function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
      return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
          console.error('Token verification failed:', err);
          return res.redirect('/login');
      }

      req.user_id = decoded.user_id;
      req.username = decoded.username;

      next();
  });
}