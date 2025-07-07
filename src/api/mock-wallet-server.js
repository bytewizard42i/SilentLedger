/**
 * SilentLedger Mock Wallet Server
 * Simulates wallet functionality for development without blockchain dependency
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.MOCK_WALLET_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock wallet data
const wallets = {
  // Admin wallet with special privileges
  admin: {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    privateKey: '0xprivatekeyadmin',
    balance: {
      'TOKEN-X': 10000,
      'TOKEN-Y': 10000,
      'LP-TOKEN': 5000
    },
    isAdmin: true
  },
  // Regular user wallet
  user1: {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    privateKey: '0xprivatekeyuser1',
    balance: {
      'TOKEN-X': 5000,
      'TOKEN-Y': 2000,
      'LP-TOKEN': 0
    },
    isAdmin: false
  },
  // Another user wallet
  user2: {
    address: '0x7890abcdef1234567890abcdef1234567890abcd',
    privateKey: '0xprivatekeyuser2',
    balance: {
      'TOKEN-X': 3000,
      'TOKEN-Y': 7000,
      'LP-TOKEN': 1000
    },
    isAdmin: false
  }
};

// Mock orders database
const orders = [];
let nextOrderId = 1;

// Mock ownership verifications
const verifications = {};

// Routes

// Connect to wallet
app.post('/api/wallet/connect', (req, res) => {
  const { wallet } = req.body;
  
  if (!wallet || !wallets[wallet]) {
    return res.status(400).json({ error: 'Invalid wallet' });
  }
  
  const { privateKey, ...walletInfo } = wallets[wallet];
  
  res.json({ success: true, wallet: walletInfo });
});

// Get balance
app.get('/api/wallet/:wallet/balance', (req, res) => {
  const { wallet } = req.params;
  
  if (!wallets[wallet]) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  res.json({ 
    success: true, 
    balance: wallets[wallet].balance 
  });
});

// Verify ownership of an asset
app.post('/api/wallet/:wallet/verify-ownership', (req, res) => {
  const { wallet } = req.params;
  const { assetId, amount } = req.body;
  
  if (!wallets[wallet]) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  if (!assetId || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if wallet has sufficient balance of the asset
  const hasAsset = wallets[wallet].balance[assetId] >= amount;
  
  // Generate a verification ID
  const verificationId = `verify-${wallet}-${assetId}-${Date.now()}`;
  
  // Store verification result
  verifications[verificationId] = {
    wallet,
    assetId,
    amount,
    verified: hasAsset,
    timestamp: new Date()
  };
  
  // Return verification result
  res.json({
    success: true,
    verified: hasAsset,
    verificationId,
    // Only return public information - a real ZK system wouldn't reveal these details
    publicData: {
      assetId,
      verificationId,
      verified: hasAsset
    }
  });
});

// Create an order
app.post('/api/orders', async (req, res) => {
  const { wallet, orderType, assetId, price, amount, verificationId } = req.body;
  
  if (!wallets[wallet]) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  if (!orderType || !assetId || price === undefined || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // For sell orders, verify ownership
  if (orderType === 'sell') {
    // Verification ID required for sell orders
    if (!verificationId || !verifications[verificationId]) {
      return res.status(400).json({ error: 'Valid ownership verification required for sell orders' });
    }
    
    const verification = verifications[verificationId];
    
    // Verify the verification is for the same wallet, asset, and sufficient amount
    if (verification.wallet !== wallet || 
        verification.assetId !== assetId || 
        verification.amount < amount || 
        !verification.verified) {
      return res.status(403).json({ error: 'Ownership verification failed' });
    }
  }
  
  // Create the order
  const order = {
    id: nextOrderId++,
    wallet,
    orderType,
    assetId,
    price,
    amount,
    timestamp: new Date(),
    status: 'open'
  };
  
  // Add verification details for sell orders
  if (orderType === 'sell') {
    order.verificationId = verificationId;
  }
  
  orders.push(order);
  
  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      orderType: order.orderType,
      assetId: order.assetId,
      price: order.price,
      amount: order.amount,
      timestamp: order.timestamp,
      status: order.status
    }
  });
});

// Get orderbook (filtered by asset)
app.get('/api/orderbook/:assetId', (req, res) => {
  const { assetId } = req.params;
  
  // Filter orders by asset and status
  const filteredOrders = orders.filter(order => 
    order.assetId === assetId && order.status === 'open'
  );
  
  // Group by order type
  const bids = filteredOrders
    .filter(order => order.orderType === 'buy')
    .sort((a, b) => b.price - a.price); // Sort bids high to low
    
  const asks = filteredOrders
    .filter(order => order.orderType === 'sell')
    .sort((a, b) => a.price - b.price); // Sort asks low to high
  
  res.json({
    success: true,
    assetId,
    bids,
    asks
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock wallet server running at http://localhost:${PORT}`);
});
