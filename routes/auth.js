const route = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { registerValidation, loginValidation } = require("../validation");

route.get("/testing", async (req, res) => {
  const user = await User.find();

  res.send(user);
});

route.post("/register", async (req, res) => {
  const { namePodcast, email, password } = req.body;

  //VALIDATE BEFORE STORE
  const { error } = registerValidation(req.body);
  if (error)
    return res.status(400).send({
      status: false,
      error: error.details[0].message,
    });

  //CHECK USER ALREADY EXIST
  const namePodcastExist = await User.findOne({ namePodcast: namePodcast });
  if (namePodcastExist)
    return res.status(400).send({
      status: false,
      error: "Name Podcast already exist",
    });

  const emailExits = await User.findOne({ email: email });
  if (emailExits)
    return res.status(400).send({
      status: false,
      error: "Email already exist",
    });

  //HASH PASSWORD
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  //CREATE NEW USER
  const user = new User({
    avatar: "no image",
    namePodcast: namePodcast,
    email: email,
    password: hashPassword,
  });

  try {
    const savedUser = await user.save();
    res.send({
      user: {
        _id: savedUser._id,
        namePodcast: savedUser.namePodcast,
        email: savedUser.email,
      },
      status: true,
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

route.post("/login", async (req, res) => {
  const { email, password } = req.body;

  //VALIDATE BEFORE STORE
  const { error } = loginValidation(req.body);
  if (error)
    return res.status(400).send({
      status: false,
      error: error.details[0].message,
    });

  //CHECK USER NOT ALREADY EXIST
  const user = await User.findOne({ email: email });
  if (!user)
    return res.status(400).send({
      status: false,
      error: "email not exist",
    });

  //CHECK PASSWORD CORRECT
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass)
    return res.status(400).send({
      status: false,
      error: "Invalid password",
    });

  const jwtPayload = {
    _id: user.id,
    email: user.email,
  };
  //CREATED AND ASSIGN TOKEN
  const token = jwt.sign(jwtPayload, process.env.TOKEN_SECRET, {
    expiresIn: "3day",
  });
  res.header("auth-token", token).send({
    _id: user._id,
    name: user.namePodcast,
    email: user.email,
    token: token,
    status: true,
  });
});
module.exports = route;
