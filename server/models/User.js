const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: false,
      minlength: 8,
      maxlength: 100,
      select: false,
    },

    githubId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    avatarUrl: {
      type: String,
      default: null,
      trim: true,
      maxlength: 500,
    },

    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;