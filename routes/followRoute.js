const route = require("express").Router();
const Follow = require("../models/Follow");
const verifyToken = require("./verifyToken");

route.post("/", verifyToken, async (req, res) => {
  const { followedId } = req.body;

  const followExist = await Follow.findOne({
    userId: req.user._id,
    followedId: followedId,
  });

  if (followExist) {
    return res.status(200).send({
      hasFollow: true,
      status: true,
    });
  }

  const follow = new Follow({
    userId: req.user._id,
    followedId: followedId,
  });

  try {
    const savedFollow = await follow.save();
    res.status(200).send({
      follow: savedFollow,
      status: true,
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      error: err,
    });
  }
});

route.put("/:followingId", verifyToken, async (req, res) => {
  const { followingId } = req.params;

  try {
    const removeFollowing = await Follow.deleteOne({
      userId: req.user._id,
      followedId: followingId,
    });
    res.status(200).send({
      massage: "Unfollow success",
      hasFollow: false,
      status: true,
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      error: err,
    });
  }
});

module.exports = route;
