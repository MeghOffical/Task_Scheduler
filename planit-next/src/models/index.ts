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
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for faster lookups
TaskSchema.index({ userId: 1, createdAt: -1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);