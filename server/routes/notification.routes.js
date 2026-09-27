const express = require("express");

// Create a new router
const router = express.Router();

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

router.get("/notifications", authMiddleware, getNotifications);

// Must come before /:id/read so "read-all" is not treated as an id
router.put("/notifications/read-all", authMiddleware, markAllNotificationsRead);

router.put("/notifications/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
