import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Feedback comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    category: {
      type: String,
      enum: ['General', 'Venue', 'Catering', 'Organization', 'Speakers/Content', 'Registration'],
      default: 'General'
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'positive'
    }
  },
  {
    timestamps: true
  }
);

// Prevent multiple feedbacks from the same user on the same event
feedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Feedback', feedbackSchema);
