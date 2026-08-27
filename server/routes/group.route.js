const express = require("express");

// Create a new router
const router = express.Router();

// Import group controller
const {
  createGroup,
  addMemberToGroup,
} = require("../controllers/groupController");

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");
const { getGroupExpenses } = require("../controllers/expenseController");

// Create a new group - requires authentication
router.post("/groups", authMiddleware, createGroup);

// Add a member to a group
router.post("/:groupId/members", authMiddleware, addMemberToGroup);

// Get group expenses
router.get("/:groupId/expenses", authMiddleware, getGroupExpenses);

// Export router
module.exports = router;
