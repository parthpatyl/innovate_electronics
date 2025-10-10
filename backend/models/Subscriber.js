const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  preferences: {
    categories: [{
      type: String,
      enum: ['electronics', 'tech-news', 'promotions', 'events', 'blog']
    }],
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  lastEmailSent: {
    type: Date
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Index for faster queries
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ isActive: 1 });
subscriberSchema.index({ subscribedAt: -1 });

// Generate unsubscribe token
subscriberSchema.methods.generateUnsubscribeToken = function() {
  const crypto = require('crypto');
  this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  return this.unsubscribeToken;
};

module.exports = mongoose.model('Subscriber', subscriberSchema); 