const { json } = require('body-parser');
const mysql = require('mysql2');

// Create a MySQL connection pool (adjust credentials as needed)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'innovate_electronics',
});

exports.register = (req, res) => {
  const { event_title, full_name, email, phone, company, designation, interests, questions } = req.body;
  if (!event_title || !full_name || !email || !phone || !interests) {
    return res.status(400).json({ message: 'Required fields missing.' });
  }
  const interestsStr = JSON.stringify(Array.isArray(interests) ? interests : (interests ? [interests] : []));
  const sql = 'INSERT INTO event_registrations (event_title, full_name, email, phone, company, designation, interests, questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  pool.query(sql, [event_title, full_name, email, phone, company || '', designation || '', interestsStr, questions || ''], (err, result) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    res.json({ message: 'Registration successful!' });
  });
}; 