const express = require("express");

// Import user controllers
const { getProfile, updateProfile } = require("../controllers/userController");

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get user profile - requires authentication
router.get("/profile", authMiddleware, getProfile);

// Update user profile - requires authentication
router.put("/profile", authMiddleware, updateProfile);

// Export router
module.exports = router;
