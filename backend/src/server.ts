import express from 'express';
import dotenv from 'dotenv';
import connectDB from './database';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Basic route for testing server
app.get('/', (req, res) => {
  res.send('Backend connected to database!');
});

// Example additional route for testing data
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Set server port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start server listening
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './database';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Basic route for testing server
app.get('/', (req, res) => {
  res.send('Backend connected to database!');
});

// Example additional route for testing data
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Set server port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start server listening
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
