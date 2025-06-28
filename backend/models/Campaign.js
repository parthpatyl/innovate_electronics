const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Campaign subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Campaign body is required']
  },
  htmlBody: {
    type: String,
    required: [true, 'HTML body is required']
  },
  status: {
    type: String,
    enum: ['draft', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  scheduledFor: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  targetAudience: {
    type: String,
    enum: ['all', 'specific', 'filtered'],
    default: 'all'
  },
  filters: {
    categories: [String],
    frequency: String,
    subscribedAfter: Date,
    subscribedBefore: Date
  },
  specificEmails: [String],
  logs: [{
    email: String,
    status: {
      type: String,
      enum: ['sent', 'failed', 'bounced']
    },
    error: String,
    sentAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
campaignSchema.index({ status: 1 });
campaignSchema.index({ sentAt: -1 });
campaignSchema.index({ scheduledFor: 1 });

// Virtual for success rate
campaignSchema.virtual('successRate').get(function() {
  if (this.recipientCount === 0) return 0;
  return ((this.sentCount / this.recipientCount) * 100).toFixed(2);
});

// Ensure virtuals are serialized
campaignSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema); 