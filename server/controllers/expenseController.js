const expenseModel = require("../models/expense.model");
const groupModel = require("../models/group.model");
const userModel = require("../models/user.model");
const notificationModel = require("../models/notification.model");

// Create a new expense with equal, unequal, or percentage split
const createExpense = async (req, res) => {
  try {
    const {
      groupId,
      description,
      amount,
      paidBy,
      splitType = "equal",
      participants,
      splits,
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

    // Check if group exists
    const group = await groupModel.findById(groupId);

    if (!group) {
      return res.status(400).json({
        success: false,
        message: "Group not found",
      });
    }

    // Convert group member IDs to strings
    const groupMemberIds = group.members.map((memberId) => memberId.toString());

    // Check if paidBy is a group member
    const isPaidByMember = groupMemberIds.includes(paidBy.toString());

    if (!isPaidByMember) {
      return res.status(400).json({
        success: false,
        message: "Paid by user is not a member of this group",
      });
    }

    // SPLIT TYPE VALIDATION LOGIC
    let calculatedSplits = [];
    let finalParticipants = [];

    // CASE A: Equal Split
    if (splitType === "equal") {
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

      // Check if all participants are group members
      const areAllParticipantsMembers = participants.every((participantId) =>
        groupMemberIds.includes(participantId.toString()),
      );

      if (!areAllParticipantsMembers) {
        return res.status(400).json({
          success: false,
          message: "One or more participants are not members of this group",
        });
      }

      finalParticipants = participants;

      // Calculate equal split
      const equalSplit = amount / participants.length;

      calculatedSplits = participants.map((participantId) => ({
        userId: participantId,
        amount: equalSplit,
      }));
    }

    // CASE B: Unequal Split
    else if (splitType === "unequal") {
      if (!splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Splits details are required for unequal split",
        });
      }

      // Check sum of unequal split amounts
      const totalSplitSum = splits.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      if (Math.round(totalSplitSum) !== Math.round(amount)) {
        return res.status(400).json({
          success: false,
          message: `Sum of split amounts (${totalSplitSum}) must equal the total expense amount (${amount})`,
        });
      }

      // Extract participants
      finalParticipants = splits.map((split) => split.userId);

      // Check if all participants are group members
      const areAllParticipantsMembers = finalParticipants.every(
        (participantId) => groupMemberIds.includes(participantId.toString()),
      );

      if (!areAllParticipantsMembers) {
        return res.status(400).json({
          success: false,
          message:
            "One or more split participants are not members of this group",
        });
      }

      calculatedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: Number(split.amount),
      }));
    }

    // CASE C: Percentage Split
    else if (splitType === "percentage") {
      if (!splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Splits percentages are required for percentage split",
        });
      }

      // Check sum of percentages is exactly 100%
      const totalPercentageSum = splits.reduce(
        (sum, item) => sum + Number(item.percent),
        0,
      );

      if (totalPercentageSum !== 100) {
        return res.status(400).json({
          success: false,
          message: `Total percentage must equal exactly 100%. Current sum: ${totalPercentageSum}%`,
        });
      }

      // Extract participants
      finalParticipants = splits.map((split) => split.userId);

      // Check if all participants are group members
      const areAllParticipantsMembers = finalParticipants.every(
        (participantId) => groupMemberIds.includes(participantId.toString()),
      );

      if (!areAllParticipantsMembers) {
        return res.status(400).json({
          success: false,
          message:
            "One or more percentage participants are not members of this group",
        });
      }

      // Convert percentage to actual amount
      calculatedSplits = splits.map((split) => ({
        userId: split.userId,
        amount: amount * (Number(split.percent) / 100),
      }));
    }

    // Invalid split type
    else {
      return res.status(400).json({
        success: false,
        message: "Invalid split type",
      });
    }

    // Create expense
    const expense = await expenseModel.create({
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      participants: finalParticipants,
      splits: calculatedSplits,
    });

    // Get Socket.IO instance
    const io = req.app.get("io");

    if (io) {
      // Notify group members about the new expense
      io.to(groupId).emit("expense-added", expense);

      // Get all group expenses
      const allExpenses = await expenseModel.find({ groupId });

      const balances = {};

      // Initialize everyone's balance to 0
      group.members.forEach((memberId) => {
        balances[memberId.toString()] = 0;
      });

      // Calculate fresh balance
      allExpenses.forEach((exp) => {
        const payer = exp.paidBy.toString();

        balances[payer] = (balances[payer] || 0) + exp.amount;

        // Use saved splits for equal, unequal and percentage
        exp.splits.forEach((split) => {
          const partId = split.userId.toString();

          balances[partId] = (balances[partId] || 0) - split.amount;
        });
      });

      // Convert object to array
      const balancesArray = Object.keys(balances).map((userId) => ({
        userId,
        balance: Math.round(balances[userId]),
      }));

      // Get payer ID
      const payerId = expense.paidBy.toString();

      // Get payer details
      const payerUser = await userModel.findById(payerId);

      const payerName = payerUser ? payerUser.name : "A member";

      // Notify only participants other than the payer
      const userToNotify = expense.participants.filter(
        (participantId) => participantId.toString() !== payerId,
      );

      // Create notification for each participant
      for (const userId of userToNotify) {
        const notification = await notificationModel.create({
          userId,
          groupId: expense.groupId,
          message: `${payerName} added a new expense: ${expense.description} of ₹${expense.amount} (${splitType} split)`,
          type: "expense",
        });

        // Send notification in real time
        io.to(groupId).emit("notification-new", notification);
      }

      // Notify group members about updated balances
      io.to(groupId).emit("balance-updated", balancesArray);
    }

    // Send response
    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get all expenses belonging to a specific group
