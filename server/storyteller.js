// server/storyteller.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose'); // Import mongoose
const Journal = mongoose.model('Journal'); // Access the Journal model (already defined in server.js)

class StoryGenerator {
  // The token is no longer needed here as we query DB directly
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || ""; // Prefer GEMINI_API_KEY if set
    const googleApiKey = process.env.GOOGLE_API_KEY || ""; // Fallback to GOOGLE_API_KEY
    const finalApiKey = apiKey || googleApiKey; // Use whichever is available

    if (!finalApiKey || finalApiKey === "AIzaSyD2e4TPfRcCHAc_9fEHna_3duYuoN") {
      console.warn("Warning: No valid API key found in GEMINI_API_KEY or GOOGLE_API_KEY. Using placeholder (may fail).");
    }
    console.log("StoryGenerator using API key ending with:", finalApiKey.slice(-4)); // Log only last 4 chars
    this.genAI = new GoogleGenerativeAI(finalApiKey);
  }

  // Modify to accept userId and query DB
  async fetchJournalEntries(userId) {
    try {
      console.log(`StoryGenerator: Fetching journal texts for userId: ${userId}`);
      // Direct Mongoose query
      const journalDocs = await Journal.find(
        { userId: new mongoose.Types.ObjectId(userId) }, // Filter by the user ID
        'text' // Select only the 'text' field
      )
      .sort({ createdAt: -1 }) // Keep the sorting
      .lean(); // Use lean() for performance as we only need plain objects

      const texts = journalDocs.map(entry => entry.text);
      console.log(`StoryGenerator: Found ${texts.length} journal texts for user.`);
      return { texts }; // Return in the expected format { texts: [...] }

    } catch (error) {
      console.error("StoryGenerator: Error fetching entries directly from DB:", error.message);
      return { texts: [] }; // Return empty on error
    }
  }

  parseMemories(entries) {
    const parsed = [];
    for (const entry of entries) {
      // Add a check for null/undefined entries
      if (!entry) continue;
      const setting = this.extractSetting(entry);
      const emotion = this.extractEmotion(entry);
      const event = this.extractEvent(entry, setting);
      parsed.push({ setting, emotion, event });
    }
    console.log("Parsed memories:", parsed);
    return parsed;
  }

  extractSetting(entry) {
    if (!entry || typeof entry !== 'string') return "unknown place"; // Add validation
    const words = entry.toLowerCase().split(" ");
    const settings = ["window", "lake", "shop", "coffee", "garden", "room", "forest", "street"];
    return words.find(word => settings.includes(word)) || "unknown place";
  }

  extractEmotion(entry) {
    if (!entry || typeof entry !== 'string') return "neutral"; // Add validation
    const lowerEntry = entry.toLowerCase();
    if (lowerEntry.includes("thinking") || lowerEntry.includes("old") || lowerEntry.includes("remember")) return "nostalgia";
    if (lowerEntry.includes("smiling") || lowerEntry.includes("laughed") || lowerEntry.includes("favourite") || lowerEntry.includes("happy")) return "joy";
    if (lowerEntry.includes("closed") || lowerEntry.includes("lost") || lowerEntry.includes("sad")) return "loss";
    if (lowerEntry.includes("new") || lowerEntry.includes("added")) return "curiosity";
    return "neutral";
  }

  extractEvent(entry, setting) {
    if (!entry || typeof entry !== 'string') return "an event unfolded"; // Add validation
    const lowerEntry = entry.toLowerCase();
    const settingIndex = setting !== "unknown place" ? lowerEntry.indexOf(setting) : -1; // Avoid searching for "unknown place"

    if (settingIndex !== -1) {
      // Try to get text *after* the setting word
      const eventText = entry.slice(settingIndex + setting.length).trim().replace(/^[,. ]+/, ''); // Remove leading punctuation/space
      // If the remaining text is very short or just punctuation, fall back
      if (eventText && eventText.length > 5) {
         return eventText;
      }
    }
    // Fallback: Try to remove common possessives/articles if setting wasn't found or eventText was poor
    const keywords = ["my", "favourite", "new", "added", "a", "an", "the", "i", "was", "felt"];
    let event = entry;
    keywords.forEach(keyword => {
      // Use word boundaries to avoid partial word replacement
      event = event.replace(new RegExp(`\\b${keyword}\\b`, "gi"), "").trim();
    });
    // Remove leading/trailing punctuation and excessive spaces
    event = event.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '').replace(/\s\s+/g, ' ').trim();
    return event || "an event unfolded";
  }


  adaptToMood(mood) {
    let tone, style;
    switch (mood?.toLowerCase()) { // Add null check for mood
      case "melancholic":
        tone = "reflective, somber";
        style = "slow-paced, detailed";
        break;
      case "joyful":
        tone = "upbeat, warm";
        style = "light, conversational";
        break;
      case "mysterious":
        tone = "enigmatic, subtle";
        style = "intriguing, descriptive";
        break;
      case "thrilling":
        tone = "exciting, tense";
        style = "fast-paced, vivid";
        break;
      case "serene":
        tone = "calm, peaceful";
        style = "gentle, flowing";
        break;
      case "nostalgic":
        tone = "sentimental, wistful";
        style = "reflective, evocative";
        break;
      default:
        tone = "neutral";
        style = "clear, straightforward";
    }
    return { tone, style };
  }

  async weaveStoryWithGemini(parsedMemories, tone, style) {
    // Check if model name needs adjusting for fine-tuned vs base
     const modelName = "gemini-1.5-flash"; // Using base model, fine-tuned needs specific call usually
     const model = this.genAI.getGenerativeModel({ model: modelName });

    let prompt = `Create a compelling short story (around 3-5 paragraphs) with a ${tone} tone and ${style} style, weaving together these core memories:\n\n`;
    parsedMemories.forEach((memory, index) => {
      // Ensure memory components are valid strings
      const setting = memory.setting || "an unknown place";
      const event = memory.event || "something happened";
      const emotion = memory.emotion || "a neutral feeling";
      prompt += `${index + 1}. Setting: ${setting}. Event: ${event}. Emotion: ${emotion}.\n`;
    });
    prompt += "\nStructure the story with a clear beginning, middle, and end. Blend the memories naturally into a coherent narrative, focusing on the overall mood and style requested. Expand slightly on the provided details where appropriate to create a richer experience.";
    console.log("Gemini prompt:", prompt);

    try {
      const result = await model.generateContent(prompt);
      // Add more robust response checking
      if (result && result.response && result.response.text) {
           return result.response.text();
      } else if (result && result.response && result.response.candidates && result.response.candidates[0].content.parts[0].text) {
          // Handle potential alternative response structure
          return result.response.candidates[0].content.parts[0].text;
      } else {
          console.error("Gemini API response format not recognized:", result);
          throw new Error("Invalid response format from Gemini API");
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      // Fallback story generation remains the same
      let fallbackStory = "";
      if (parsedMemories.length > 0) {
        fallbackStory += `In ${parsedMemories[0].setting || 'a place'}, the tale began with ${parsedMemories[0].event || 'an event'}, touched by a ${tone} air. `;
        for (let i = 1; i < parsedMemories.length - 1; i++) {
           fallbackStory += `Then, in ${parsedMemories[i].setting || 'another place'}, ${parsedMemories[i].event || 'something else happened'}, hinting at ${parsedMemories[i].emotion || 'a feeling'}. `;
        }
         if (parsedMemories.length > 1) {
           fallbackStory += `Finally, in ${parsedMemories[parsedMemories.length - 1].setting || 'the last place'}, ${parsedMemories[parsedMemories.length - 1].event || 'the final event occurred'}, leaving a ${tone} resonance.`;
         }
      } else {
        fallbackStory = "No memories were found to craft a story.";
      }
      console.log("Using fallback story.");
      return fallbackStory;
    }
  }

  // Modify to accept userId
  async generate(mood, userId) {
    // Pass userId to fetchJournalEntries
    const entries = await this.fetchJournalEntries(userId);
    // Log the fetched entries for debugging
    console.log("StoryGenerator: Fetched entries object:", entries);
    const textEntries = entries?.texts || []; // Safer access

    if (!Array.isArray(textEntries)) {
       console.error("StoryGenerator: Fetched entries.texts is not an array:", textEntries);
       return "Error: Could not retrieve memories.";
    }

    if (textEntries.length === 0) {
       console.log("StoryGenerator: No text entries found for user.");
       return "No memories found to generate a story from.";
    }

    console.log(`StoryGenerator: Processing ${textEntries.length} text entries.`);
    const parsedMemories = this.parseMemories(textEntries);

    // Handle case where parsing might yield empty results (if all entries are invalid)
    if (parsedMemories.length === 0) {
        console.log("StoryGenerator: No valid memories could be parsed.");
        return "Could not understand the provided memories to generate a story.";
    }

    const { tone, style } = this.adaptToMood(mood);
    return await this.weaveStoryWithGemini(parsedMemories, tone, style);
  }
}

module.exports = { StoryGenerator };