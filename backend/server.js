require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const chatbotController = require('./controllers/chatbotController');
const eventRegistrationController = require('./controllers/eventRegistrationController');

// Import CMS routes
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const blogRoutes = require('./routes/blogRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// --- API Endpoints Placeholders ---

// Chatbot
app.post('/api/chatbot/message', chatbotController.handleMessage);

// Newsletter subscription
app.post('/api/newsletter/subscribe', (req, res) => {
});

// Contact form (send email)
app.post('/api/contact', (req, res) => {
  // TODO: Integrate email sending logic
  res.json({ message: 'Email sent (placeholder).' });
});

// Cookie example
app.get('/api/set-cookie', (req, res) => {
  res.cookie('exampleCookie', 'cookieValue', { httpOnly: true });
  res.json({ message: 'Cookie set!' });
});

app.get('/api/get-cookie', (req, res) => {
  const cookie = req.cookies.exampleCookie;
  res.json({ cookie });
});

// Event registration
app.post('/api/events/register', eventRegistrationController.register);

// Product and Category Routes
app.use('/api/categories', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);

// Serve static files from frontend (move below API routes)
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback: serve index.html for any other route (for SPA or direct HTML navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/landingpage.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 