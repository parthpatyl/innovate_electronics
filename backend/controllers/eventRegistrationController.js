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
