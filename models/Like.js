const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const likeSchema = new mongoose.Schema({
  podcastId: {
    type: Schema.Types.ObjectId,
    ref: "Podcast",
    required: true,
  },
  likeBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Like", likeSchema);
