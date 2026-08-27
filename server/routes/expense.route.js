const express = require("express");

// Create a new router
const router = express.Router();

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");
const { createExpense } = require("../controllers/expenseController");

// Handle expense creation
router.post("/expenses", authMiddleware, createExpense);

// Export router
module.exports = router;
