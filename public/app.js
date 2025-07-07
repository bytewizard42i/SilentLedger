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
      window.cliInterface.printToOutput(`Original order: ${pendingOrder.orderType.toUpperCase()} ${pendingOrder.amount} ${pendingOrder.assetId} @ ${pendingOrder.price.toFixed(4)}`, 'info');
      window.cliInterface.printToOutput(`Front-run with: ${pendingOrder.orderType.toUpperCase()} ${pendingOrder.amount} ${pendingOrder.assetId} @ ${frontRunPrice.toFixed(4)}`, 'warning');
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
