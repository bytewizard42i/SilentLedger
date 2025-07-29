/**
 * SilentLedger - Main Application Script
 * Handles UI interactions and API calls for the obfuscated orderbook with ownership verification
 */

// Configuration
const API_CONFIG = {
  proofServer: 'http://localhost:3000',
  mockWallet: 'http://localhost:3001',
  useMockWallet: !window.meshSDK // Use mock wallet if Mesh SDK is not available
};

// Helper functions for Compact contract integration
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000); // Unix timestamp in seconds for Compact circuits
}

function getWalletAddress() {
  return appState.wallet || 'mock-address-user1'; // Return actual wallet address or mock
}

// Exchange rate utility functions
function convertTokens(fromToken, toToken, amount) {
  if (fromToken === toToken) return amount;
  
  const rateKey = `${fromToken}_TO_${toToken}`;
  const rate = appState.exchangeRates[rateKey];
  
  if (rate) {
    return amount * rate;
  }
  
  // If direct rate not found, try inverse
  const inverseKey = `${toToken}_TO_${fromToken}`;
  const inverseRate = appState.exchangeRates[inverseKey];
  
  if (inverseRate) {
    return amount / inverseRate;
  }
  
  // Default to 1:1 if no rate found
  return amount;
}

function getTokenDisplayPrice(tokenId, basePrice) {
  const config = appState.tokenConfig[tokenId];
  if (!config) return basePrice;
  
  // Apply the token's base price multiplier
  return basePrice * config.basePrice;
}

function formatTokenAmount(amount, tokenId) {
  const config = appState.tokenConfig[tokenId];
  const decimals = config ? config.decimals : 18;
  
  // For display purposes, show reasonable precision
  if (amount >= 1) {
    return amount.toFixed(4);
  } else {
    return amount.toFixed(6);
  }
}

function getExchangeRateDisplay(fromToken, toToken) {
  const rate = convertTokens(fromToken, toToken, 1);
  const fromConfig = appState.tokenConfig[fromToken];
  const toConfig = appState.tokenConfig[toToken];
  
  if (fromConfig && toConfig) {
    return `1 ${fromConfig.symbol} = ${formatTokenAmount(rate, toToken)} ${toConfig.symbol}`;
  }
  
  return `1 ${fromToken} = ${rate} ${toToken}`;
}

// Dashboard integration helpers
function updateDashboardStats(type, data) {
  if (window.tradingDashboard) {
    switch (type) {
      case 'trade':
        window.tradingDashboard.recordTrade(data);
        break;
      case 'verification':
        window.tradingDashboard.addActivity({
          text: `Asset verification ${data.success ? 'successful' : 'failed'} for ${data.amount} ${data.asset}`,
          status: data.success ? 'success' : 'error'
        });
        break;
      case 'frontrun':
        window.tradingDashboard.recordFrontRunAttempt(data.blocked);
        break;
      case 'connection':
        window.tradingDashboard.addActivity({
          text: data.connected ? 'Wallet connected successfully' : 'Wallet disconnected',
          status: data.connected ? 'success' : 'warning'
        });
        break;
    }
  }
}

// Token configuration and exchange rates
const TOKEN_CONFIG = {
  'TOKEN-X': {
    name: 'Token X',
    symbol: 'X',
    decimals: 18,
    basePrice: 1.0, // Base reference price
    description: 'Privacy-preserving premium token'
  },
  'TOKEN-Y': {
    name: 'Token Y', 
    symbol: 'Y',
    decimals: 18,
    basePrice: 0.01, // 100 Y = 1 X, so Y = 0.01 X
    description: 'Utility token for comparison'
  }
};

// Exchange rate: 100 Token Y = 1 Token X
const EXCHANGE_RATES = {
  'TOKEN-Y_TO_TOKEN-X': 0.01, // 1 Y = 0.01 X
  'TOKEN-X_TO_TOKEN-Y': 100   // 1 X = 100 Y
};

// State management
const appState = {
  wallet: null,
  connected: false,
  activeAsset: 'TOKEN-X',
  verifications: {},
  orders: {
    'TOKEN-X': { bids: [], asks: [] },
    'TOKEN-Y': { bids: [], asks: [] }
  },
  exchangeRates: EXCHANGE_RATES,
  tokenConfig: TOKEN_CONFIG
};

