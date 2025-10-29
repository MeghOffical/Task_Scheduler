require('dotenv').config(); // Keep this for the API Key
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // <-- Mongoose for MongoDB
const authMiddleware = require('./authMiddleware');
const multer = require('multer');
const csv = require('csv-parser');
const stream = require('stream');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3000;

// --- Configure Google AI ---
console.log("Attempting to load API Key:", process.env.GEMINI_API_KEY ? "Key Found!" : "KEY NOT FOUND!");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ---

// --- Middleware ---
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Connect to MongoDB ---
// ▼▼▼ PASTE YOUR REAL MONGODB ATLAS CONNECTION STRING HERE ▼▼▼
// Make sure to replace <username>, <password>, and add your database name (e.g., planitDB)
const MONGO_URI = "mongodb+srv://chaitanyavats3585_db_user:z4lMWfEQ4IeLxZEq@cluster0.si8jdny.mongodb.net/planitDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB! 💾');
    // Start server ONLY after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit if DB connection fails
  });

// --- Define Database Models (Schemas) ---

// User Model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profession: { type: String },
});
const User = mongoose.model('User', UserSchema);

// Task Model
const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to User
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, default: 'medium', enum: ['low', 'medium', 'high'] },
  status: { type: String, default: 'pending', enum: ['pending', 'in-progress', 'completed'] },
  dueDate: { type: Date, default: null }, // Mongoose handles date conversion
  createdAt: { type: Date, default: Date.now }
});
// Add an index for faster task lookups by user
TaskSchema.index({ user: 1, createdAt: -1 });
const Task = mongoose.model('Task', TaskSchema);

// --- API ROUTES ---

// --- Test Route ---
app.get('/api/test', (req, res) => {
  res.json({ message: "Hello from the backend! 👋" });
});

// --- REGISTER ROUTE ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, profession } = req.body;
    // Basic input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.create({ username, email, profession, password: hashedPassword });
    console.log('New user registered:', username);
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// --- LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username }, // Use MongoDB _id
      'your-secret-key-123', // !!! IMPORTANT: Use an environment variable for this in production !!!
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: "Login successful!", token: token, username: user.username });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// --- GET ALL TASKS ---
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    // req.user.id comes from the authMiddleware after verifying the token
    const userTasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 }); // Get tasks for the logged-in user
    // Mongoose returns _id, we need to map it to id for the frontend if necessary,
    // or update frontend to use _id. Let's send _id as id.
    const tasksWithId = userTasks.map(task => ({
        id: task._id, // Map MongoDB's _id to id
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt
    }));
    res.status(200).json(tasksWithId);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Server error fetching tasks." });
  }
});

// --- CREATE A NEW TASK ---
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    if (!title) {
        return res.status(400).json({ message: "Task title is required." });
    }
    const newTask = await Task.create({
      user: req.user.id, // Link task to the logged-in user
      title,
      description,
      priority,
      status,
      // Mongoose automatically handles converting valid date strings
      dueDate: dueDate ? new Date(dueDate) : null
    });
     // Map _id to id for the response
    const taskResponse = { ...newTask.toObject(), id: newTask._id };
    delete taskResponse._id; // Remove _id if frontend expects id
    delete taskResponse.__v; // Remove Mongoose version key

    res.status(201).json(taskResponse);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Server error creating task." });
  }
});

// --- UPDATE A TASK (PUT) ---
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
       return res.status(400).json({ message: "Invalid task ID format" });
    }
    const { title, description, priority, status, dueDate } = req.body;
    if (!title) {
        return res.status(400).json({ message: "Task title cannot be empty." });
    }
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, user: req.user.id }, // Find query by task ID and user ID
      { title, description, priority, status, dueDate: dueDate ? new Date(dueDate) : null }, // Update data
      { new: true } // Return the updated document
    );
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found or user unauthorized" });
    }
     // Map _id to id for the response
    const taskResponse = { ...updatedTask.toObject(), id: updatedTask._id };
    delete taskResponse._id;
    delete taskResponse.__v;
    res.status(200).json(taskResponse);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Server error updating task." });
  }
});

// --- DELETE A TASK (DELETE) ---
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
       return res.status(400).json({ message: "Invalid task ID format" });
    }
    const deletedTask = await Task.findOneAndDelete({ _id: taskId, user: req.user.id });
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found or user unauthorized" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Server error deleting task." });
  }
});

// --- UPDATE TASK STATUS (PATCH) ---
app.patch('/api/tasks/:id/status', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
       return res.status(400).json({ message: "Invalid task ID format" });
    }
    const { status } = req.body;
    if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
         return res.status(400).json({ message: "Invalid status value." });
    }
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, user: req.user.id },
      { status }, // Update only the status
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found or user unauthorized" });
    }
    // Map _id to id for the response
    const taskResponse = { ...updatedTask.toObject(), id: updatedTask._id };
    delete taskResponse._id;
    delete taskResponse.__v;
    res.status(200).json(taskResponse);
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Server error updating status." });
  }
});

// --- GET TASK STATISTICS ---
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Use Mongoose countDocuments for efficiency
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'completed' });
    const highPriorityTasks = await Task.countDocuments({ user: userId, priority: 'high' });
    const pendingTasks = totalTasks - completedTasks; // Calculate pending

    res.status(200).json({ totalTasks, completedTasks, pendingTasks, highPriorityTasks });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Server error fetching stats." });
  }
});

// --- IMPORT TASKS FROM CSV ---
// Placeholder - Needs specific Mongoose logic for bulk operations
app.post('/api/tasks/import', authMiddleware, upload.single('csvfile'), (req, res) => {
  res.status(501).json({ message: "CSV Import not yet implemented with MongoDB." });
});

// --- CHATBOT ROUTE ---
app.post('/api/chatbot', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) { return res.status(400).json({ message: "No message provided." }); }
    // Ensure genAI is initialized before using it
    if (!genAI) { throw new Error("Google AI client not initialized."); }
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest"});
    const prompt = `You are a helpful and concise task management assistant for an app called 'PlanIt'. The user's message is: "${message}". Keep your answer to 1-3 sentences.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();
    res.status(200).json({ message: aiText });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ message: "Error communicating with AI." });
  }
});

// Note: app.listen() is inside the mongoose.connect().then() block at the top