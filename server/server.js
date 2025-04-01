require('dotenv').config(); // Load environment variables first

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB at startup
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
    dateOfBirth: { type: Date },
    location: { type: String },
    language: { type: String, default: 'English' },
    medicalHistory: [{ condition: String, notes: String }],
    medications: [{ name: String, dosage: String, schedule: String }],
    allergies: [String],
    caregiverContacts: [{ name: String, phone: String, email: String }],
    emergencyContacts: [{ name: String, phone: String }],
    medicalReports: [{ filename: String, path: String }],
    accessibility: {
      fontSize: { type: String, default: 'Large' },
      colorScheme: { type: String, default: 'Soothing Pastels' },
    }
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 8); // Reduced from 10 to 8 for speed
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

// Journal Schema
const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  image: { type: String, required: true },
  text: { type: String, required: true },
  withPeople: [{ type: String }],
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

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId || decoded.id; // Handle both userId and id
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'healthy' }));

// User Routes
app.post('/api/users/register', async (req, res) => {
  console.time('register');
  try {
    const { name, email, password, profile = {} } = req.body;
    console.timeLog('register', 'Parsed body');
    profile.medicalReports = [];
    const existingUser = await User.findOne({ email });
    console.timeLog('register', 'Checked existing user');
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const user = new User({ name, email, password, profile });
    await user.save();
    console.timeLog('register', 'Saved user');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.timeEnd('register');
    res.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    console.error('Error in /api/users/register:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const profileUpdates = req.body.profile || {};
    profileUpdates.medicalReports = []; // Mock for Vercel
    user.profile = { ...user.profile, ...profileUpdates };
    await user.save();
    res.json(user.profile);
  } catch (error) {
    console.error('Error updating profile:', error);
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    console.error('Error in /api/users/login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Journal Routes
app.post('/api/journal', authMiddleware, async (req, res) => {
  try {
    const { image, text, withPeople, mood, filter, isFavorited, weatherEffect } = req.body;
    if (!image || !text) return res.status(400).json({ message: 'Image and text are required' });
    const journalEntry = new Journal({ 
      userId: req.userId, 
      image, 
      text, 
      withPeople: withPeople || [], 
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
  try {
    const journalTexts = await Journal.find(
      { userId: req.userId },
      'text'
    ).sort({ createdAt: -1 }).lean();
    const texts = journalTexts.map(entry => entry.text);
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

// Face Recognition Routes (Disabled for Vercel)
app.post('/api/face-recognition/capture', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Face recognition not supported on Vercel serverless' });
});

app.get('/api/captured-frame', authMiddleware, (req, res) => {
  res.status(501).json({ message: 'Face recognition not supported on Vercel serverless' });
});

// Weather Route
app.get('/api/weather', authMiddleware, async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY || 'c44cebc35c234334be13aec7ebf742d1';
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

// Start Server
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});