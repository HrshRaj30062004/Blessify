const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Name is required
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure email is unique
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true, // Ensure phone number is unique
    },
    hobbies: {
      type: [String], // Array of hobbies
      default: [], // Default empty array
    },
    profilePicture: {
      type: String, // Stores the **image URL** (from Cloudinary, Firebase, etc.)
      default: "", // Default to empty string
    },
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt fields
  }
);

// Encrypt user password before saving to DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip encryption if password is not modified

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt for encryption
    this.password = await bcrypt.hash(this.password, salt); // Encrypt password
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Compare entered password with hashed password
};

module.exports = mongoose.model("User", userSchema);
