const express = require("express");

// Create a new router
const router = express.Router();

// Import group controller
const {
  createGroup,
  addMemberToGroup,
  getGroups,
} = require("../controllers/groupController");

const { getSettlements } = require("../controllers/settlementController");

// Import authentication middleware
const authMiddleware = require("../middleware/authMiddleware");
const {
  getGroupExpenses,
  getGroupBalances,
} = require("../controllers/expenseController");

//Get group
router.get("/groups", authMiddleware, getGroups);

// Create a new group - requires authentication
router.post("/groups", authMiddleware, createGroup);

// Add a member to a group
router.post("/:groupId/members", authMiddleware, addMemberToGroup);

// Get group expenses
router.get("/:groupId/expenses", authMiddleware, getGroupExpenses);

// Get group Balance
router.get("/:groupId/balances", authMiddleware, getGroupBalances);

router.get("/:groupId/settlements", authMiddleware, getSettlements);

// Export router
module.exports = router;
