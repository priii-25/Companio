require('dotenv').config(); // Load environment variables first

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

const testToken = jwt.sign(
  { userId: "67e2848c1dc2e45490665a46" },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
console.log('Test token for user 67e2848c1dc2e45490665a46:', testToken);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profile: {
    preferredName: { type: String },
    profilePicture: { type: String },
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
      fontSize: { type: String, default: 'Large' },
      colorScheme: { type: String, default: 'Soothing Pastels' },
      voiceActivation: { type: Boolean, default: true }
    }
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

// Routine Schema
const routineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  routines: [{
    time: { type: String, required: true },
    task: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
});

const Routine = mongoose.model('Routine', routineSchema);

// Journal Schema (Updated with withPeople field)
const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  image: { type: String, required: true },
  text: { type: String, required: true },
  withPeople: [{ type: String }], // New field to store names of people in the memory
  mood: { type: String },
  filter: { type: String },
  isFavorited: { type: Boolean, default: false },
  weatherEffect: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Journal = mongoose.model('Journal', journalSchema);

// Story Schema
const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pages: [{ type: String, required: true }],
  mood: { type: String, required: true },
  backdrop: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Story = mongoose.model('Story', storySchema);

// Middleware to verify JWT with additional logging
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Received token in authMiddleware:', token);
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token payload:', decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${server.address().port}`);
});

const wss = new WebSocket.Server({ server });
let activePythonProcess = null;

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'newPersonName' && activePythonProcess) {
      console.log(`Received name from frontend: ${data.name}`);
      activePythonProcess.stdin.write(`${data.name}\n`);
    }
  });

  ws.on('close', () => console.log('WebSocket client disconnected'));
});

// User Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, profile } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const user = new User({ name, email, password, profile: profile || {} });
    await user.save();
    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    console.error('Error in /api/users/register:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    console.error('Error in /api/users/login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Journal Routes (Updated to include withPeople)
app.post('/api/journal', authMiddleware, async (req, res) => {
  try {
    const { image, text, withPeople, mood, filter, isFavorited, weatherEffect } = req.body;
    if (!image || !text) return res.status(400).json({ message: 'Image and text are required' });
    const journalEntry = new Journal({ 
      userId: req.userId, 
      image, 
      text, 
      withPeople: withPeople || [], // Default to empty array if not provided
      mood, 
      filter, 
      isFavorited, 
      weatherEffect 
    });
    await journalEntry.save();
    res.status(201).json({ message: 'Journal entry saved', journalEntry });
  } catch (error) {
    console.error('Error in /api/journal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/journal', authMiddleware, async (req, res) => {
  try {
    const journalEntries = await Journal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(journalEntries);
  } catch (error) {
    console.error('Error in /api/journal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/journal/texts', authMiddleware, async (req, res) => {
  console.log('Request received at /api/journal/texts');
  try {
    console.log('User ID from token in /api/journal/texts:', req.userId);
    const allEntries = await Journal.find({}).limit(5);
    console.log('All journal entries in DB:', allEntries);

    const journalTexts = await Journal.find(
      { userId: new mongoose.Types.ObjectId(req.userId) },
      'text'
    ).sort({ createdAt: -1 }).lean();
    console.log('Raw journal entries for user:', journalTexts);
    const texts = journalTexts.map(entry => entry.text);
    console.log('Fetched texts for user:', texts);

    res.json({ texts });
  } catch (error) {
    console.error('Error fetching journal texts:', error);
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

// Routine Routes
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

// Story Routes
app.get('/api/stories', authMiddleware, async (req, res) => {
  try {
    const stories = await Story.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/stories', authMiddleware, async (req, res) => {
  try {
    const { pages, mood, backdrop } = req.body;
    if (!pages || !mood || !backdrop) {
      return res.status(400).json({ message: 'Pages, mood, and backdrop are required' });
    }
    const story = new Story({ userId: req.userId, pages, mood, backdrop });
    await story.save();
    res.status(201).json({ message: 'Story saved successfully', story });
  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const StoryGenerator = require('./storyteller').StoryGenerator;

app.get('/api/story/:mood', authMiddleware, async (req, res) => {
  try {
    const { mood } = req.params;
    const token = req.header('Authorization')?.replace('Bearer ', ''); 
    const generator = new StoryGenerator(token); 
    const story = await generator.generate(mood);
    res.json({ story });
  } catch (error) {
    console.error("Error generating story:", error);
    res.status(500).json({ message: "Failed to generate story" });
  }
});

// Face Recognition Routes
app.post('/api/face-recognition/capture', authMiddleware, (req, res) => {
  const pythonPath = path.join(__dirname, '..', 'ai', 'Face_Recognition', 'Face_Rec.py');
  const pythonCwd = path.join(__dirname, '..', 'ai', 'Face_Recognition');
  const userFramePath = path.join(pythonCwd, `captured_frame_${req.userId}.jpg`);
  const originalFramePath = path.join(pythonCwd, 'captured_frame.jpg');

  const pythonCommand = process.platform === 'win32' ? '"C:\\Program Files\\Python312\\python.exe"' : 'python3';
  activePythonProcess = spawn(pythonCommand, [pythonPath], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    cwd: pythonCwd,
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  activePythonProcess.stdin.write('4\n');

  let responseSent = false;
  let resultData = null;

  activePythonProcess.stdout.on('data', (data) => {
    const dataStr = data.toString();
    console.log('Python stdout:', dataStr);
    const lines = dataStr.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const result = JSON.parse(line);
        if (result.status === 'frame_captured') {
          fs.renameSync(originalFramePath, userFramePath);
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'frameCaptured', path: userFramePath }));
            }
          });
          activePythonProcess.stdin.write(`${userFramePath}\n`);
        } else if (result.status === 'new_person_detected') {
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'newPersonPrompt', subImageIndex: result.sub_image_index }));
            }
          });
        } else if (result.status === 'success') {
          resultData = result;
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'faceRecognition', result: result }));
            }
          });
        } else if (result.status === 'error') {
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ error: result.message });
          }
        }
      } catch (e) {
        console.log('Non-JSON Python output:', line);
      }
    }
  });

  activePythonProcess.stderr.on('data', (data) => {
    console.error('Python stderr:', data.toString());
  });

  activePythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    if (!responseSent) {
      responseSent = true;
      if (code === 0 && resultData) {
        res.status(200).json({ message: 'Face recognition completed', result: resultData });
      } else {
        res.status(500).json({ error: `Python process failed with code ${code}` });
      }
    }
    activePythonProcess = null;
  });

  setTimeout(() => {
    if (!responseSent) {
      if (activePythonProcess) activePythonProcess.kill();
      responseSent = true;
      res.status(504).json({ error: 'Face recognition timed out' });
    }
  }, 120000);
});

app.get('/api/captured-frame', authMiddleware, (req, res) => {
  const framePath = path.join(__dirname, '..', 'ai', 'Face_Recognition', `captured_frame_${req.userId}.jpg`);
  if (fs.existsSync(framePath)) res.sendFile(framePath);
  else res.status(404).json({ error: 'Frame not found' });
});

app.get('/api/weather', authMiddleware, async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY || 'c44cebc35c234334be13aec7ebf742d1';
  if (!apiKey) {
    return res.status(500).json({ message: 'Weather API key not configured' });
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    const weatherData = {
      condition: response.data.weather[0].main.toLowerCase(),
      temperature: `${Math.round(response.data.main.temp)}°F`,
      description: response.data.weather[0].description,
    };
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
});

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