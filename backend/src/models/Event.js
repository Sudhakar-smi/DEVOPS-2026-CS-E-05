import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event must have an organizer'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide an event name'],
      trim: true,
      maxlength: [100, 'Event name cannot exceed 100 characters']
    },
    type: {
      type: String,
      required: [true, 'Please provide an event type'],
      trim: true
    },
    categoryGroup: {
      type: String,
      enum: ['Personal', 'Professional', 'Educational', 'Entertainment', 'Sports', 'Custom'],
      default: 'Personal'
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    date: {
      type: Date,
      required: [true, 'Please provide an event date'],
      index: true
    },
    endDate: {
      type: Date
    },
    duration: {
      type: String,
      required: [true, 'Please provide event duration (e.g. 1 day, 2 days, 6 hours)'],
      default: '1 day'
    },
    location: {
      type: String,
      required: [true, 'Please provide a location/city'],
      trim: true
    },
    venueName: {
      type: String,
      trim: true,
      default: ''
    },
    budget: {
      type: Number,
      required: [true, 'Please provide an event budget'],
      min: [0, 'Budget must be a positive number']
    },
    expectedAttendees: {
      type: Number,
      required: [true, 'Please provide expected attendees count'],
      min: [1, 'Expected attendees must be at least 1']
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'in-progress', 'completed', 'cancelled'],
      default: 'published',
      index: true
    },
    preferences: {
      cateringType: { type: String, default: 'Mixed' },
      theme: { type: String, default: 'Modern / Standard' },
      indoorOutdoor: { type: String, default: 'Indoor' },
      specialRequirements: { type: String, default: '' }
    },
    requirements: {
      type: String,
      default: ''
    },
    bannerImage: {
      type: String,
      default: ''
    },
    tags: [{ type: String }],
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for attendee count
eventSchema.virtual('attendeesCount', {
  ref: 'Attendee',
  localField: '_id',
  foreignField: 'eventId',
  count: true
});

export default mongoose.model('Event', eventSchema);
