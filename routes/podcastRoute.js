const route = require("express").Router();
const multer = require("multer");
const { cloudinary } = require("../utils/cloudinary");
const fs = require("fs");
const { promisify } = require("util");

const User = require("../models/User");
const Podcast = require("../models/Podcast");
const Like = require("../models/Like");
const Follow = require("../models/Follow");
const { podcastValidation } = require("../validation");
const verifyToken = require("./verifyToken");
require("dotenv").config();

const storage = multer.diskStorage({
  destination: function (req, files, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
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
        audio: "mp3 | mpeg",
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

//GET ALL DATA PODCASTS by followees
route.get("/", verifyToken, async (req, res) => {
  const currentPage = req.query.page || 1;
  const perPage = req.query.perPage || 6;

  

  const getFollowingList = await Follow.find({
    userId: req.user._id,
  }).select("followedId");

  const FollowingList = getFollowingList.map((d) => d.followedId);

  try {    
    const PodcastCount = await Podcast.find({
      userId: { $in: FollowingList },
    }).countDocuments();

    const podcasts = await Podcast.find({
      userId: { $in: FollowingList },
    })
      .sort({ likes: "desc" })
      .populate("userId", "namePodcast , email")
      .skip((parseInt(currentPage) - 1) * parseInt(perPage))
      .limit(parseInt(perPage))
      .exec();
    
      res.send({
      count: podcasts.length,
      status: true,
      total_items : parseInt(PodcastCount),
      current_page : parseInt(currentPage),
      per_page : parseInt(perPage),
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
            url: `https://cryptic-thicket-69508.herokuapp.com/api/podcast/${podcast._id}`,
          },
        };
      }),
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      error: err,
    });
  }
});

route.get("/trending", async (req, res) => {
  try {
    const podcasts = await Podcast.find({})
      .sort({ likes: "desc" })
      .populate("userId", "namePodcast , email")
      .limit(3)
      .exec();
    res.send({
      count: podcasts.length,
      status: true,
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
            url: `https://cryptic-thicket-69508.herokuapp.com/api/podcast/${podcast._id}`,
          },
        };
      }),
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      error: err,
    });
  }
});

//SEARCH PODCAST
route.get("/search", async (req, res) => {
  let q = req.query.q;

  const podcasts = await Podcast.find({
    $text: {
      $search: q,
    },
  })
    .limit(5)
    .populate("userId", "namePodcast , email")
    .exec();

  res.send({
    count: podcasts.length,
    status: true,
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
          url: `https://cryptic-thicket-69508.herokuapp.com/api/podcast/${podcast._id}`,
        },
      };
    }),
  });
});

//GET PODCAST BY USER_ID
route.get("/yourPodcast", verifyToken, async (req, res) => {
  try {
    const podcasts = await Podcast.find({ userId: req.user._id })
      .populate("userId", "namePodcast , email")
      .exec();
    res.send({
      count: podcasts.length,
      status: true,
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
            url: `https://cryptic-thicket-69508.herokuapp.com/api/podcast/${podcast._id}`,
          },
        };
      }),
    });
  } catch (err) {
    res.status(400).send({
      status: false,
      error: err,
    });
  }
});

//READ PODCAST BY ID
route.get("/:podcastId", verifyToken, async (req, res) => {
  try {
    let hasLike = false;
    let hasFollow = false;
    const podcast = await Podcast.findById(req.params.podcastId)
      .populate("userId", "namePodcast")
      .exec();
    if (!podcast)
      return res.status(404).send({
        message: "Sorry Podcast not found",
      });

    const followExist = await Follow.findOne({
      userId: req.user._id,
      followedId: podcast.userId._id,
    });

    if (followExist) {
      hasFollow = true;
    }

    const likeExist = await Like.findOne({
      podcastId: podcast._id,
      likeBy: req.user._id,
    });

    if (likeExist) {
      hasLike = true;
    }

    res.status(200).send({
      _id: podcast._id,
      title: podcast.title,
      audio: podcast.audio,
      coverImage: podcast.coverImage,
      likes: podcast.likes,
      description: podcast.description,
      createdBy: podcast.userId,
      createdAt: podcast.createdAt,
      hasLike: hasLike,
      hasFollow: hasFollow,
      request: {
        type: "GET",
        desc: "Get All Data Podcasts",
        url: "https://cryptic-thicket-69508.herokuapp.com/api/podcast",
      },
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

//UPLOAD PODCAST
route.post("/", verifyToken, upload.any(), async (req, res, next) => {
  var audioPath = req.files[0].path;
  var imgPath = req.files[1].path;
  const { title, description } = req.body;

  // VALIDATE BEFORE STORE
  const { error } = podcastValidation(req.body);
  if (error) {
    const unlinkAsync = promisify(fs.unlink);
    await unlinkAsync(audioPath);
    await unlinkAsync(imgPath);
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

  if (!audioPath) {
    return res.status(400).send({
      error: "Files Audio Required",
      type: " Format MP3 | Size Max 50MB",
    });
  } else if (!imgPath) {
    return res.status(400).send({
      error: "Files Cover Image Required",
      type: " Format JPG/PNG | Size Max 50MB",
    });
  }

  const audio = cloudinary.uploader.upload(audioPath, {
    folder: "cn_asset",
    resource_type: "auto",
  });

  const image = cloudinary.uploader.upload(imgPath, {
    folder: "cn_asset",
    resource_type: "auto",
  });

  Promise.all([audio, image])
    .then(async (values) => {
      const podcast = new Podcast({
        title: title,
        audio: values[0].secure_url,
        coverImage: values[1].secure_url,
        publicId_audio: values[0].public_id,
        publicId_image: values[1].public_id,
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
        await unlinkAsync(imgPath);
        res.status(400).send({
          status: false,
          error: err,
        });
      }
    })
    .catch((err) => {
      res.send(err);
    });
});

//UPDATE PODCAST
route.put("/:podcastId", verifyToken, async (req, res) => {
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
      status: true,
      massage: "Podcast Updated",
      podcast: podcast,
      request: {
        type: "DELETE",
        desc: "For Delete data",
        url: `https://cryptic-thicket-69508.herokuapp.com/api/podcast/${id}`,
      },
    });
  } catch (error) {
    res.status(400).send({
      status: false,
      message: "Podcast not found",
      error: error.message,
    });
  }
});

//DELETE PODCAST
route.delete("/:podcastId", verifyToken, async (req, res) => {
  const unlinkFile = await Podcast.findById({
    _id: req.params.podcastId,
  });

  const audio = cloudinary.uploader.destroy(unlinkFile.publicId_audio, {
    folder: "cn_asset",
    resource_type: "video",
  });

  const image = cloudinary.uploader.destroy(unlinkFile.publicId_image, {
    folder: "cn_asset",
    resource_type: "image",
  });

  // try delete file on cloudinary
  Promise.all([audio, image])
  .then(async () => {
    //delete podcast data on DB
    await Podcast.deleteOne({
      _id: req.params.podcastId,
    });

    //delete all like relate to podcast post
    await Like.deleteOne({
      podcastId: req.params.podcastId,
      likeBy: req.user._id,
    });

    res.send({
      massage: "Podcast Deleted",
      status: true,
      request: {
        type: "POST",
        desc: "For Created New Podcast",
        url: `https://cryptic-thicket-69508.herokuapp.com/api/podcast`,
      },
    });
  })
  .catch((error) => {
    res.status(400).send({
      message: "Delete Podcast Fail",
      status: false,
      error: error.message,
    });
  });

});

module.exports = route;
