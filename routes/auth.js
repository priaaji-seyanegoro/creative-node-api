const route = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { registerValidation, loginValidation } = require("../validation");

route.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  //VALIDATE BEFORE STORE
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //CHECK USER ALREADY EXIST
  const emailExits = await User.findOne({ email: email });
  if (emailExits) return res.status(400).send("email already exist");

  //HASH PASSWORD
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  //CREATE NEW USER
  const user = new User({
    name: name,
    email: email,
    password: hashPassword,
  });

  try {
    const savedUser = await user.save();
    res.send({
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

route.post("/login", async (req, res) => {
  const { name, email, password } = req.body;

  //VALIDATE BEFORE STORE
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //CHECK USER NOT ALREADY EXIST
  const user = await User.findOne({ email: email });
  if (!user) return res.status(400).send("email not exist");

  //CHECK PASSWORD CORRECT
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).send("Invalid password");

  //CREATED AND ASSIGN TOKEN
  const token = jwt.sign({ _id: user.id }, process.env.TOKEN_SECRET);
  res.header("auth-token", token).send({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
    },
  });
});
module.exports = route;
