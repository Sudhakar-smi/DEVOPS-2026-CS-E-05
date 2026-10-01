import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    day: {
      type: Number,
      default: 1,
      min: 1
    },
    date: {
      type: Date
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:00 AM)'],
      trim: true
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 10:30 AM)'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Session/activity title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    speakerOrLead: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      type: String,
      default: 'Main Stage / Hall',
      trim: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Schedule', scheduleSchema);
