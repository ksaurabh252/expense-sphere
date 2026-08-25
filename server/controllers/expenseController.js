const expenseModel = require("../models/expense.model");
const groupModel = require("../models/group.model");

// Create a new expense and calculate equal split
const createExpense = async (req, res) => {
  try {
    const {
      groupId,
      description,
      amount,
      paidBy,
      splitType = "equal",
      participants,
    } = req.body;

    // 1. Basic validations
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Please provide groupId",
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Please add description",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!paidBy) {
      return res.status(400).json({
        success: false,
        message: "Please provide paidBy",
      });
    }

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid participants list",
      });
    }

    // 2. Only equal split is supported for now
    if (splitType !== "equal") {
      return res.status(400).json({
        success: false,
        message: "Only equal split is supported",
      });
    }

    // 3. Check if group exists
    const group = await groupModel.findById(groupId);

    if (!group) {
      return res.status(400).json({
        success: false,
        message: "Group not found",
      });
    }

    // 4. Convert group member IDs to strings
    const groupMemberIds = group.members.map((memberId) => memberId.toString());

    // 5. Check if paidBy is a group member
    const isPaidByMember = groupMemberIds.includes(paidBy.toString());

    if (!isPaidByMember) {
      return res.status(400).json({
        success: false,
        message: "Paid by user is not a member of this group",
      });
    }

    // 6. Check if all participants are group members
    const areAllParticipantsMembers = participants.every((participantId) =>
      groupMemberIds.includes(participantId.toString()),
    );

    if (!areAllParticipantsMembers) {
      return res.status(400).json({
        success: false,
        message: "One or more participants are not members of this group",
      });
    }

    // 7. Calculate equal split
    const equalSplit = amount / participants.length;

    // 8. Create expense
    const expense = await expenseModel.create({
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      participants,
    });

    // 9. Send response
    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense,
      equalSplit,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = createExpense;
