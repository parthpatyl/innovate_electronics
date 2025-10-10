const EventRegistration = require('../models/EventRegistration');

exports.register = async (req, res) => {
  try {
    const { event_title, full_name, email, phone, company, designation, interests, questions } = req.body;

    if (!event_title || !full_name || !email || !phone || !interests) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    const registration = new EventRegistration({
      event_title,
      full_name,
      email,
      phone,
      company: company || '',
      designation: designation || '',
      interests: Array.isArray(interests) ? interests : [interests],
      questions: questions || '',
    });

    await registration.save();

    res.json({ message: 'Registration successful!' });
  } catch (err) {
    console.error('MongoDB Error:', err);
    res.status(500).json({ message: 'Database error.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.event_title) {
      filter.event_title = req.query.event_title;
    }
    const registrations = await EventRegistration.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: registrations });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ success: false, message: 'Database error.' });
  }
};
