const route = require("express").Router();
const User = require("../models/User");
const { registerValidation } = require("../validation");

route.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  //VALIDATE BEFORE STORE
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //CHECK USER ALREADY EXIST
  const emailExits = await User.findOne({ email: email });
  if (emailExits) return res.status(400).send("email already exist");

  //CREATE NEW USER
  const user = new User({
    name: name,
    email: email,
    password: password,
  });

  try {
    const savedUser = await user.save();
    res.send(savedUser);
  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = route;
