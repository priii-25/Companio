// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { createCanvas } = require('canvas');
const { spawn } = require('child_process');

// Import AI models
const { loadCLIPModel, getImageEmbedding, getSimilarImages } = require('./ai/clip-model');
const { generateCaption } = require('./ai/caption-generator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/dementiaApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Memory Schema
const memorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  imageUrl: String,
  audioUrl: String,
  aiCaption: String,
  imageEmbedding: [Number], // Vector embedding for FAISS search
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

const Memory = mongoose.model('Memory', memorySchema);

// Set up storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Initialize AI models
let clipModel;
(async () => {
  try {
    clipModel = await loadCLIPModel();
    console.log('CLIP model loaded successfully');
  } catch (error) {
    console.error('Error loading CLIP model:', error);
  }
})();

// Routes
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const imagePath = path.join(__dirname, 'uploads', req.file.filename);
    
    // Generate caption using AI
    const caption = await generateCaption(imagePath);
    
    // Get image embedding for FAISS search
    const embedding = await getImageEmbedding(clipModel, imagePath);

    res.json({ 
      imageUrl, 
      caption, 
      embedding 
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio uploaded' });
    }

    const audioUrl = `/uploads/${req.file.filename}`;
    res.json({ audioUrl });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Error processing audio' });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { title, description, imageUrl, audioUrl, aiCaption, tags, imageEmbedding } = req.body;
    
    // Extract keywords for automatic tagging if tags aren't provided
    let finalTags = tags || [];
    if (finalTags.length === 0 && aiCaption) {
      // Simple keyword extraction from caption
      const keywords = aiCaption.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'from', 'have', 'there'].includes(word));
      
      // Take up to 5 unique keywords
      finalTags = [...new Set(keywords)].slice(0, 5);
    }
    
    const memory = new Memory({
      title,
      description,
      imageUrl,
      audioUrl,
      aiCaption,
      tags: finalTags,
      imageEmbedding
    });
    
    await memory.save();
    res.status(201).json(memory);
  } catch (error) {
    console.error('Error saving memory:', error);
    res.status(500).json({ error: 'Error saving memory' });
  }
});

app.get('/api/memories', async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    res.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: 'Error fetching memories' });
  }
});

app.get('/api/memories/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      const memories = await Memory.find().sort({ createdAt: -1 });
      return res.json(memories);
    }
    
    // Text-based search
    const textSearchResults = await Memory.find({ 
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { aiCaption: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    });
    
    // If we have an image, we'll do similarity search
    if (clipModel && q.startsWith('image:')) {
      const imageId = q.replace('image:', '');
      const sourceMemory = await Memory.findById(imageId);
      
      if (sourceMemory && sourceMemory.imageEmbedding) {
        // Get all memories with image embeddings
        const allMemories = await Memory.find({ imageEmbedding: { $exists: true, $ne: [] } });
        
        // Prepare data for FAISS search
        const imageResults = await getSimilarImages(
          clipModel,
          sourceMemory.imageEmbedding,
          allMemories.map(m => ({
            id: m._id.toString(),
            embedding: m.imageEmbedding
          }))
        );
        
        // Merge results
        const similarMemories = await Memory.find({
          _id: { $in: imageResults.map(r => r.id) }
        });
        
        // Combine both result sets
        const combinedResults = [...new Set([...textSearchResults, ...similarMemories])];
        return res.json(combinedResults);
      }
    }
    
    res.json(textSearchResults);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ error: 'Error searching memories' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});