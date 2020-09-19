const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const podcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      max: 255,
      required: true,
    },
    audio: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      max: 2048,
    },
    likes: {
      type: Number,
      default: 0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Podcast", podcastSchema);
