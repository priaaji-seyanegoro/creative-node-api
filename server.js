const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

// Import Routes
const authRoute = require("./routes/authRoute");
const podcastRoute = require("./routes/podcastRoute");
const postsRoute = require("./routes/posts");
const likesRoute = require("./routes/likesRoute");
const followRoute = require("./routes/followRoute");

require("dotenv").config();

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
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("its working");
});

//Route Middleware
app.use("/api/user/auth", authRoute);
app.use("/api/podcast", podcastRoute);
app.use("/api/posts", postsRoute);
app.use("/api/likes", likesRoute);
app.use("/api/follow", followRoute);

//error handling middleware
app.use((err, req, res, next) => {
  res.status(422).send({
    error: err,
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log("app is running onport 5000");
});
