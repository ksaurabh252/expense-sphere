const express = require("express");
const userModel = require("../models/user.model");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const signUp = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Find user exists in the database
    const UserExists = await userModel.findOne({ email });

    //Sent message if user exists
    if (UserExists)
      return res.status(400).json({ message: "Email already registered" });

    //Checks password and confirm password should be same
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Both password should be same " });

    //Password hashing
    const hashPassword = await argon2.hash(password);

    //Save user data to the database
    const newUser = await userModel.create({
      name,
      email,
      password: hashPassword,
    });

    //Success message
    return res
      .status(200)
      .json({ message: "User Registered successfully", newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// User Login
// Login User
const login = async (req, res) => {
  try {
    // Get email and password from request body
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Find user by email
    const user = await userModel.findOne({ email });

    // Check if user exists
    if (!user)
      return res
        .status(400)
        .json({ message: "Donot have an account, Please create an account" });

    // Verify password
    const isMatch = await argon2.verify(user.password, password);

    // Check if password is correct
    if (!isMatch)
      return res.status(401).json({ message: "Password does not match" });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Remove password before sending user data
    const { password: _, ...userData } = user.toObject();

    // Send success response
    return res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error(error);

    // Handle server error
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Logout
const logout = async (req, res) => {
  return res.json({ message: "logout successfull" });
};

//Reset password

const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body();

    const user = await userModel.findOne({ email });
    if (!user) return res.status(200).json({ message: "User not found " });
  } catch (error) {}
};

module.exports = { signUp, login, logout, resetPassword };
