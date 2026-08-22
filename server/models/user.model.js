const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [20, "Name cannot exceed 50 character"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: [true, "Password is required"] },
    profileImage: String,
    // phone: {
    //   type: Number,
    //   required: true,
    //   maxlength: [20, "Name cannot exceed 50 character"],
    // },
  },

  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
