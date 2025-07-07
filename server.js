/**
 * SilentLedger Main Server
 * Serves the frontend application and handles API requests
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'media'))); // Serve media files

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`SilentLedger running at http://localhost:${PORT}`);
  console.log(`Make sure to start the proof server with 'yarn proof-server'`);
  console.log(`For development, you can use the mock wallet with 'yarn mock-wallet'`);
});
