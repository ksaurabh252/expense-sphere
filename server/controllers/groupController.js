const groupModel = require("../models/group.model");

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if group already exists
    const existingGroup = await groupModel.findOne({
      name: name.trim(),
      createdBy: req.user.id,
    });

    // Return error if group already exists
    if (existingGroup)
      return res
        .status(400)
        .json({ success: false, message: "Group already exists" });

    // Create new group
    const group = await groupModel.create({
      name,
      description,
      createdBy: req.user.id,
      members: [req.user.id],
    });

    // Send success response
    res.status(201).json({
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    // Handle server error
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = createGroup;
