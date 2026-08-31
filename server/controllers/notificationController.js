const groupModel = require("../models/group.model");
const notificationModel = require("../models/notification.model");
const userModel = require("../models/user.model");

const createNotification = async (req, res) => {
  try {
    const { userId, groupId, message, type } = req.body;

    const isUserId = await userModel.findById(userId);

    if (!isUserId)
      return res.status(400).json({
        message: "User not found",
      });

    const isGroupId = await groupModel.findById(groupId);
    if (!isGroupId)
      return res.status(400).json({
        message: "Group not found",
      });

    if (!message)
      return res.status(400).json({
        message: "Message not given",
      });

    if (!type)
      return res.status(400).json({
        message: "Type not given",
      });

    const notification = await notificationModel.create({
      userId,
      groupId,
      message,
      type,
    });

    res.status(200).json({ notification });
  } catch (error) {
    // Handle unexpected server errors
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Notification
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
  } catch (error) {
    // Handle unexpected server errors
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error,",
    });
  }
};
module.exports = {
  createNotification,
  updateNotification,
};
