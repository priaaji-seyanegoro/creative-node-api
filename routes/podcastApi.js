const route = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const { promisify } = require("util");
const User = require("../models/User");
const Podcast = require("../models/Podcast");
const { podcastValidation } = require("../validation");
const verifyToken = require("./verifyToken");

const storage = multer.diskStorage({
  destination: function (req, files, cb) {
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

//FILTER FILES
const fileFilter = (req, files, cb) => {
  //reject file
  if (
    files.mimetype === "audio/mpeg" ||
    files.mimetype === "audio/vorbis" ||
    files.mimetype === "image/jpeg" ||
    files.mimetype === "image/png"
  ) {
    cb(null, true);
    // console.log(files);
  } else {
    req.fileValidationError = {
      massage: "goes wrong on the mimetype",
      mimetype: {
        audio: "mp3",
        coverImage: "jpg/png",
      },
    };
    return cb(null, false, new Error("goes wrong on the mimetype"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
  fileFilter: fileFilter,
});

//GET ALL PODCAST
route.get("/", verifyToken, async (req, res) => {
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
          audio: podcast.audio,
          coverImage: podcast.coverImage,
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

//READ PODCAST BY ID
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

//UPLOAD PODCAST
route.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  async (req, res, next) => {
    const { title, description } = req.body;

    //PATH FILE
    const audioPath = req.files.audio[0].path;
    const coverImagePath = req.files.coverImage[0].path;

    // VALIDATE BEFORE STORE
    const { error } = podcastValidation(req.body);
    if (error) {
      const unlinkAsync = promisify(fs.unlink);
      await unlinkAsync(audioPath);
      await unlinkAsync(coverImagePath);
      return res.status(400).send(error.details[0].message);
    }

    if (req.fileValidationError) {
      return res.send(req.fileValidationError);
    }

    //FIND USER ID
    const user = await User.findById(req.user._id).exec();
    if (!user)
      return res.status(404).send({
        message: "Sorry UserId not found",
      });

    if (!req.files.audio) {
      return res.status(400).send({
        error: "Files Audio Required",
        type: " Format MP3 | Size Max 50MB",
      });
    } else if (!req.files.coverImage) {
      return res.status(400).send({
        error: "Files Cover Image Required",
        type: " Format JPG/PNG | Size Max 50MB",
      });
    }

    const podcast = new Podcast({
      title: title,
      audio: audioPath,
      coverImage: coverImagePath,
      description: description,
      userId: req.user._id,
    });
    try {
      const savedPodcast = await podcast.save();
      res.status(200).send({
        podcast: savedPodcast,
        status: true,
      });
    } catch (err) {
      const unlinkAsync = promisify(fs.unlink);
      await unlinkAsync(audioPath);
      await unlinkAsync(coverImagePath);
      res.status(400).send({
        status: false,
        error: err,
      });
    }
  }
);

//UPDATE PODCAST
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

//DELETE PODCAST
route.delete("/:podcastId", async (req, res) => {
  try {
    const unlinkFile = await Podcast.findById({
      _id: req.params.podcastId,
    });

    const unlinkAsync = promisify(fs.unlink);
    await unlinkAsync(unlinkFile.audio);
    await unlinkAsync(unlinkFile.coverImage);

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
