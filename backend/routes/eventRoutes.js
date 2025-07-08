const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Fetch all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
});

// Create a new event
router.post('/', async (req, res) => {
  try {
    const { title, date, time, location, body, featuredImage, status } = req.body;
    if (!title || !date || !body) {
      return res.status(400).json({ success: false, message: 'Title, date, and body are required fields' });
    }
    const eventData = {
      title,
      date,
      time,
      location,
      body,
      featuredImage,
      status: status || 'upcoming'
    };
    const event = new Event(eventData);
    await event.save();
    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating event', error: error.message });
  }
});

module.exports = router; 