const notificationModel = require("../models/notification.model");

// List the logged-in user's notifications, newest first
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await notificationModel.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Mark one notification as read and return the fresh unread count
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Only the owner may mark it read
    await notificationModel.updateOne(
      { _id: id, userId },
      { $set: { isRead: true } },
    );

    const unreadCount = await notificationModel.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Mark everything as read
const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await notificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );

    return res.status(200).json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
