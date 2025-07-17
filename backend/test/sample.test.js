const request = require('supertest');
const express = require('express');

// Example Express app for demonstration
const app = express();
app.get('/test', (req, res) => res.status(200).json({ message: 'Test route works!' }));

describe('GET /test', () => {
  it('should return a success message', async () => {
    const res = await request(app).get('/test');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Test route works!');
  });
});
