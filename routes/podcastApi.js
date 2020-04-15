const route = require("express").Router();
const Podcast = require("../models/Podcast");

route.get("/", async (req, res) => {
  try {
    const podcasts = await Podcast.find()
      .populate("userId", "name , email")
      .exec();
    res.send({
      count: podcasts.length,
      podcast: podcasts.map((podcast) => {
        return {
          _id: podcast._id,
          title: podcast.title,
          description: podcast.description,
          createdBy: podcast.userId,
          request: {
            type: "GET",
            desc: "For get detail podcast",
            url: `http://localhost:3000/podcast/${podcast._id}`,
          },
        };
      }),
    });
  } catch (err) {
    res.status(400).send(err);
  }
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
