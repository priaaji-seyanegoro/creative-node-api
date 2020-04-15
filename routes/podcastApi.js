const route = require("express").Router();
const Podcast = require("../models/Podcast");

route.get("/", (req, res) => {
  res.send("get podcast all data");
});

route.get("/:podcastId", (req, res) => {
  res.send("detail data podcast ");
});

route.post("/", async (req, res) => {
  const { userId, title, description } = req.body;
  const podcast = new Podcast({
    title: title,
    description: description,
    userId: userId,
  });
  try {
    const savedPodcast = await podcast.save();
    res.send(savedPodcast);
  } catch (err) {
    res.status(400).send(err);
  }
});

route.put("/:podcastId", (req, res) => {
  res.send("update data podcast ");
});

route.delete("/:podcastId", (req, res) => {
  res.send("update data podcast ");
});

module.exports = route;
