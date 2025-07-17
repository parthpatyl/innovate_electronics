const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const eventRegistrationController = require('../controllers/eventRegistrationController');

// Fetch all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching events', error: error.message });
  }
});

// Route to get all event registrations (for CMS panel) - must come before /:id
router.get('/registrations', eventRegistrationController.getAll);

// Get a single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching event', error: error.message });
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

// Registration route for event attendees
router.post('/register', eventRegistrationController.register);

// Update an event
router.put('/:id', async (req, res) => {
  try {
    const { title, date, time, location, body, featuredImage, status } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, date, time, location, body, featuredImage, status },
      { new: true, runValidators: true }
    );
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event updated successfully', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating event', error: error.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting event', error: error.message });
  }
});

module.exports = router; 