// DOM Elements
const domElements = {
  // Wallet connection
  walletAddress: document.getElementById('wallet-address'),
  connectWalletBtn: document.getElementById('connect-wallet'),
  
  // Private side (SilentLedger)
  // Verification form
  verifyFormPrivate: document.getElementById('verify-form-private'),
  assetSelectPrivate: document.getElementById('asset-select-private'),
  amountInputPrivate: document.getElementById('amount-input-private'),
  verificationResultPrivate: document.getElementById('verification-result-private'),
  verificationStatusPrivate: document.getElementById('verification-status-private'),
  verificationIdPrivate: document.getElementById('verification-id-private'),
  
  // Public side (Traditional)
  // Verification form
  verifyFormPublic: document.getElementById('verify-form-public'),
  assetSelectPublic: document.getElementById('asset-select-public'),
  amountInputPublic: document.getElementById('amount-input-public'),
  verificationResultPublic: document.getElementById('verification-result-public'),
  verificationStatusPublic: document.getElementById('verification-status-public'),
  
  // Orderbook
  tabButtons: document.querySelectorAll('.tab-btn'),
  asksContainerPrivate: document.getElementById('asks-private'),
  bidsContainerPrivate: document.getElementById('bids-private'),
  currentPricePrivate: document.getElementById('current-price-private'),
  asksContainerPublic: document.getElementById('asks-public'),
  bidsContainerPublic: document.getElementById('bids-public'),
  currentPricePublic: document.getElementById('current-price-public'),
  
  // Order form - Private
  orderFormPrivate: document.getElementById('order-form-private'),
  orderAssetSelectPrivate: document.getElementById('order-asset-select-private'),
  orderTypeSelectPrivate: document.getElementById('order-type-select-private'),
  orderPriceInputPrivate: document.getElementById('order-price-input-private'),
  orderAmountInputPrivate: document.getElementById('order-amount-input-private'),
  verificationIdContainerPrivate: document.getElementById('verification-id-container-private'),
  verificationIdInputPrivate: document.getElementById('verification-id-input-private'),
  orderResultPrivate: document.getElementById('order-result-private'),
  orderStatusPrivate: document.getElementById('order-status-private'),
  orderIdPrivate: document.getElementById('order-id-private'),
  
  // Order form - Public
  orderFormPublic: document.getElementById('order-form-public'),
  orderAssetSelectPublic: document.getElementById('order-asset-select-public'),
  orderTypeSelectPublic: document.getElementById('order-type-select-public'),
  orderPriceInputPublic: document.getElementById('order-price-input-public'),
  orderAmountInputPublic: document.getElementById('order-amount-input-public'),
  orderResultPublic: document.getElementById('order-result-public'),
  orderStatusPublic: document.getElementById('order-status-public'),
  orderIdPublic: document.getElementById('order-id-public'),
  
  // Simulation controls
  pendingOrderPrivate: document.getElementById('pending-order-private'),
  pendingOrderPublic: document.getElementById('pending-order-public'),
  attemptFrontrunPrivate: document.getElementById('attempt-frontrun-private'),
  attemptFrontrunPublic: document.getElementById('attempt-frontrun-public'),
  frontrunResultPrivate: document.getElementById('frontrun-result-private'),
  frontrunResultPublic: document.getElementById('frontrun-result-public'),
  createPendingOrderBtn: document.getElementById('create-pending-order'),
  resetSimulationBtn: document.getElementById('reset-simulation')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  domElements.connectWalletBtn.addEventListener('click', connectWallet);
  
  // Private side verification and orders
  domElements.verifyFormPrivate.addEventListener('submit', (e) => handleVerification(e, 'private'));
  domElements.orderFormPrivate.addEventListener('submit', (e) => handleOrderSubmission(e, 'private'));
  domElements.orderTypeSelectPrivate.addEventListener('change', () => toggleVerificationIdField('private'));
  
  // Public side verification and orders
  domElements.verifyFormPublic.addEventListener('submit', (e) => handleVerification(e, 'public'));
  domElements.orderFormPublic.addEventListener('submit', (e) => handleOrderSubmission(e, 'public'));
  
  // Check if Mesh SDK is available
  if (window.meshSDK) {
    console.log('Mesh SDK for Midnight detected');
    API_CONFIG.useMockWallet = false;
    // Add a class to body to show Lace integration is available
    document.body.classList.add('lace-available');
  } else {
    console.log('Mesh SDK not detected, using mock wallet');
    API_CONFIG.useMockWallet = true;
  }
  
  // Tab switching
  domElements.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const asset = button.dataset.asset;
      const side = button.dataset.side;
      setActiveAsset(asset, side);
    });
  });
  
  // Simulation controls
  domElements.createPendingOrderBtn.addEventListener('click', createPendingOrder);
  domElements.resetSimulationBtn.addEventListener('click', resetSimulation);
  domElements.attemptFrontrunPrivate.addEventListener('click', () => attemptFrontrun('private'));
  domElements.attemptFrontrunPublic.addEventListener('click', () => attemptFrontrun('public'));
  
  // Load initial data
  checkWalletConnection();
  loadOrderbook('TOKEN-X', 'private');
  loadOrderbook('TOKEN-X', 'public');
});

