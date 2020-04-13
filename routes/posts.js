const route = require("express").Router();
const verify = require("./verifyToken");

route.get("/", verify, (req, res) => {
  res.send("this private route can be access");
});

module.exports = route;
