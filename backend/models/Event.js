const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    trim: true
  },
  time: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    trim: true
  },
  featuredImage: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'archived', 'cancelled'],
    default: 'upcoming',
    required: true
  },
  imageData: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema); 