// Load environment variables from .env file
require("dotenv").config();

// Import required packages
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dbConnection = require("./config/db");

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

// Middleware to parse JSON request bodies
app.use(express.json());

dbConnection();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Define server port from environment variable or use default port 3000
const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
  console.log("Server started at", new Date().toLocaleTimeString());
});
