import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const UserSchema = new mongoose.Schema({
  username: { 
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String,
    required: false,
    default: null
  },
  provider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials'
  },
  providerId: {
    type: String // Google user ID for OAuth users
  },
  name: {
    type: String // Full name from Google
  },
  image: {
    type: String // Profile image URL from Google
  },
  profession: { 
    type: String 
  },
  pomodoroSettings: {
    workDuration: { type: Number, default: 25 }, // minutes
    shortBreakDuration: { type: Number, default: 5 }, // minutes
    longBreakDuration: { type: Number, default: 15 }, // minutes
    longBreakInterval: { type: Number, default: 4 } // sessions before long break
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // Disable default validation, we'll handle it in pre-save hook
  validateBeforeSave: true
});

// Pre-save validation hook
UserSchema.pre('validate', function(next) {
  // Skip validation for OAuth users
  if (this.provider === 'google') {
    return next();
  }
  // If provider is credentials or not set (default), password and username are required
  if ((this.provider === 'credentials' || !this.provider) && !this.password) {
    return next(new Error('Password is required for credentials authentication'));
  }
  if ((this.provider === 'credentials' || !this.provider) && !this.username) {
    return next(new Error('Username is required for credentials authentication'));
  }
  next();
});

const TaskSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  priority: { 
    type: String, 
    default: 'medium', 
    enum: ['low', 'medium', 'high'] 
  },
  status: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'in-progress', 'completed', 'overdue'] 
  },
  dueDate: { 
    type: Date 
  },
  startTime: {
    type: String, // Format: "HH:mm" (24-hour format, e.g., "14:30")
    default: null
  },
  endTime: {
    type: String, // Format: "HH:mm" (24-hour format, e.g., "16:00")
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for faster lookups
TaskSchema.index({ userId: 1, createdAt: -1 });

const ChatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'tool', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const ChatThreadSchema = new mongoose.Schema({
  threadId: {
    type: String,
    unique: true,
    default: () => randomUUID(),
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New chat',
    trim: true,
  },
  messages: {
    type: [ChatMessageSchema],
    default: [],
  },
}, {
  timestamps: true,
});

ChatThreadSchema.pre('save', function handleTitle(next) {
  if (!this.title && this.messages?.length) {
    this.title = this.messages[0].content.slice(0, 60);
  }
  next();
});

const TaskCompletionHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  completedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  taskTitle: {
    type: String,
    required: true
  }
});

// Add index for faster queries
TaskCompletionHistorySchema.index({ userId: 1, completedAt: -1 });
TaskCompletionHistorySchema.index({ userId: 1, taskId: 1 }, { unique: true });

// Clear model cache to ensure fresh schema
if (mongoose.models.User) {
  delete mongoose.models.User;
}
if (mongoose.models.Task) {
  delete mongoose.models.Task;
}
if (mongoose.models.ChatThread) {
  delete mongoose.models.ChatThread;
}
if (mongoose.models.TaskCompletionHistory) {
  delete mongoose.models.TaskCompletionHistory;
}

export const User = mongoose.model('User', UserSchema);
export const Task = mongoose.model('Task', TaskSchema);
export const ChatThread = mongoose.model('ChatThread', ChatThreadSchema);
export const TaskCompletionHistory = mongoose.model('TaskCompletionHistory', TaskCompletionHistorySchema);