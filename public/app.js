/**
 * SilentLedger - Main Application Script
 * Handles UI interactions and API calls for the obfuscated orderbook with ownership verification
 */

// Configuration
const API_CONFIG = {
  proofServer: 'http://localhost:3000',
  mockWallet: 'http://localhost:3001',
  useMockWallet: true // Set to false when using real Midnight Lace wallet
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
  }
};

// DOM Elements
const domElements = {
  // Wallet connection
  walletAddress: document.getElementById('wallet-address'),
  connectWalletBtn: document.getElementById('connect-wallet'),
  
  // Verification form
  verifyForm: document.getElementById('verify-form'),
  assetSelect: document.getElementById('asset-select'),
  amountInput: document.getElementById('amount-input'),
  verificationResult: document.getElementById('verification-result'),
  verificationStatus: document.getElementById('verification-status'),
  verificationId: document.getElementById('verification-id'),
  
  // Orderbook
  tabButtons: document.querySelectorAll('.tab-btn'),
  asksContainer: document.getElementById('asks'),
  bidsContainer: document.getElementById('bids'),
  currentPrice: document.getElementById('current-price'),
  
  // Order form
  orderForm: document.getElementById('order-form'),
  orderAssetSelect: document.getElementById('order-asset-select'),
  orderTypeSelect: document.getElementById('order-type-select'),
  orderPriceInput: document.getElementById('order-price-input'),
  orderAmountInput: document.getElementById('order-amount-input'),
  verificationIdContainer: document.getElementById('verification-id-container'),
  verificationIdInput: document.getElementById('verification-id-input'),
  orderResult: document.getElementById('order-result'),
  orderStatus: document.getElementById('order-status'),
  orderId: document.getElementById('order-id')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  domElements.connectWalletBtn.addEventListener('click', connectWallet);
  domElements.verifyForm.addEventListener('submit', handleVerification);
  domElements.orderForm.addEventListener('submit', handleOrderSubmission);
  domElements.orderTypeSelect.addEventListener('change', toggleVerificationIdField);
  
  // Tab switching
  domElements.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const asset = button.dataset.asset;
      setActiveAsset(asset);
    });
  });
  
  // Load initial data
  checkWalletConnection();
  loadOrderbook('TOKEN-X');
});

// Wallet Connection
async function connectWallet() {
  try {
    // For hackathon demo, we'll use the mock wallet
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
        showNotification('Wallet connected successfully', 'success');
      } else {
        throw new Error(data.error || 'Failed to connect wallet');
      }
    } else {
      // Real Midnight Lace wallet integration would go here
      // This would be implemented using the Midnight SDK
      showNotification('Midnight Lace wallet integration not available in demo', 'warning');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    showNotification('Failed to connect wallet: ' + error.message, 'error');
  }
}

function checkWalletConnection() {
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
  }
}

function updateWalletUI() {
  if (appState.connected && appState.wallet) {
    domElements.walletAddress.textContent = formatAddress(appState.wallet.address);
    domElements.connectWalletBtn.textContent = 'Disconnect';
    domElements.connectWalletBtn.classList.add('connected');
    
    // Save to session storage
    sessionStorage.setItem('silentledger_wallet', JSON.stringify(appState.wallet));
  } else {
    domElements.walletAddress.textContent = 'Not connected';
    domElements.connectWalletBtn.textContent = 'Connect Wallet';
    domElements.connectWalletBtn.classList.remove('connected');
    
    // Clear session storage
    sessionStorage.removeItem('silentledger_wallet');
  }
}

// Asset Ownership Verification
async function handleVerification(event) {
  event.preventDefault();
  
  if (!appState.connected) {
    showNotification('Please connect your wallet first', 'warning');
    return;
  }
  
  const assetId = domElements.assetSelect.value;
  const amount = parseInt(domElements.amountInput.value, 10);
  
  if (!assetId || isNaN(amount) || amount <= 0) {
    showNotification('Please select an asset and enter a valid amount', 'error');
    return;
  }
  
  try {
    // Call the verification API
    const response = await fetch(`${API_CONFIG.mockWallet}/api/wallet/${appState.wallet ? 'user1' : 'guest'}/verify-ownership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, amount })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store the verification for later use
      appState.verifications[data.verificationId] = {
        assetId,
        amount,
        verified: data.verified,
        timestamp: new Date()
      };
      
      // Update UI
      domElements.verificationResult.classList.remove('hidden');
      domElements.verificationStatus.textContent = data.verified 
        ? `✓ Ownership verified for ${amount} ${assetId}` 
        : `✗ Ownership verification failed`;
      domElements.verificationStatus.className = data.verified ? 'status-success' : 'status-error';
      domElements.verificationId.textContent = data.verificationId;
      
      // Log to proof server
      logVerification(assetId, amount, data.verified, data.verificationId);
      
      // Show notification
      showNotification(data.verified 
        ? `Successfully verified ownership of ${amount} ${assetId}` 
        : `Could not verify ownership of ${amount} ${assetId}`, 
        data.verified ? 'success' : 'error');
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
function toggleVerificationIdField() {
  const orderType = domElements.orderTypeSelect.value;
  
  if (orderType === 'sell') {
    domElements.verificationIdContainer.classList.remove('hidden');
  } else {
    domElements.verificationIdContainer.classList.add('hidden');
  }
}

async function handleOrderSubmission(event) {
  event.preventDefault();
  
  if (!appState.connected) {
    showNotification('Please connect your wallet first', 'warning');
    return;
  }
  
  const assetId = domElements.orderAssetSelect.value;
  const orderType = domElements.orderTypeSelect.value;
  const price = parseFloat(domElements.orderPriceInput.value);
  const amount = parseInt(domElements.orderAmountInput.value, 10);
  
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
      return;
    }
  }
  
  try {
    // Submit order to API
    const response = await fetch(`${API_CONFIG.mockWallet}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: appState.wallet ? 'user1' : 'guest',
        orderType,
        assetId,
        price,
        amount,
        verificationId: orderType === 'sell' ? domElements.verificationIdInput.value.trim() : undefined
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update UI
      domElements.orderResult.classList.remove('hidden');
      domElements.orderStatus.textContent = `✓ ${orderType.toUpperCase()} order placed successfully`;
      domElements.orderStatus.className = 'status-success';
      domElements.orderId.textContent = `Order ID: ${data.order.id}`;
      
      // Log to proof server
      logTransaction(orderType, assetId, price, amount, data.order.id);
      
      // Reload orderbook
      loadOrderbook(assetId);
      
      // Show notification
      showNotification(`${orderType.toUpperCase()} order placed successfully`, 'success');
      
      // Reset form
      domElements.orderForm.reset();
      domElements.verificationIdContainer.classList.add('hidden');
    } else {
      throw new Error(data.error || 'Failed to place order');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    
    domElements.orderResult.classList.remove('hidden');
    domElements.orderStatus.textContent = `✗ Failed to place order: ${error.message}`;
    domElements.orderStatus.className = 'status-error';
    
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
