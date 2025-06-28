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
const cmsRoutes = require('./routes/cmsRoutes');
const cmsSimpleRoutes = require('./routes/cmsSimpleRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// --- API Endpoints Placeholders ---

// Chatbot
app.post('/api/chatbot/message', chatbotController.handleMessage);

// Newsletter subscription
app.post('/api/newsletter/subscribe', (req, res) => {
  // TODO: Add newsletter logic
  res.json({ message: 'Subscribed successfully (placeholder).' });
});

// Blogs (fetch all)
app.get('/api/blogs', (req, res) => {
  // TODO: Fetch blogs from DB
  res.json([
    { id: 1, title: 'Sample Blog', content: 'This is a placeholder blog.' }
  ]);
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

// CMS Routes - Full MongoDB version
app.use('/api/cms', cmsRoutes);

// CMS Routes - Simple In-Memory version (for educational purposes)
app.use('/api/cms-simple', cmsSimpleRoutes);

// Product and Category Routes
app.use('/api/categories', categoryRoutes);
app.use('/api', productRoutes);

// Fallback: serve index.html for any other route (for SPA or direct HTML navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/landingpage.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Full CMS API: http://localhost:${PORT}/api/cms`);
  console.log(`Simple CMS API: http://localhost:${PORT}/api/cms-simple`);
  console.log(`Products API: http://localhost:${PORT}/api/categories`);
}); 