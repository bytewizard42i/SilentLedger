/**
 * SilentLedger Proof Server
 * Handles off-chain logging of private transaction data
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PROOF_SERVER_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Log storage (in-memory for development)
const transactionLogs = [];
const verificationLogs = [];

// API Routes

// Log a new transaction (without revealing sensitive details)
app.post('/api/log/transaction', (req, res) => {
  const { transactionType, timestamp, publicData } = req.body;
  
  if (!transactionType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const log = {
    id: generateId(),
    transactionType,
    timestamp: timestamp || new Date(),
    publicData: publicData || {},
    recorded: new Date()
  };
  
  transactionLogs.push(log);
  console.log(`Transaction logged: ${log.id} (${transactionType})`);
  
  res.status(201).json({ success: true, logId: log.id });
});

// Log ownership verification attempt
app.post('/api/log/verification', (req, res) => {
  const { assetId, verified, publicData } = req.body;
  
  if (assetId === undefined || verified === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const log = {
    id: generateId(),
    assetId,
    verified,
    publicData: publicData || {},
    timestamp: new Date()
  };
  
  verificationLogs.push(log);
  console.log(`Verification logged: ${log.id} (Asset: ${assetId}, Verified: ${verified})`);
  
  res.status(201).json({ success: true, logId: log.id });
});

// Get transaction logs (only public data)
app.get('/api/logs/transactions', (req, res) => {
  const sanitizedLogs = transactionLogs.map(log => ({
    id: log.id,
    transactionType: log.transactionType,
    timestamp: log.timestamp,
    publicData: log.publicData
  }));
  
  res.json(sanitizedLogs);
});

// Get verification logs (only public data)
app.get('/api/logs/verifications', (req, res) => {
  const sanitizedLogs = verificationLogs.map(log => ({
    id: log.id,
    verified: log.verified,
    timestamp: log.timestamp,
    publicData: log.publicData
  }));
  
  res.json(sanitizedLogs);
});

// Helper function to generate unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Proof server running at http://localhost:${PORT}`);
});
