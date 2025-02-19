const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    journalEntry: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Link to the User model
      required: true,
    },
    sentimentScore: {
      type: Number, // Stores sentiment score (e.g., -1 to 1)
      required: true,
    },
    sentimentAnalysis: {
      type: String, // Stores "Positive", "Negative", or "Neutral"
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps automatically
  }
);

module.exports = mongoose.model("Journal", journalSchema);
