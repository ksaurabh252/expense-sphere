const groupModel = require("../models/group.model");
const expenseModel = require("../models/expense.model");
const settlementModel = require("../models/settlement.model");

// Helper function: Calculate the final balance of all group members
const calculateNetBalances = async (groupId, groupMembers) => {
  // Get all expenses and settlements of the group
  const expenses = await expenseModel.find({ groupId });
  const settlements = await settlementModel.find({ groupId });

  const balances = {};

  // Initialize each member's balance to 0
  groupMembers.forEach((member) => {
    balances[member._id.toString()] = {
      name: member.name,
      net: 0,
    };
  });

  // Calculate balances from expenses
  expenses.forEach((exp) => {
    const payer = exp.paidBy.toString();
    const splitAmount = exp.amount / exp.participants.length;

    // Add the full amount to the person who paid
    if (balances[payer]) {
      balances[payer].net += exp.amount;
    }

    // Subtract each participant's share
    exp.participants.forEach((part) => {
      const partId = part.toString();

      if (balances[partId]) {
        balances[partId].net -= splitAmount;
      }
    });
  });

  // Calculate balances from completed settlements
  // Example: Saurabh pays Rahul ₹400
  settlements.forEach((set) => {
    const sender = set.from.toString(); // Saurabh (his balance increases toward zero)
    const receiver = set.to.toString(); // Rahul (his balance decreases toward zero)

    // Add the paid amount back to the sender's balance
    if (balances[sender]) {
      balances[sender].net += set.amount;
    }

    // Subtract the paid amount from the receiver's balance
    if (balances[receiver]) {
      balances[receiver].net -= set.amount;
    }
  });

  return balances;
};

// Get the settlement list for a group
const getSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    const loggedInUserId = req.user.id;

    // Populate group members so their names can be used in the calculation
    const group = await groupModel
      .findById(groupId)
      .populate("members", "name");

    // Check if the group exists
    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // Check if the logged-in user is a group member
    const isMember = group.members.some(
      (member) => member._id.toString() === loggedInUserId,
    );

    if (!isMember) {
      return res.status(403).json({
        message: "User is not in the group",
      });
    }

    // Calculate the net balance of each member
    const netBalances = await calculateNetBalances(groupId, group.members);

    // Separate members into debtors and creditors
    const debtors = [];
    const creditors = [];

    Object.keys(netBalances).forEach((userId) => {
      const user = netBalances[userId];

      // Negative balance means the user owes money
      if (user.net < 0) {
        debtors.push({
          userId,
          name: user.name,
          amount: Math.abs(user.net),
        });
      }

      // Positive balance means the user should receive money
      else if (user.net > 0) {
        creditors.push({
          userId,
          name: user.name,
          amount: user.net,
        });
      }
    });

    // Create the minimum number of settlements
    const calculatedSettlements = [];

    let i = 0;
    let j = 0;

    // Match debtors with creditors
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // Use the smaller amount as the settlement amount
      const settlementAmount = Math.min(debtor.amount, creditor.amount);

      calculatedSettlements.push({
        from: debtor.name,
        fromId: debtor.userId,
        to: creditor.name,
        toId: creditor.userId,
        amount: Math.round(settlementAmount),
      });

      // Reduce the remaining amounts
      debtor.amount -= settlementAmount;
      creditor.amount -= settlementAmount;

      // Move to the next debtor if their balance is settled
      if (Math.round(debtor.amount) === 0) {
        i++;
      }

      // Move to the next creditor if their balance is settled
      if (Math.round(creditor.amount) === 0) {
        j++;
      }
    }

    // Send the settlement list
    res.status(200).json({
      success: true,
      settlements: calculatedSettlements,
    });
  } catch (error) {
    console.error(error);

    // Handle server errors
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Mark a payment as settled (save it to the database and emit a socket event)
const markSettled = async (req, res) => {
  try {
    const { groupId, to, amount } = req.body;

    // The logged-in user is the person making the payment
    const from = req.user.id;

    // Validate required fields
    if (!groupId || !to || !amount) {
      return res.status(400).json({
        message: "groupId, to, and amount are required",
      });
    }

    // Find the group
    const group = await groupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    // Get all group member IDs
    const memberIds = group.members.map((m) => m.toString());

    // Check if the sender is a group member
    if (!memberIds.includes(from)) {
      return res.status(403).json({
        message: "Sender (You) is not a member of this group",
      });
    }

    // Check if the receiver is a group member
    if (!memberIds.includes(to.toString())) {
      return res.status(400).json({
        message: "Receiver is not a member of this group",
      });
    }

    // Save the settlement in the database
    const settlement = await settlementModel.create({
      groupId,
      from,
      to,
      amount,
    });

    // Emit a socket event to update balances in real time
    const io = req.app.get("io");

    if (io) {
      // Get group members with their names
      const groupWithPopulate = await groupModel
        .findById(groupId)
        .populate("members", "name");

      // Recalculate balances after settlement
      const updatedNetBalances = await calculateNetBalances(
        groupId,
        groupWithPopulate.members,
      );

      // Convert balances object into an array
      const balancesArray = Object.keys(updatedNetBalances).map((userId) => ({
        userId,
        balance: Math.round(updatedNetBalances[userId].net),
      }));

      // Send updated balances to all users in the group
      io.to(groupId).emit("balance-updated", balancesArray);
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: "Payment marked as settled successfully",
      settlement,
    });
  } catch (error) {
    console.error(error);

    // Handle server errors
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getSettlements,
  markSettled,
};
