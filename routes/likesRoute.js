const route = require("express").Router();
const Podcast = require("../models/Podcast");
const Like = require("../models/Like");
const verifyToken = require("./verifyToken");

route.post("/", verifyToken, async (req, res) => {
  const { kontenId } = req.body;

  //CEK UDH PERNAH LIKE POSTINGAN
  const likeExist = await Like.findOne({
    podcastId: kontenId,
    likeBy: req.user._id,
  });
  if (likeExist) {
    return res.status(200).send({
      hasLike: true,
      status: true,
    });
  }
  const podcastCountLike = await Podcast.findById(kontenId).select("likes");
  const podcast = await Podcast.updateOne(
    { _id: kontenId },
    {
      $set: {
        likes: podcastCountLike.likes + 1,
      },
    }
  );

  const like = new Like({
    podcastId: kontenId,
    likeBy: req.user._id,
  });

  try {
    const savedLike = await like.save();
    res.status(200).send({
      podcast: podcast,
      like: savedLike,
      hasLike: true,
      status: true,
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      hasLike: false,
      error: err,
    });
  }
});

route.put("/:kontenId", verifyToken, async (req, res) => {
  const { kontenId } = req.params;

  const podcastCountLike = await Podcast.findById(kontenId).select("likes");

  //cek jumlah like nya dl
  if (podcastCountLike.likes > 0) {
    //update jumlah likenya
    const podcast = await Podcast.updateOne(
      { _id: kontenId },
      {
        $set: {
          likes: podcastCountLike.likes - 1,
        },
      }
    );

    try {
      const removeLike = await Like.deleteOne({
        podcastId: kontenId,
        likeBy: req.user._id,
      });
      res.status(200).send({
        massage: "Unlike Podcast success",
        hasLike: true,
        status: true,
      });
    } catch (err) {
      res.status(400).send({
        status: false,
        hasLike: false,
        error: err,
      });
    }
  } else {
    res.status(400).send({
      massage: "Podcast has Unlike ",
      hasLike: false,
      status: false,
    });
  }
});

module.exports = route;
