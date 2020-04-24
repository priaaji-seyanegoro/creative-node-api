const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = express();

// Import Routes
const authRoute = require("./routes/auth");
const podcastRoute = require("./routes/podcastApi");
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
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("its working");
});

//Route Middleware
app.use("/api/user", authRoute);
app.use("/api/podcast", podcastRoute);
app.use("/api/posts", postsRoute);

//error handling middleware
app.use((err, req, res, next) => {
  res.status(422).send({
    error: err,
  });
});

app.listen(4000, () => {
  console.log("app is running onport 4000");
});
