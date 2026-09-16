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
const { start } = require("./config/redis");

// Create Express application
const app = express();

// Create HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    // Allow frontend application to connect
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
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

// Allow the Vite dev server to call the API from the browser.
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

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

    // Redis is an optional cache. If it is unavailable the API still works,
    // it just reads straight from MongoDB.
    try {
      await start();
    } catch (error) {
      console.warn(
        `Redis unavailable (${error.message}). Continuing without cache.`,
      );
    }

    server.listen(PORT, () => {
      console.log("Server started at", new Date().toLocaleTimeString());
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
