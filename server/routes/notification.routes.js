const express = require("express");

// Create a new router
const router = express.Router();

const {
  createNotification,
  updateNotification,
} = require("../controllers/notificationController");

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

router.get("/notifications", authMiddleware, createNotification);

router.put("/notifications/:id/read", authMiddleware, updateNotification);

module.exports = router;
