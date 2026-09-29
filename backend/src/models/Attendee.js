import mongoose from 'mongoose';

const attendeeSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'checked-in', 'cancelled', 'waitlist'],
      default: 'registered'
    },
    ticketType: {
      type: String,
      default: 'General Admission'
    },
    qrCodeRef: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    dietaryPreferences: {
      type: String,
      default: 'Standard'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate registration for the same event by the same user
attendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Attendee', attendeeSchema);
