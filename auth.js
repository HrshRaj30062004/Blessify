const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

// Middleware to protect routes and extract userId from token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from header

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Attach userId to the request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// POST route to handle user signup
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
    });

    // Save the new user to the database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id.toString() }, // Ensure `userId` is stored as a string
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
    });
  } catch (error) {
    console.error("Sign Up Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST route to handle user login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id.toString() }, // Ensure `userId` is stored as a string
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT route to handle updating user profile
router.put("/updateProfile", authMiddleware, async (req, res) => {
  const { name, phone, hobbies, profilePicture, username, bio, interests, dob } = req.body;

  try {
    // Find user by userId (which is attached to the request by authMiddleware)
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user profile fields
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.hobbies = hobbies || user.hobbies;
    user.profilePicture = profilePicture || user.profilePicture;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.interests = interests || user.interests;
    user.dob = dob || user.dob;

    // Save the updated user object
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