// Wallet Connection
async function connectWallet() {
  try {
    // If user is currently connected, disconnect instead
    if (appState.connected) {
      if (API_CONFIG.useMockWallet) {
        // Mock wallet disconnect
        appState.wallet = null;
        appState.connected = false;
        updateWalletUI();
        showNotification('Wallet disconnected', 'success');
      } else {
        // Midnight Lace wallet disconnect
        await MidnightWallet.disconnect();
        appState.wallet = null;
        appState.connected = false;
        updateWalletUI();
        showNotification('Lace Wallet disconnected', 'success');
      }
      return;
    }

    // Connect to wallet
    if (API_CONFIG.useMockWallet) {
      const response = await fetch(`${API_CONFIG.mockWallet}/api/wallet/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: 'user1' }) // Can be 'admin', 'user1', or 'user2'
      });
      
      const data = await response.json();
      
      if (data.success) {
        appState.wallet = data.wallet;
        appState.connected = true;
        updateWalletUI();
        showNotification('Mock wallet connected successfully', 'success');
      } else {
        throw new Error(data.error || 'Failed to connect mock wallet');
      }
    } else {
      // Check if Midnight Lace Wallet is installed
      if (!MidnightWallet.isInstalled()) {
        showNotification('Midnight Lace Wallet not detected. Please install it first.', 'error');
        return;
      }

      // Set wallet event callbacks
      MidnightWallet.setCallbacks({
        onConnectSuccess: (walletData) => {
          console.log('Wallet connected successfully:', walletData);
          // Additional success actions if needed
        },
        onConnectError: (error) => {
          console.error('Wallet connection error:', error);
          showNotification('Error connecting to Lace Wallet: ' + error.message, 'error');
        },
        onDisconnect: () => {
          appState.wallet = null;
          appState.connected = false;
          updateWalletUI();
          showNotification('Lace Wallet disconnected', 'info');
        },
        onAccountChange: (newAccount) => {
          appState.wallet.address = newAccount;
          updateWalletUI();
          showNotification('Account changed', 'info');
        },
        onNetworkChange: (newNetwork) => {
          showNotification(`Network changed to ${newNetwork}`, 'info');
        }
      });

      // Connect to the Lace wallet
      try {
        const walletData = await MidnightWallet.connect();
        
        // Update app state with wallet information
        appState.wallet = {
          address: walletData.address,
          network: walletData.network,
          balance: walletData.balance
        };
        appState.connected = true;
        
        updateWalletUI();
        updateDashboardStats('connection', { connected: true });
        
        showNotification('Lace Wallet connected successfully', 'success');
      } catch (walletError) {
        showNotification('Failed to connect to Lace Wallet: ' + walletError.message, 'error');
      }
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    showNotification('Failed to connect wallet: ' + error.message, 'error');
  }
}

async function checkWalletConnection() {
  // Check if we have a wallet in session storage
  const savedWallet = sessionStorage.getItem('silentledger_wallet');
  
  if (savedWallet) {
    try {
      appState.wallet = JSON.parse(savedWallet);
      appState.connected = true;
      updateWalletUI();
    } catch (e) {
      console.error('Error parsing saved wallet:', e);
      sessionStorage.removeItem('silentledger_wallet');
    }
  } else if (!API_CONFIG.useMockWallet && MidnightWallet && MidnightWallet.isInstalled()) {
    // Check if we have an existing connection with Lace Wallet
    try {
      const walletState = MidnightWallet.getState();
      if (walletState.connected && walletState.address) {
        appState.wallet = {
          address: walletState.address,
          network: walletState.network,
          balance: walletState.balance
        };
        appState.connected = true;
        updateWalletUI();
      }
    } catch (e) {
      console.error('Error checking Lace Wallet connection:', e);
    }
  }
}

function updateWalletUI() {
  if (appState.connected && appState.wallet) {
    domElements.walletAddress.textContent = formatAddress(appState.wallet.address);
    domElements.connectWalletBtn.textContent = 'Disconnect';
    domElements.connectWalletBtn.classList.add('connected');
    
    // If using Lace Wallet, show wallet type
    if (!API_CONFIG.useMockWallet) {
      domElements.connectWalletBtn.textContent = 'Disconnect Lace';
      // Optional: Add Lace logo or indicator
      if (domElements.walletAddress.querySelector('.lace-indicator') === null) {
        const laceIndicator = document.createElement('span');
        laceIndicator.className = 'lace-indicator';
        laceIndicator.textContent = '🌙'; // Midnight moon emoji as indicator
        domElements.walletAddress.appendChild(laceIndicator);
      }
    }
    
    // Save to session storage (only for mock wallet)
    if (API_CONFIG.useMockWallet) {
      sessionStorage.setItem('silentledger_wallet', JSON.stringify(appState.wallet));
    }
  } else {
    domElements.walletAddress.textContent = 'Not connected';
    domElements.connectWalletBtn.textContent = API_CONFIG.useMockWallet ? 'Connect Wallet' : 'Connect Lace';
    domElements.connectWalletBtn.classList.remove('connected');
    
    // Clear session storage
    sessionStorage.removeItem('silentledger_wallet');
  }
}

// Asset Ownership Verification
async function handleVerification(event, side) {
  event.preventDefault();
  
  if (!appState.connected) {
    showNotification('Please connect your wallet first', 'warning');
    return;
  }
  
  // Get the appropriate elements based on the side (private or public)
  const assetSelect = side === 'private' ? domElements.assetSelectPrivate : domElements.assetSelectPublic;
  const amountInput = side === 'private' ? domElements.amountInputPrivate : domElements.amountInputPublic;
  const verificationResult = side === 'private' ? domElements.verificationResultPrivate : domElements.verificationResultPublic;
  const verificationStatus = side === 'private' ? domElements.verificationStatusPrivate : domElements.verificationStatusPublic;
  const verificationId = side === 'private' ? domElements.verificationIdPrivate : null;
  
  const assetId = assetSelect.value;
  const amount = parseInt(amountInput.value, 10);
  
  if (!assetId || isNaN(amount) || amount <= 0) {
    showNotification('Please select an asset and enter a valid amount', 'error');
    return;
  }
  
  try {
    let data;
    
    if (API_CONFIG.useMockWallet) {
      // Call the mock verification API with updated parameters for Compact contract
      const currentTime = getCurrentTimestamp();
      const caller = getWalletAddress();
      
      const response = await fetch(`${API_CONFIG.mockWallet}/api/wallet/${appState.wallet ? 'user1' : 'guest'}/verify-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          caller,           // Address parameter for Compact contract
          assetId, 
          minAmount: amount, // Updated parameter name to match Compact contract
          currentTime       // Timestamp parameter for Compact contract
        })
      });
      
      data = await response.json();
    } else {
      // Use Midnight Lace Wallet for verification with zero-knowledge proofs
      try {
        // This uses the Mesh SDK to generate a zero-knowledge proof of asset ownership
        // Updated to work with corrected Compact contract signature
        const verificationData = await MidnightWallet.verifyOwnership(assetId, amount);
        
        data = {
          success: true,
          verified: verificationData.verified,
          verificationId: verificationData.verificationId,
          proof: verificationData.proof,
          caller: verificationData.caller,
          timestamp: verificationData.timestamp
        };
      } catch (walletError) {
        console.error('Lace Wallet verification error:', walletError);
        throw new Error(`Lace Wallet verification failed: ${walletError.message}`);
      }
    }
    
    if (data.success) {
      // Store the verification for later use
      appState.verifications[data.verificationId] = {
        assetId,
        amount,
        verified: data.verified,
        timestamp: new Date(),
        side: side,
        proof: data.proof // Store proof for private transactions
      };
      
      // Update UI
      verificationResult.classList.remove('hidden');
      
      if (side === 'private') {
        // Private verification shows success/fail and provides a verification ID
        verificationStatus.textContent = data.verified 
          ? `✓ Ownership verified for ${amount} ${assetId}` 
          : `✗ Ownership verification failed`;
        verificationStatus.className = data.verified ? 'status-success' : 'status-error';
        verificationId.textContent = data.verificationId;
      } else {
        // Public verification just shows the balance publicly
        verificationStatus.textContent = data.verified 
          ? `Balance check: You have at least ${amount} ${assetId}` 
          : `Balance check: You do not have ${amount} ${assetId}`;
        verificationStatus.className = data.verified ? 'status-success' : 'status-error';
      }
      
      // Log to proof server (only for private side with ZKPs)
      if (side === 'private') {
        logVerification(assetId, amount, data.verified, data.verificationId);
      }
      
      // Update dashboard analytics
      updateDashboardStats('verification', {
        success: data.verified,
        amount: amount,
        asset: assetId,
        side: side
      });
      
      // Show notification
      showNotification(
        side === 'private' ?
          (data.verified ? `Successfully verified ownership of ${amount} ${assetId} (private)` : `Could not verify ownership of ${amount} ${assetId}`) :
          (data.verified ? `Balance check: You have at least ${amount} ${assetId} (public)` : `Balance check: Insufficient ${assetId} balance`),
        data.verified ? 'success' : 'error'
      );
    } else {
      throw new Error(data.error || 'Verification failed');
    }
  } catch (error) {
    console.error('Error verifying ownership:', error);
    showNotification('Error verifying ownership: ' + error.message, 'error');
  }
}

