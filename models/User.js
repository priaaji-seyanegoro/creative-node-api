const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
    },
    namePodcast: {
      type: String,
      required: true,
      min: 12,
      max: 64,
    },
    email: {
      type: String,
      required: true,
      min: 12,
      max: 128,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
