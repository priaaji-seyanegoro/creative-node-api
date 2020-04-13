const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();

// Import Routes
const authRoute = require("./routes/auth");
const postsRoute = require("./routes/posts");

dotenv.config();

//Connect to DB
mongoose.connect(
  process.env.DB_CONNECT,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("connected to db");
  }
);

// Middleware
app.use(express.json());

app.get("/", (req, res) => {
  res.send("its working");
});

//Route Middleware
app.use("/api/user", authRoute);
app.use("/api/posts", postsRoute);

app.listen(4000, () => {
  console.log("app is running onport 4000");
});
