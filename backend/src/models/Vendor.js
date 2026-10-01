import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Catering', 'Photography', 'Decoration', 'Music/AV', 'Transport', 'Venue', 'Equipment', 'Security/Staffing'],
      index: true
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 24
    },
    priceRange: {
      type: String,
      enum: ['₹ (Budget)', '₹₹ (Moderate)', '₹₹₹ (Premium)', '₹₹₹₹ (Luxury)'],
      default: '₹₹ (Moderate)'
    },
    contact: {
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      website: { type: String, default: '' }
    },
    services: [{ type: String }],
    location: {
      type: String,
      default: 'Pan India / Major Cities'
    },
    description: {
      type: String,
      default: ''
    },
    isVerified: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Vendor', vendorSchema);
