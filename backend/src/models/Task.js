import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    assignedTo: {
      type: String,
      default: 'Event Team',
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required']
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true
    },
    category: {
      type: String,
      default: 'General'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Task', taskSchema);
