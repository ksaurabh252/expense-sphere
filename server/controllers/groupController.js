const { client } = require("../config/redis");
const groupModel = require("../models/group.model");
const userModel = require("../models/user.model");

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name)
      return res.status(400).json({
        message: "Name is required",
      });

    // Check if group already exists
    const existingGroup = await groupModel.findOne({
      name: name.trim(),
      createdBy: req.user.id,
    });

    // Return error if group already exists
    if (existingGroup)
      return res.status(400).json({
        success: false,
        message: "Group already exists",
      });

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

const addMemberToGroup = async (req, res) => {
  try {
    // Get group ID from URL params
    const { groupId } = req.params;

    // Get user ID to be added from request body
    const { userId } = req.body;

    // Get logged-in user's ID
    const loggedInUserId = req.user.id;

    // Find the group by ID
    const existingGroup = await groupModel.findById(groupId);

    if (!existingGroup)
      return res.status(400).json({
        message: "Group not found",
      });

    // Check if logged-in user is a member of the group
    const isGroupMember = existingGroup.members.some((memberId) => {
      return memberId.toString() === loggedInUserId;
    });
    if (!isGroupMember)
      return res.status(400).json({
        success: false,
        message: `You are not a member of ${existingGroup.name}`,
      });

    // Check if the user to be added exists in the database
    const userExists = await userModel.findById(userId);

    if (!userExists)
      return res.status(400).json({
        success: false,
        message: `User does not exist`,
      });

    // Check if the user is already a member of the group
    const isAlreadyMember = existingGroup.members.some(
      (memberId) => memberId.toString() === userId,
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: `User ${userExists.name}, is already a member`,
      });
    }

    // Add the user to the group
    existingGroup.members.push(userId);

    // Save the updated group
    await existingGroup.save();

    // Send success response
    res.status(200).json({
      message: "Member added successfully",
      // existingGroup,
    });
  } catch (error) {
    // Handle unexpected server errors
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error,add member to grp",
    });
  }
};

const getGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const cacheKey = `groups:${userId}`;

    // 1. Check Redis Cache
    const cachedGroups = await client.get(cacheKey);
    if (cachedGroups) {
      return res.status(200).json({
        success: true,
        source: "cache",
        groups: JSON.parse(cachedGroups),
      });
    }

    // 2. Fetch from MongoDB (Cache Miss)
    const groups = await groupModel.find({
      members: userId,
    });

    // 3. Save to Redis (TTL: 1 hour)
    await client.set(cacheKey, JSON.stringify(groups), {
      EX: 3600,
    });

    return res.status(200).json({
      success: true,
      source: "database",
      groups,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createGroup,
  addMemberToGroup,
  getGroups,
};