async function logVerification(assetId, amount, verified, verificationId) {
  try {
    await fetch(`${API_CONFIG.proofServer}/api/log/verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId,
        verified,
        publicData: { verificationId }
      })
    });
  } catch (error) {
    console.error('Error logging verification:', error);
  }
}

// Orderbook Management
function setActiveAsset(asset) {
  appState.activeAsset = asset;
  
  // Update tab buttons
  domElements.tabButtons.forEach(button => {
    if (button.dataset.asset === asset) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Load orderbook data
  loadOrderbook(asset);
}

async function loadOrderbook(assetId) {
  try {
    const response = await fetch(`${API_CONFIG.mockWallet}/api/orderbook/${assetId}`);
    const data = await response.json();
    
    if (data.success) {
      // Update state
      appState.orders[assetId] = {
        bids: data.bids || [],
        asks: data.asks || []
      };
      
      // Update UI
      renderOrderbook(assetId);
      
      // Update current price
      updateCurrentPrice(assetId);
    }
  } catch (error) {
    console.error(`Error loading orderbook for ${assetId}:`, error);
    showNotification(`Failed to load orderbook for ${assetId}`, 'error');
  }
}

function renderOrderbook(assetId) {
  const { bids, asks } = appState.orders[assetId];
  
  // Render asks (sell orders)
  domElements.asksContainer.innerHTML = '';
  asks.forEach(ask => {
    const row = document.createElement('div');
    row.className = 'order-row ask-row';
    row.innerHTML = `
      <div>${ask.price.toFixed(4)}</div>
      <div>${ask.amount.toFixed(2)}</div>
      <div>${(ask.price * ask.amount).toFixed(2)}</div>
    `;
    domElements.asksContainer.appendChild(row);
  });
  
  // If no asks, show empty state
  if (asks.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'order-row';
    emptyRow.textContent = 'No sell orders';
    domElements.asksContainer.appendChild(emptyRow);
  }
  
  // Render bids (buy orders)
  domElements.bidsContainer.innerHTML = '';
  bids.forEach(bid => {
    const row = document.createElement('div');
    row.className = 'order-row bid-row';
    row.innerHTML = `
      <div>${bid.price.toFixed(4)}</div>
      <div>${bid.amount.toFixed(2)}</div>
      <div>${(bid.price * bid.amount).toFixed(2)}</div>
    `;
    domElements.bidsContainer.appendChild(row);
  });
  
  // If no bids, show empty state
  if (bids.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'order-row';
    emptyRow.textContent = 'No buy orders';
    domElements.bidsContainer.appendChild(emptyRow);
  }
}

function updateCurrentPrice(assetId) {
  const { bids, asks } = appState.orders[assetId];
  
  // Calculate current price as the midpoint between highest bid and lowest ask
  let price = 0;
  
  if (bids.length > 0 && asks.length > 0) {
    const highestBid = Math.max(...bids.map(bid => bid.price));
    const lowestAsk = Math.min(...asks.map(ask => ask.price));
    price = (highestBid + lowestAsk) / 2;
  } else if (bids.length > 0) {
    price = Math.max(...bids.map(bid => bid.price));
  } else if (asks.length > 0) {
    price = Math.min(...asks.map(ask => ask.price));
  }
  
  domElements.currentPrice.textContent = price.toFixed(4);
}

// Order Placement
function toggleVerificationIdField(side) {
  const orderTypeSelect = side === 'private' ? domElements.orderTypeSelectPrivate : domElements.orderTypeSelectPublic;
  const verificationIdContainer = side === 'private' ? domElements.verificationIdContainerPrivate : null;
  
  if (!verificationIdContainer) return; // Only private side has verification ID container
  
  const orderType = orderTypeSelect.value;
  
  if (orderType === 'sell') {
    verificationIdContainer.classList.remove('hidden');
  } else {
    verificationIdContainer.classList.add('hidden');
  }
}

async function handleOrderSubmission(event, side) {
  event.preventDefault();
  
  if (!appState.connected) {
    showNotification('Please connect your wallet first', 'warning');
    return;
  }
  
  // Get the appropriate elements based on the side (private or public)
  const orderAssetSelect = side === 'private' ? domElements.orderAssetSelectPrivate : domElements.orderAssetSelectPublic;
  const orderTypeSelect = side === 'private' ? domElements.orderTypeSelectPrivate : domElements.orderTypeSelectPublic;
  const orderPriceInput = side === 'private' ? domElements.orderPriceInputPrivate : domElements.orderPriceInputPublic;
  const orderAmountInput = side === 'private' ? domElements.orderAmountInputPrivate : domElements.orderAmountInputPublic;
  const orderResult = side === 'private' ? domElements.orderResultPrivate : domElements.orderResultPublic;
  const orderStatus = side === 'private' ? domElements.orderStatusPrivate : domElements.orderStatusPublic;
  const orderId = side === 'private' ? domElements.orderIdPrivate : domElements.orderIdPublic;
  
  const assetId = orderAssetSelect.value;
  const orderType = orderTypeSelect.value;
  const price = parseFloat(orderPriceInput.value);
  const amount = parseInt(orderAmountInput.value, 10);
  
  if (!assetId || !orderType || isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
    showNotification('Please fill in all fields with valid values', 'error');
    return;
  }
  
  // For sell orders, verify ownership first
  if (orderType === 'sell') {
    const verificationId = domElements.verificationIdInput.value.trim();
    
    if (!verificationId) {
      showNotification('Please enter a verification ID for sell orders', 'error');
      return;
    }
    
    // Check if verification exists and is valid
    if (!appState.verifications[verificationId] || 
        appState.verifications[verificationId].assetId !== assetId ||
        !appState.verifications[verificationId].verified) {
      showNotification('Invalid verification ID. Please verify your ownership first', 'error');
  }
  
  try {
    // Handle verification ID for private sell orders
    let verificationId = '';
    if (side === 'private' && orderType === 'sell') {
      verificationId = domElements.verificationIdInputPrivate ? domElements.verificationIdInputPrivate.value : '';
      if (!verificationId) {
        showNotification('For private sell orders, you must provide a verification ID. Please verify ownership first.', 'error');
        return;
      }
    }
    
    let data;
    
    if (API_CONFIG.useMockWallet) {
      // Create the order through the mock API with updated parameters for Compact contract
      const currentTime = getCurrentTimestamp();
      const caller = getWalletAddress();
      
      let endpoint = `${API_CONFIG.mockWallet}/api/orders`;
      let orderData = {
        caller,           // Address parameter for Compact contract
        assetId,
        orderType,
        price,
        amount,
        currentTime,      // Timestamp parameter for Compact contract
        side: side        // Include which side (private/public) the order is for
      };
      
      if (side === 'private' && orderType === 'sell' && verificationId) {
        // For private sell orders, we need to provide the verification ID
        orderData.verificationId = verificationId;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      data = await response.json();
    } else {
      // Use Midnight Lace Wallet for transaction signing
      try {
        const currentTime = getCurrentTimestamp();
        const caller = getWalletAddress();
        
        // Format transaction for the Midnight blockchain with corrected Compact contract signature
        // placeOrder(caller: Address, assetId: Bytes<32>, orderType: OrderType, price: Uint<256>, amount: Uint<256>, verificationId: Bytes<32>, currentTime: Uint<64>)
        const transaction = {
          type: 'placeOrder',
          params: {
            caller: caller,
            assetId: assetId,
            orderType: orderType,
            price: price.toString(),
            amount: amount.toString(),
            verificationId: verificationId || '0x0000000000000000000000000000000000000000000000000000000000000000', // Empty bytes32 for buy orders
            currentTime: currentTime
          },
          side: side, // private or public orderbook
          // For private orders, include the verification proof
          ...(side === 'private' && orderType === 'sell' && verificationId && {
            verificationId: verificationId,
            proof: appState.verifications[verificationId]?.proof
          })
        };
        
        // Sign the transaction with the Lace wallet
        const signedTx = await MidnightWallet.signTransaction(transaction);
        
        // This would normally send the transaction to the Midnight network
        // Here we're simulating a successful response
        data = {
          success: true,
          orderId: hashOrderData({
            assetId,
            orderType,
            price,
            amount,
            side,
            timestamp: new Date().toISOString()
          }),
          tx: signedTx
        };
        
        // In a real implementation, you'd broadcast the signed transaction
        console.log('Signed transaction:', signedTx);
      } catch (walletError) {
        console.error('Lace Wallet transaction error:', walletError);
        throw new Error(`Lace Wallet transaction failed: ${walletError.message}`);
      }
    }
    
    if (data.success) {
      // Show the order success in the UI
      orderResult.classList.remove('hidden');
      orderStatus.textContent = `✓ Order placed successfully`;
      orderStatus.className = 'status-success';
      orderId.textContent = data.orderId;
      
      // Refresh the orderbook
      await loadOrderbook(assetId, side);
      
      // Clear the form
      orderPriceInput.value = '';
      orderAmountInput.value = '';
      
      if (side === 'private' && orderType === 'sell' && domElements.verificationIdInputPrivate) {
        domElements.verificationIdInputPrivate.value = '';
      }
      
      // Log the transaction
      logTransaction(orderType, assetId, price, amount, data.orderId);
      
      // Show notification
      const orderDesc = side === 'private' ? 'private' : 'public';
      showNotification(`${orderType.toUpperCase()} ${orderDesc} order for ${amount} ${assetId} at ${price} placed successfully`, 'success');
    } else {
      throw new Error(data.error || 'Failed to place order');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    showNotification('Failed to place order: ' + error.message, 'error');
  }
}

async function logTransaction(transactionType, assetId, price, amount, orderId) {
  try {
    await fetch(`${API_CONFIG.proofServer}/api/log/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionType,
        publicData: { 
          assetId,
          orderId,
          timestamp: new Date()
        }
      })
    });
  } catch (error) {
    console.error('Error logging transaction:', error);
  }
}

