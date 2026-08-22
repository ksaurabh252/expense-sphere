const express = require("express");

// Import authentication controllers
const {
  signUp,
  login,
  logout,
  resetPassword,
} = require("../controllers/authController");

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

const app = express();

const router = express.Router();

// User signup route
router.post("/signup", signUp);

// User login route
router.post("/login", login);

// User logout route - requires authentication
router.post("/logout", authMiddleware, logout);

// Reset password route - requires authentication
router.post("/reset-password", authMiddleware, resetPassword);

// Export router
module.exports = router;
