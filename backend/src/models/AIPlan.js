import mongoose from 'mongoose';

const aiPlanSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true
    },
    version: {
      type: Number,
      default: 1
    },
    summary: {
      type: String,
      default: ''
    },
    budgetPlan: [
      {
        category: { type: String, required: true },
        amount: { type: Number, required: true },
        percentage: { type: Number, default: 0 },
        description: { type: String, default: '' },
        priority: { type: String, default: 'High' }
      }
    ],
    schedule: [
      {
        day: { type: Number, default: 1 },
        time: { type: String, required: true },
        activity: { type: String, required: true },
        description: { type: String, default: '' },
        location: { type: String, default: 'Main Venue' }
      }
    ],
    resources: [
      {
        item: { type: String, required: true },
        quantity: { type: String, required: true },
        category: { type: String, default: 'Equipment' },
        notes: { type: String, default: '' }
      }
    ],
    checklist: [
      {
        task: { type: String, required: true },
        category: { type: String, default: 'Preparation' },
        timeline: { type: String, default: '1 week before' },
        completed: { type: Boolean, default: false }
      }
    ],
    risks: [
      {
        title: { type: String, required: true },
        severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
        reason: { type: String, default: '' },
        recommendation: { type: String, default: '' },
        mitigation: { type: String, default: '' }
      }
    ],
    recommendations: [
      {
        title: { type: String, required: true },
        category: { type: String, default: 'General' },
        explanation: { type: String, default: '' },
        action: { type: String, default: '' }
      }
    ],
    isApplied: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('AIPlan', aiPlanSchema);