// Utility Functions
function formatAddress(address) {
  if (!address) return 'Unknown';
  return address.slice(0, 6) + '...' + address.slice(-4);
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Append to body
  document.body.appendChild(notification);
  
  // Show with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Auto remove after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 5000);
}

// Front-Running Simulation Functionality
let pendingOrders = {
  private: null,
  public: null
};

// Create a pending order for simulation
function createPendingOrder() {
  // Random order details
  const orderType = Math.random() > 0.5 ? 'buy' : 'sell';
  const assetId = Math.random() > 0.5 ? 'TOKEN-X' : 'TOKEN-Y';
  const price = parseFloat((Math.random() * 10 + 1).toFixed(4));
  const amount = Math.floor(Math.random() * 100 + 10);
  
  // Create pending order objects
  const order = {
    id: `pending-${Date.now()}`,
    orderType,
    assetId,
    price,
    amount,
    timestamp: new Date()
  };
  
  // Set for both private and public sides
  pendingOrders.private = { ...order };
  pendingOrders.public = { ...order };
  
  // Update UI
  displayPendingOrder('private', pendingOrders.private);
  displayPendingOrder('public', pendingOrders.public);
  
  // Enable front-running buttons
  domElements.attemptFrontrunPrivate.disabled = false;
  domElements.attemptFrontrunPublic.disabled = false;
  
  // Show notification
  showNotification('Pending order created for simulation', 'info');
  
  // If CLI is available, log to it
  if (window.cliInterface) {
    window.cliInterface.printToOutput('Pending order created for simulation:', 'info');
    window.cliInterface.printToOutput(`${orderType.toUpperCase()} ${amount} ${assetId} @ ${price}`, 'info');
    window.cliInterface.printToOutput('Private side: Order details hidden (only commitment visible)', 'info');
    window.cliInterface.printToOutput('Public side: Order details fully visible', 'warning');
  }
}

