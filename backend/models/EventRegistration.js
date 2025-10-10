const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  event_title: { type: String, required: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  company: { type: String, default: '' },
  designation: { type: String, default: '' },
  interests: { type: [String], required: true },
  questions: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
