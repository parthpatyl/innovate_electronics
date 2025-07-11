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
    enum: ['upcoming', 'past', 'cancelled'],
    default: 'upcoming',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema); 