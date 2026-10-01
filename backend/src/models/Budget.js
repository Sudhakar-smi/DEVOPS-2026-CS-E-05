import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    plannedAmount: {
      type: Number,
      required: [true, 'Planned amount is required'],
      min: [0, 'Planned amount cannot be negative']
    },
    actualAmount: {
      type: Number,
      default: 0,
      min: [0, 'Actual amount cannot be negative']
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Budget', budgetSchema);
