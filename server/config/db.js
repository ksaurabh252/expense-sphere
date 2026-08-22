const mongoose = require("mongoose");

// Connect to MongoDB database
async function dbConnection() {
  try {
    // Connect using the database URL from environment variables
    const conn = await mongoose.connect(process.env.DB_CONNECTION);

    // Log successful connection
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    // Log database connection error
    console.error(`MongoDB connection error: ${error.message}`);

    // Pass the error to the caller
    throw error;
  }
}

// Export database connection function
module.exports = dbConnection;