// Display pending order in UI
function displayPendingOrder(side, order) {
  if (!order) return;
  
  const container = side === 'private' ? domElements.pendingOrderPrivate : domElements.pendingOrderPublic;
  const details = container.querySelector('.pending-order-details');
  
  if (side === 'private') {
    // Private orderbook only shows a commitment hash, not the actual details
    const hash = hashOrderData(order);
    details.innerHTML = `<div>Commitment: ${hash.substring(0, 16)}...${hash.substring(hash.length - 8)}</div>
                      <div>Type: <em>Hidden</em></div>
                      <div>Asset: <em>Hidden</em></div>
                      <div>Price: <em>Hidden</em></div>
                      <div>Amount: <em>Hidden</em></div>`;
  } else {
    // Public orderbook shows all details
    details.innerHTML = `<div>Order ID: ${order.id}</div>
                      <div>Type: ${order.orderType.toUpperCase()}</div>
                      <div>Asset: ${order.assetId}</div>
                      <div>Price: ${order.price.toFixed(4)}</div>
                      <div>Amount: ${order.amount}</div>`;
  }
}

// Attempt to front-run an order
async function attemptFrontrun(side) {
  if (!pendingOrders[side]) {
    showNotification(`No pending order to front-run on ${side} side`, 'warning');
    return;
  }
  
  const pendingOrder = pendingOrders[side];
  const resultContainer = side === 'private' ? domElements.frontrunResultPrivate : domElements.frontrunResultPublic;
  
  // For private orders, front-running should fail because order details are hidden
  if (side === 'private') {
    resultContainer.innerHTML = `
      <div class="attempt-status failure">Front-running failed!</div>
      <div class="attempt-reason">Order details are hidden via commitment. Cannot determine price or direction to front-run.</div>
    `;
    
    // If CLI is available, log to it
    if (window.cliInterface) {
      window.cliInterface.printToOutput('Front-running attempt on private side FAILED:', 'success');
      window.cliInterface.printToOutput('Order details are hidden via commitment. Cannot determine price or direction to front-run.', 'info');
    }
  } else {
    // For public orders, front-running succeeds because order details are visible
    const frontRunPrice = pendingOrder.orderType === 'buy' ? 
      pendingOrder.price * 1.001 : // Slightly higher price for buy orders
      pendingOrder.price * 0.999; // Slightly lower price for sell orders
    
    resultContainer.innerHTML = `
      <div class="attempt-status success">Front-running succeeded!</div>
      <div class="attempt-reason">Order details were visible. Front-run with ${pendingOrder.orderType === 'buy' ? 'higher' : 'lower'} price of ${frontRunPrice.toFixed(4)}.</div>
    `;
    
    // If CLI is available, log to it
    if (window.cliInterface) {
      window.cliInterface.printToOutput('Front-running attempt on public side SUCCEEDED:', 'error');
      window.cliInterface.printToOutput(`Order details were visible. Front-run with ${pendingOrder.orderType === 'buy' ? 'higher' : 'lower'} price of ${frontRunPrice.toFixed(4)}.`, 'info');
      window.cliInterface.printToOutput(`Front-run with: ${pendingOrder.orderType.toUpperCase()} ${pendingOrder.amount} ${pendingOrder.assetId} @ ${frontRunPrice.toFixed(4)}`, 'warning');
    }
  }
  }
}

