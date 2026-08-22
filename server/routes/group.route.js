const express = require("express");

// Create a new router
const router = express.Router();

// Import group controller
const createGroup = require("../controllers/groupController");

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

// Create a new group - requires authentication
router.post("/groups", authMiddleware, createGroup);

// Export router
module.exports = router;
