const mongoose = require("mongoose");

async function dbConnection() {
  try {
    const conn = await mongoose.connect(process.env.DB_CONNECTION);
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}  `);
  } catch (error) {
    console.error(`MongoDB connection error:${error.message}`);
  }
}

module.exports = dbConnection;