// Reset simulation
function resetSimulation() {
  // Clear pending orders
  pendingOrders = {
    private: null,
    public: null
  };
  
  // Reset UI
  domElements.pendingOrderPrivate.querySelector('.pending-order-details').textContent = 'No pending orders';
  domElements.pendingOrderPublic.querySelector('.pending-order-details').textContent = 'No pending orders';
  domElements.frontrunResultPrivate.innerHTML = '';
  domElements.frontrunResultPublic.innerHTML = '';
  
  // Disable front-running buttons
  domElements.attemptFrontrunPrivate.disabled = true;
  domElements.attemptFrontrunPublic.disabled = true;
  
  // Show notification
  showNotification('Simulation reset', 'info');
}

// Helper function to simulate a hash of order data
function hashOrderData(order) {
  const data = `${order.orderType}|${order.assetId}|${order.price}|${order.amount}|${order.timestamp}`;
  // This is not a real hash function, just for demo purposes
  let hash = 'ox';
  for (let i = 0; i < 64; i++) {
    hash += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  }
  return hash;
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-family: var(--font-body);
    font-size: 0.9rem;
    z-index: 1000;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s, transform 0.3s;
    max-width: 300px;
  }
  
  .notification.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .notification.success {
    background-color: var(--success);
    box-shadow: 0 4px 15px rgba(0, 200, 83, 0.4);
  }
  
  .notification.error {
    background-color: var(--error);
    box-shadow: 0 4px 15px rgba(255, 61, 113, 0.4);
  }
  
  .notification.warning {
    background-color: var(--warning);
    box-shadow: 0 4px 15px rgba(255, 170, 0, 0.4);
  }
  
  .notification.info {
    background-color: var(--primary);
    box-shadow: 0 4px 15px rgba(74, 108, 255, 0.4);
  }
`;

document.head.appendChild(notificationStyles);
