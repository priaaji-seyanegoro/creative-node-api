const route = require("express").Router();
const verify = require("./verifyToken");

route.get("/", verify, (req, res) => {
  res.send(req.user);
});

module.exports = route;
