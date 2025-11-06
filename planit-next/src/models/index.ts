import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
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
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
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
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for faster lookups
TaskSchema.index({ userId: 1, createdAt: -1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);