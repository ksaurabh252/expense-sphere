const express = require("express");
const userModel = require("../models/user.model");

// Get the logged-in user's profile
const getProfile = async (req, res) => {
  try {
    // Find user using the ID from authentication middleware
    const user = await userModel.findById(req.user.id);

    // If user does not exist
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Send user's basic information
    res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.log(error);
  }
};

// Update the logged-in user's profile
const updateProfile = async (req, res) => {
  try {
    // Get name and email from request body
    const { name, email } = req.body;

    // Object to store only the fields that need to be updated
    let updateData = {};

    // If name is provided, add it to updateData
    if (name !== undefined) updateData.name = name;

    // If email is provided, check if it is already used
    if (email !== undefined) {
      const isDuplicate = await userModel.findOne({ email });

      // Make sure the email does not belong to another user
      if (isDuplicate && isDuplicate._id.toString() !== req.user.id) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }

      // Add email to updateData
      updateData.email = email;
    }

    // If user did not send any field to update
    if (Object.keys(updateData).length == 0)
      return res.status(400).json({
        message: "Nothing to update",
      });

    // Find user by ID and update only the provided fields
    const user = await userModel.findByIdAndUpdate(req.user.id, updateData, {
      new: true, // Return the updated user
      runValidators: true, // Run schema validation
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Send updated profile as response
    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error(error);

    // Send server error response
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Find users by name or email, so a group member can be looked up to add
const searchUsers = async (req, res) => {
  try {
    const term = (req.query.q || "").trim();

    if (!term) {
      return res.status(200).json({ users: [] });
    }

    const users = await userModel
      .find({
        _id: { $ne: req.user.id },
        $or: [
          { name: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
        ],
      })
      .select("name email")
      .limit(10);

    return res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Export controller functions
module.exports = { getProfile, updateProfile, searchUsers };
