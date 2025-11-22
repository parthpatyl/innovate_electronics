const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const eventRegistrationController = require('../controllers/eventRegistrationController');
const emailService = require('../services/emailService');
const upload = require('../middleware/uploadMiddleware');
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
router.post('/', upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, date, time, location, body, status } = req.body;
    if (!title || !date || !body) {
      return res.status(400).json({ success: false, message: 'Title, date, and body are required fields' });
    }

    // Construct the image URL from the uploaded file
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const eventData = {
      title,
      date,
      time,
      location,
      body,
      featuredImage: imageUrl,
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
router.post('/register', async (req, res) => {
  console.log("Received registration:", req.body);
  const {
    event_title, location, full_name, email, phone,
    company, designation, interests, questions
  } = req.body;

  // (Optional) Save registration to DB here
  try {
    const registration = new EventRegistration({
      event_title,
      location,
      full_name,
      email,
      phone,
      company,
      designation,
      interests,
      questions
    });
    await registration.save();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error saving registration', error: err.message });
  }

  // Compose email content
  const subject = `Registration Confirmation: ${event_title}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #003366; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Thank you for registering, ${full_name}!</h2>
      </div>
      <div style="padding: 25px 20px;">
          <p>You have successfully registered for the event: <strong>${event_title}</strong>.</p>
          ${location && location !== 'N/A' ? `<p><strong>Link:</strong> <a href="${location}" target="_blank">${location}</a></p>` : ''}
          <p>Your registration details are confirmed as below:</p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #0056b3; padding: 15px; margin: 20px 0;">
              <ul style="list-style-type: none; padding: 0; margin: 0;">
                  <li style="padding-bottom: 10px;"><strong>Email:</strong> ${email}</li>
                  <li style="padding-bottom: 10px;"><strong>Phone:</strong> ${phone}</li>
                  <li style="padding-bottom: 10px;"><strong>Company:</strong> ${company || 'N/A'}</li>
                  <li style="padding-bottom: 10px;"><strong>Designation:</strong> ${designation || 'N/A'}</li>
                  <li style="padding-bottom: 10px;"><strong>Interests:</strong> ${(interests || []).join(', ') || 'N/A'}</li>
                  <li><strong>Questions/Comments:</strong> ${questions || 'N/A'}</li>
              </ul>
          </div>
          <p>We look forward to seeing you at the event!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #777; text-align: center;">Innovate Electronics</p>
      </div>
    </div>
  `;

  // Send confirmation email to the registrant
  const emailResult = await emailService.sendEmail(
    email, subject, htmlBody
  );

  // Send notification email to the event organizer/registration email
  const organizerEmail = process.env.SMTP_USER;
  if (organizerEmail) {
    const notifySubject = `New Registration for ${event_title}`;
    const notifyBody = `
      <h2>New Event Registration</h2>
      <ul>
        <li><strong>Event:</strong> ${event_title}</li>
        ${location && location !== 'N/A' ? `<li><strong>Link:</strong> <a href="${location}" target="_blank">${location}</a></li>` : ''}
        <li><strong>Name:</strong> ${full_name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Company:</strong> ${company || '-'}</li>
        <li><strong>Designation:</strong> ${designation || '-'}</li>
        <li><strong>Interests:</strong> ${(interests || []).join(', ')}</li>
        <li><strong>Questions/Comments:</strong> ${questions || '-'}</li>
      </ul>
    `;
    console.log("[Registration] Sending organizer notification email to:", organizerEmail, "Subject:", notifySubject);
    emailService.sendEmail(organizerEmail, notifySubject, notifyBody)
      .then(result => console.log('[Registration] Organizer notification email result:', result))
      .catch(err => console.error('[Registration] Error sending organizer notification email:', err));
  } else {
    console.warn('[Registration] Organizer email (SMTP_USER) not set. No notification sent.');
  }

  if (emailResult.success) {
    res.json({ success: true, message: 'Registration successful Sent!' });
  } else {
    res.status(500).json({ success: false, message: 'Registration failed. Could not send email.' });
  }
});

// Send a custom email (utility route)
router.post('/send-email', async (req, res) => {
  const { to, subject, htmlBody } = req.body;
  if (!to || !subject || !htmlBody) {
    return res.status(400).json({ success: false, message: 'to, subject, and htmlBody are required.' });
  }
  try {
    const emailResult = await emailService.sendEmail(to, subject, htmlBody);
    if (emailResult.success) {
      res.json({ success: true, message: 'Email sent successfully!', data: emailResult });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email.', error: emailResult.error });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error sending email.', error: err.message });
  }
});

// Update an event
router.put('/:id', upload.single('featuredImage'), async (req, res) => {
  try {
    const { title, date, time, location, body, status } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Update image URL if a new file was uploaded
    if (req.file) {
      event.featuredImage = `/uploads/images/${req.file.filename}`;
    }

    event.title = title ?? event.title;
    event.date = date ?? event.date;
    event.time = time ?? event.time;
    event.location = location ?? event.location;
    event.body = body ?? event.body;
    event.status = status ?? event.status;

    await event.save();
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