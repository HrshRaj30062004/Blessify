require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth"); // Authentication routes
const journalRoutes = require("./routes/journal"); // Journal routes

const app = express();

// Middleware
app.use(express.json()); // Parse JSON body
app.use(cors()); // Enable Cross-Origin Resource Sharing

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Authentication Routes
app.use("/api/auth", authRoutes); // Routes for sign-up/login

// Journal Routes (Protected by JWT)
app.use("/api/journal", journalRoutes); // Routes for journaling

// Basic Route for Health Check
app.get("/", (req, res) => {
  res.send("Mental Well-being Companion API is running...");
});

// Start the server
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
