const route = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const { promisify } = require("util");
const User = require("../models/User");
const Podcast = require("../models/Podcast");
const { podcastValidation } = require("../validation");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const fileFormat = file.originalname.split(".");
    const filename = file.originalname.split(".").slice(0, -1).join(".");
    cb(
      null,
      filename + "-" + Date.now() + "." + fileFormat[fileFormat.length - 1]
    );
  },
});

const fileFilter = (req, file, cb) => {
  //reject file
  if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/vorbis") {
    cb(null, true);
    console.log("file :", req.body);
  } else {
    req.fileValidationError = "goes wrong on the mimetype";
    return cb(null, false, new Error("goes wrong on the mimetype"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 50,
  },
  fileFilter: fileFilter,
});

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
            url: `http://localhost:4000/api/podcast/${podcast._id}`,
          },
        };
      }),
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

route.get("/:podcastId", async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.podcastId)
      .select("_id title description userId date")
      .populate("userId", "name , email")
      .exec();
    if (!podcast)
      return res.status(404).send({
        message: "Sorry Podcast not found",
      });

    res.status(200).send({
      podcast: podcast,
      request: {
        type: "GET",
        desc: "Get All Data Podcasts",
        url: "http://localhost:4000/api/podcast",
      },
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

route.post("/", upload.single("audio"), async (req, res, next) => {
  const { userId, title, description } = req.body;
  //VALIDATE BEFORE STORE
  const { error } = podcastValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.fileValidationError) {
    return res.send(req.fileValidationError);
  } else if (req.file == null) {
    console.log(req.file);
    return res.status(400).send({
      error: {
        message: "Audio Required",
      },
    });
  }

  const user = await User.findById(userId).exec();
  if (!user)
    return res.status(404).send({
      message: "Sorry UserId not found",
    });
  const podcast = new Podcast({
    title: title,
    audio: req.file.path,
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

route.patch("/:podcastId", async (req, res) => {
  const id = req.params.podcastId;
  const { title, description } = req.body;
  try {
    const podcast = await Podcast.updateOne(
      { _id: id },
      {
        $set: {
          title: title,
          description: description,
        },
      }
    );

    res.send({
      massage: "Podcast Updated",
      podcast: podcast,
      request: {
        type: "DELETE",
        desc: "For Delete data",
        url: `http://localhost:4000/api/podcast/${id}`,
      },
    });
  } catch (error) {
    res.status(400).send({
      message: "Podcast not found",
      error: error.message,
    });
  }
});

route.delete("/:podcastId", async (req, res) => {
  try {
    const unlinkFile = await Podcast.findById({
      _id: req.params.podcastId,
    });

    const unlinkAsync = promisify(fs.unlink);
    await unlinkAsync(unlinkFile.audio);

    const removePodcast = await Podcast.deleteOne({
      _id: req.params.podcastId,
    });

    res.send({
      massage: "Podcast Deleted",
      podcast: removePodcast,
      request: {
        type: "POST",
        desc: "For Created New Podcast",
        url: `http://localhost:4000/api/podcast`,
      },
    });
  } catch (error) {
    res.status(400).send({
      message: "Podcast not found",
      error: error.message,
    });
  }
});

module.exports = route;
