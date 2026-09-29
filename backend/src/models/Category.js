import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    group: {
      type: String,
      enum: ['Personal', 'Professional', 'Educational', 'Entertainment', 'Sports', 'Custom'],
      default: 'Personal'
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'Calendar'
    },
    isDefault: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Category', categorySchema);