// Only group members are allowed to view the expenses
const getGroupExpenses = async (req, res) => {
  try {
    // Get the group ID from request parameters
    const { groupId } = req.params;

    // Find the group by ID
    const existingGroup = await groupModel.findById(groupId);

    // Check if the group exists
    if (!existingGroup)
      return res.status(400).json({
        message: "Group not found",
      });

    // Get the logged-in user's ID
    const loggedInUserId = req.user.id;

    // Check if the user is a member of the group
    const isUserGroupMember = existingGroup.members.some(
      (memberId) => memberId.toString() === loggedInUserId,
    );

    // Reject the request if the user is not a group member
    if (!isUserGroupMember)
      return res.status(400).json({
        message: "User is not in the group",
      });

    // Find all expenses belonging to this group
    const expenses = await expenseModel
      .find({
        groupId,
      })
      .populate("paidBy", "name")
      .populate("participants", "name");

    // Send the expenses in the response
    res.status(200).json({
      success: true,
      message: "Response Fetched Successfully",
      expenses,
    });
  } catch (error) {
    // Handle unexpected server errors
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error, add member to grp",
    });
  }
};

// Get group expenses of all members
const getGroupBalances = async (req, res) => {
  try {
    // Get the group ID from request parameters
    const { groupId } = req.params;

    // Get the logged-in user's ID
    const loggedInUserId = req.user.id;

    // Find the group by ID
    const group = await groupModel.findById(groupId);

    // Check if the group exists
    if (!group)
      return res.status(400).json({
        message: "Group not found",
      });

    // Check if the user is a member of the group
    const isUserGroupMember = group.members.some(
      (memberId) => memberId.toString() === loggedInUserId,
    );

    // Reject the request if the user is not a group member
    if (!isUserGroupMember)
      return res.status(400).json({
        message: "User is not in the group",
      });

    // Find all expenses belonging to this group
    const expenses = await expenseModel.find({
      groupId,
    });

    // Step-by-step balance calculation
    const balances = {};

    // Set the initial balance of all group members to 0
    group.members.forEach((memberId) => {
      balances[memberId.toString()] = 0;
    });

    // Calculate the balance for each expense
    expenses.forEach((exp) => {
      const payer = exp.paidBy.toString();
      const splitAmount = exp.amount / exp.participants.length;

      // Credit the full amount to the person who paid
      balances[payer] = (balances[payer] || 0) + exp.amount;

      // Deduct each participant's share from their balance
      exp.participants.forEach((participant) => {
        const participantId = participant.toString();
        balances[participantId] = (balances[participantId] || 0) - splitAmount;
      });
    });

    // Convert the balances object into an array
    const balancesArray = Object.keys(balances).map((userId) => ({
      userId: userId,
      balance: Math.round(balances[userId]), // Round the balance to avoid decimals
    }));

    // Send response
    return res.status(200).json({
      success: true,
      balances: balancesArray,
    });
  } catch (error) {
    // Handle unexpected server errors
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error, add member to grp",
    });
  }
};

module.exports = {
  createExpense,
  getGroupExpenses,
  getGroupBalances,
};
