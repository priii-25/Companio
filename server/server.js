// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema with Profile Fields
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profile: {
    preferredName: { type: String },
    profilePicture: { type: String }, // Base64 or URL
    dateOfBirth: { type: Date },
    location: { type: String },
    language: { type: String, default: 'English' },
    medicalHistory: [{ condition: String, notes: String }],
    medications: [{ name: String, dosage: String, schedule: String }],
    allergies: [String],
    caregiverContacts: [{ name: String, phone: String, email: String }],
    emergencyContacts: [{ name: String, phone: String }],
    recognizedFaces: [{ name: String, relationship: String, photo: String }],
    accessibility: {
      fontSize: { type: String, default: 'Large' }, // 'Large', 'Extra Large'
      colorScheme: { type: String, default: 'Soothing Pastels' }, // 'Soothing Pastels', 'High Contrast'
      voiceActivation: { type: Boolean, default: true }
    }
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);
// Add this after the Journal Schema
const routineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // ISO date string (e.g., "2025-03-21")
  routines: [{
    time: { type: String, required: true },
    task: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
});

const Routine = mongoose.model('Routine', routineSchema);

// Get routines for a specific date
app.get('/api/routines/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const routine = await Routine.findOne({ userId: req.userId, date });
    res.json(routine ? routine.routines : []);
  } catch (error) {
    console.error('Error fetching routines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or update routines for a specific date
app.post('/api/routines/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const { routines } = req.body;

    let routineDoc = await Routine.findOne({ userId: req.userId, date });
    if (routineDoc) {
      routineDoc.routines = routines;
      await routineDoc.save();
    } else {
      routineDoc = new Routine({ userId: req.userId, date, routines });
      await routineDoc.save();
    }
    res.status(201).json({ message: 'Routines saved successfully', routines: routineDoc.routines });
  } catch (error) {
    console.error('Error saving routines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Optional: Get all routines for a user (for calendar overview)
app.get('/api/routines', authMiddleware, async (req, res) => {
  try {
    const routines = await Routine.find({ userId: req.userId }).select('date routines');
    const routinesMap = routines.reduce((acc, curr) => {
      acc[curr.date] = curr.routines;
      return acc;
    }, {});
    res.json(routinesMap);
  } catch (error) {
    console.error('Error fetching all routines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Journal Schema
const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: String, required: true },
  text: { type: String, required: true },
  mood: { type: String },
  filter: { type: String },
  isFavorited: { type: Boolean, default: false },
  weatherEffect: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Journal = mongoose.model('Journal', journalSchema);

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Journal Routes
app.post('/api/journal', authMiddleware, async (req, res) => {
  try {
    console.log('Received request to /api/journal');
    console.log('Body:', req.body);
    const { image, text, mood, filter, isFavorited, weatherEffect } = req.body;
    if (!image || !text) {
      console.log('Missing image or text');
      return res.status(400).json({ message: 'Image and text are required' });
    }

    const journalEntry = new Journal({
      userId: req.userId,
      image,
      text,
      mood,
      filter,
      isFavorited,
      weatherEffect,
    });

    await journalEntry.save();
    console.log('Journal entry saved:', journalEntry);
    res.status(201).json({ message: 'Journal entry saved successfully', journalEntry });
  } catch (error) {
    console.error('Error saving journal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/journal', authMiddleware, async (req, res) => {
  try {
    const journalEntries = await Journal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(journalEntries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile Routes
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.profile || {});
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Merge updates into the profile object
    user.profile = { ...user.profile, ...updates };
    await user.save();
    res.json({ message: 'Profile updated successfully', profile: user.profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/profile/insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const journalCount = await Journal.countDocuments({ userId });
    const favoriteCount = await Journal.countDocuments({ userId, isFavorited: true });
    const moodStats = await Journal.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$mood', count: { $sum: 1 } } }
    ]);

    const insights = {
      totalMemories: journalCount,
      favoriteMemories: favoriteCount,
      moodBreakdown: moodStats.reduce((acc, item) => {
        acc[item._id || 'No Mood'] = item.count;
        return acc;
      }, {})
    };

    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// WebSocket Server and Face Recognition Routes
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

app.post('/api/face-recognition/capture', (req, res) => {
  const pythonPath = path.join(__dirname, '..', 'ai', 'Face_Recognition', 'Face_Rec.py');
  const pythonCommand = process.env.PYTHON_EXECUTABLE || 'python3';
  const pythonCwd = path.join(__dirname, '..', 'ai', 'Face_Recognition');
  
  console.log(`Using Python executable: ${pythonCommand}`);
  console.log(`Python script path: ${pythonPath}`);
  console.log(`Python working directory: ${pythonCwd}`);
  console.log(`Environment PATH: ${process.env.PATH}`);

  let pythonProcess;
  try {
    pythonProcess = spawn(pythonCommand, [pythonPath], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      cwd: pythonCwd
    });
  } catch (error) {
    console.error('Error spawning Python process:', error);
    return res.status(500).json({ error: 'Failed to start webcam capture: Python executable not found.' });
  }

  pythonProcess.stdin.write('4\n'); // Use the new capture and process mode

  let output = '';
  let errorOutput = '';
  pythonProcess.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    const lines = dataStr.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        if (result.status === 'frame_captured') {
          console.log('Frame captured:', result.path);
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'frameCaptured', path: result.path }));
            }
          });
        } else if (result.status === 'success') {
          console.log('Face recognition result:', result);
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'faceRecognition', result }));
            }
          });
        }
      } catch (e) {
        console.log('Python script output:', line);
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    const errorStr = data.toString();
    errorOutput += errorStr;
    console.error(`Python error: ${errorStr}`);
    if (errorStr.includes('ModuleNotFoundError')) {
      pythonProcess.kill();
      res.status(500).json({ error: 'Face recognition failed: Missing Python dependencies (e.g., tensorflow). Please install them.' });
    }
  });

  pythonProcess.on('error', (error) => {
    console.error('Python process error:', error);
    res.status(500).json({ error: 'Webcam capture process failed to start.' });
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      res.status(200).json({ message: 'Webcam capture and processing completed', output });
    } else {
      res.status(500).json({ error: 'Webcam capture failed', code, errorOutput });
    }
  });
});

app.get('/api/captured-frame', (req, res) => {
  const framePath = path.join(__dirname, '..', 'ai', 'Face_Recognition', 'captured_frame.jpg');
  if (fs.existsSync(framePath)) {
    res.sendFile(framePath);
  } else {
    res.status(404).json({ error: 'Frame not found' });
  }
});

// Cleanup on server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});