/**
 * SilentLedger Mock Wallet Server
 * Simulates wallet functionality for development without blockchain dependency
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { verifyRequest } = require('./middleware/verifyRequest');

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
// Updated to match Compact contract signature: verifyOwnership(caller: Address, assetId: Bytes<32>, minAmount: Uint<256>, zkProof: Bytes<>, currentTime: Uint<64>)
app.post('/api/wallet/:wallet/verify-ownership', (req, res) => {
  const { wallet } = req.params;
  const { caller, assetId, minAmount, currentTime } = req.body;
  
  if (!wallets[wallet]) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  
  if (!caller || !assetId || minAmount === undefined || !currentTime) {
    return res.status(400).json({ error: 'Missing required fields: caller, assetId, minAmount, currentTime' });
  }
  
  // Validate that the caller matches the wallet (in a real system, this would be cryptographically verified)
  const expectedAddress = wallets[wallet].address;
  if (caller !== expectedAddress && caller !== `mock-address-${wallet}`) {
    return res.status(403).json({ error: 'Caller address does not match wallet' });
  }
  
  // Check if wallet has sufficient balance of the asset
  const hasAsset = wallets[wallet].balance[assetId] >= minAmount;
  
  // Generate a verification ID (proof hash equivalent)
  const verificationId = `verify-${caller.slice(-8)}-${assetId}-${currentTime}`;
  
  // Store verification result with updated parameters
  verifications[verificationId] = {
    caller,
    wallet,
    assetId,
    minAmount,
    verified: hasAsset,
    timestamp: new Date(currentTime * 1000), // Convert from Unix timestamp
    currentTime
  };
  
  // Return verification result matching the expected Compact contract response
  res.json({
    success: true,
    verified: hasAsset,
    verificationId,
    caller,
    timestamp: currentTime,
    // Only return public information - a real ZK system wouldn't reveal these details
    publicData: {
      assetId,
      verificationId,
      verified: hasAsset,
      timestamp: currentTime
    }
  });
});

// Create an order
// Updated to match Compact contract signature: placeOrder(caller: Address, assetId: Bytes<32>, orderType: OrderType, price: Uint<256>, amount: Uint<256>, verificationId: Bytes<32>, currentTime: Uint<64>)
app.post('/api/orders', verifyRequest, async (req, res) => {
  const { caller, assetId, orderType, price, amount, verificationId, currentTime, side } = req.body;
  
  if (!caller || !assetId || !orderType || price === undefined || amount === undefined || !currentTime) {
    return res.status(400).json({ error: 'Missing required fields: caller, assetId, orderType, price, amount, currentTime' });
  }
  
  // Find wallet by caller address
  let walletKey = null;
  for (const [key, wallet] of Object.entries(wallets)) {
    if (wallet.address === caller || caller === `mock-address-${key}`) {
      walletKey = key;
      break;
    }
  }
  
  if (!walletKey || !wallets[walletKey]) {
    return res.status(404).json({ error: 'Wallet not found for caller address' });
  }
  
  // For sell orders, verify ownership
  if (orderType === 'sell') {
    // Verification ID required for sell orders (empty bytes32 for buy orders)
    if (!verificationId || verificationId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return res.status(400).json({ error: 'Valid ownership verification required for sell orders' });
    }
    
    if (!verifications[verificationId]) {
      return res.status(400).json({ error: 'Verification ID not found' });
    }
    
    const verification = verifications[verificationId];
    
    // Verify the verification is for the same caller, asset, and sufficient amount
    if (verification.caller !== caller || 
        verification.assetId !== assetId || 
        verification.minAmount < amount || 
        !verification.verified) {
      return res.status(403).json({ error: 'Ownership verification failed' });
    }
  }
  
  // Generate order ID (similar to how Compact contract would hash parameters)
  const orderId = `order-${caller.slice(-8)}-${assetId}-${currentTime}-${nextOrderId++}`;
  
  // Create the order
  const order = {
    id: orderId,
    caller,
    wallet: walletKey,
    orderType,
    assetId,
    price: parseFloat(price),
    amount: parseInt(amount),
    timestamp: new Date(currentTime * 1000), // Convert from Unix timestamp
    currentTime,
    status: 'open',
    side: side || 'private' // Track which side (private/public) the order is for
  };
  
  // Add verification details for sell orders
  if (orderType === 'sell' && verificationId !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
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
