// Load environment variables from .env file
require("dotenv").config();

// Import required packages
const express = require("express");
const http = require("http");

const cors = require("cors");
const { Server } = require("socket.io");
const dbConnection = require("./config/db");
const authRouter = require("./routes/auth.route");
const profileRouter = require("./routes/user.route");
const groupRouter = require("./routes/group.route");
const expenseRouter = require("./routes/expense.route");

// Create Express application
const app = express();

// Create HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    // Allow frontend application to connect
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make Socket.IO available throughout the application
app.set("io", io);

// Handle Socket.IO connections
io.on("connection", (socket) => {
  // Log when a user connects
  console.log("Socket connected", socket.id);

  // Join the user to the group room
  socket.on("join-group", (groupId) => {
    socket.join(groupId);
    console.log("User Joined Group", groupId);
  });

  // Log when the user disconnects
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Middleware to parse JSON request bodies
app.use(express.json());

// dbConnection();

app.get("/", (req, res) => {
  res.send("hi");
});

app.use("/user", authRouter);
app.use("/user", profileRouter);
app.use("/user", groupRouter);
app.use("/user", expenseRouter);

// Define server port from environment variable or use default port 3000
const PORT = process.env.PORT || 3001;

// Start the server
const startServer = async () => {
  try {
    await dbConnection();
    console.log("Database connected successfully.");

    server.listen(PORT, () => {
      console.log("Server started at", new Date().toLocaleTimeString());
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
