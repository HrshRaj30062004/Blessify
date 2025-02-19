require("dotenv").config(); // Ensure environment variables are loaded
const express = require("express");
const protect = require("../middleware/authware"); // Ensure correct middleware path
const Journal = require("../models/Journal"); // Import Journal model
const vader = require("vader-sentiment"); // Import VADER Sentiment Analysis
const { OpenAI } = require("openai"); // Import OpenAI API once
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Initialize OpenAI

const router = express.Router();

// POST route to add journal entry (protected by middleware)
router.post("/add-journal", protect, async (req, res) => {
  const { journalEntry } = req.body;

  if (!journalEntry) {
    return res.status(400).json({ message: "Journal entry is required!" });
  }

  try {
    // Perform sentiment analysis
    const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(journalEntry);
    const sentimentScore = sentiment.compound;
    let sentimentAnalysis = "Neutral";

    if (sentimentScore >= 0.05) {
      sentimentAnalysis = "Positive";
    } else if (sentimentScore <= -0.05) {
      sentimentAnalysis = "Negative";
    }

    console.log("User ID:", req.user.id);
    // Create a new journal entry with sentiment data
    const newJournal = new Journal({
      journalEntry,
      user: req.user.id, // Store user ID correctly
      sentimentScore,
      sentimentAnalysis,
    });

    // Save entry to MongoDB
    await newJournal.save();

    res.status(201).json({
      message: "Journal entry created successfully",
      journalEntry,
      sentimentScore,
      sentimentAnalysis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET route to fetch all journal entries for the logged-in user (protected)
router.get("/get-journals", protect, async (req, res) => {
  try {
    const journals = await Journal.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("journalEntry sentimentScore sentimentAnalysis createdAt");

    if (!journals || journals.length === 0) {
      return res.status(404).json({ message: "No journal entries found." });
    }

    res.status(200).json(journals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE route to remove a journal entry
router.delete("/delete-journal/:id", protect, async (req, res) => {
  try {
    const journalEntry = await Journal.findById(req.params.id);

    if (!journalEntry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    if (journalEntry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this entry" });
    }

    await Journal.findByIdAndDelete(req.params.id); // Updated to findByIdAndDelete()

    res.status(200).json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT route to update a journal entry
router.put("/update-journal/:id", protect, async (req, res) => {
  try {
    const journalEntry = await Journal.findById(req.params.id);

    if (!journalEntry) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    if (journalEntry.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this entry" });
    }

    journalEntry.journalEntry = req.body.journalEntry || journalEntry.journalEntry;
    await journalEntry.save(); // Save updated entry

    res.status(200).json({ message: "Journal entry updated successfully", journalEntry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET route to track sentiment trends over time (Protected)
router.get("/track-sentiment", protect, async (req, res) => {
  try {
    // Fetch journal entries of the logged-in user, sorted by creation date
    const journals = await Journal.find({ user: req.user.id })
      .sort({ createdAt: 1 }) // Sort in ascending order (oldest to newest)
      .select("journalEntry sentimentScore sentimentAnalysis createdAt"); // Select only required fields

    if (!journals || journals.length === 0) {
      return res.status(404).json({ message: "No journal entries found." });
    }

    res.status(200).json(journals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST route to get AI-generated mood recommendations
router.post("/mood-recommendation", protect, async (req, res) => {
  const { sentimentAnalysis, sentimentScore } = req.body;

  if (!sentimentAnalysis || !sentimentScore) {
    return res.status(400).json({ message: "Sentiment analysis data is required!" });
  }

  try {
    // Generate AI recommendations based on sentiment
    let moodSuggestion = "";

    if (sentimentAnalysis === "Positive") {
      moodSuggestion = "You're in a great mood! Here are some suggestions: Try sharing your positivity with others, plan a fun activity, or enjoy a nature walk.";
    } else if (sentimentAnalysis === "Negative") {
      moodSuggestion = "It seems like you're feeling down. Take some time for self-care. Consider activities like meditation, deep breathing, or connecting with a friend.";
    } else {
      moodSuggestion = "You're feeling neutral. A productive task or a small creative activity might lift your spirits.";
    }

    // Call ChatGPT to generate personalized recommendations
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-3.5-turbo"
      messages: [
        { role: "system", content: "You are an AI wellness assistant" },
        { role: "user", content: `I'm feeling ${sentimentAnalysis}. Suggest some activities based on this mood.` },
      ],
    });

    // Retrieve the recommendation from the ChatGPT response
    const aiRecommendation = response.choices[0].message.content;

    // Combine AI suggestion with pre-defined logic
    const fullRecommendation = `${moodSuggestion} Also, here's a suggestion from AI: ${aiRecommendation}`;

    res.status(200).json({ message: "Mood recommendations generated successfully", fullRecommendation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while generating recommendations" });
  }
});


module.exports = router;
