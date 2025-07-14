/**
 * SilentLedger - God Windows Module
 * 
 * This module provides developer-friendly "God Windows" that reveal:
 * 1. ZK Circuit Output - Human-readable form of inputs/outputs per circuit
 * 2. Proof Builder - Step-by-step generation of ZK proofs
 * 3. Nullifier Tracker - Active/used nullifiers and coin commitments
 * 4. Off-chain Log View - Show raw storage in proof-server.js
 * 5. Activity Monitor - Real-time tracking of what operations are happening
 */

// Configuration for God Windows
const godWindowsConfig = {
  enabled: true, // Default to enabled in development
  maxLogEntries: 100, // Maximum number of log entries to store
  refreshRate: 500, // Refresh rate in ms
  animationSpeed: 2000, // Border animation speed in ms
};

// Storage for God Windows state
const godWindowsState = {
  zkCircuitLogs: [],
  proofBuilderSteps: [],
  nullifiers: {
    active: [],
    used: []
  },
  offchainStorage: {},
  activityLog: [],
  currentActivity: "Idle",
};

// DOM Elements for God Windows
let godWindowsElements = {
  container: null,
  zkCircuitOutput: null,
  proofBuilder: null,
  nullifierTracker: null,
  offchainLogView: null,
  activityMonitor: null,
  toggleButton: null
};

// Initialize God Windows
function initGodWindows() {
  console.log("Initializing Dev Mode windows...");
  
  // Use the existing container
  const container = document.getElementById('god-windows-section');
  if (!container) {
    console.error("Could not find god-windows-section container");
    return;
  }
  
  container.innerHTML = `
    <div class="god-windows-header">
      <h2>⚡ SunExchange Developer Tools</h2>
      <p>See the Shadows Dance - Developer View of ZK Proofs and Privacy Flows</p>
      <div class="god-windows-toggle">
        <span>Enable Visualizations</span>
        <label class="switch">
          <input type="checkbox" id="god-windows-toggle" checked>
          <span class="slider round"></span>
        </label>
      </div>
    </div>
    <div class="god-windows-grid">
      <div class="god-window private-border" id="zk-circuit-output">
        <div class="window-header">
          <h3>ZK Circuit Output</h3>
          <button class="window-action clear-btn" data-target="zk-circuit-output">Clear</button>
        </div>
        <div class="window-content">
          <pre class="code-output">Waiting for ZK circuit execution...</pre>
        </div>
      </div>
      
      <div class="god-window private-border" id="proof-builder">
        <div class="window-header">
          <h3>Proof Builder</h3>
          <button class="window-action clear-btn" data-target="proof-builder">Clear</button>
        </div>
        <div class="window-content">
          <div class="proof-steps">
            <div class="proof-step">Waiting for proof generation...</div>
          </div>
        </div>
      </div>
      
      <div class="god-window private-border" id="nullifier-tracker">
        <div class="window-header">
          <h3>Nullifier Tracker</h3>
          <button class="window-action clear-btn" data-target="nullifier-tracker">Clear</button>
        </div>
        <div class="window-content">
          <div class="nullifier-container">
            <div class="nullifier-section">
              <h4>Active Nullifiers</h4>
              <div class="nullifier-list active-nullifiers"></div>
            </div>
            <div class="nullifier-section">
              <h4>Used Nullifiers</h4>
              <div class="nullifier-list used-nullifiers"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="god-window public-border" id="offchain-log-view">
        <div class="window-header">
          <h3>Off-chain Storage</h3>
          <div class="filter-controls">
            <input type="text" id="log-filter" placeholder="Filter logs...">
            <button class="window-action clear-btn" data-target="offchain-log-view">Clear</button>
          </div>
        </div>
        <div class="window-content">
          <pre class="storage-output">Off-chain storage data will appear here...</pre>
        </div>
      </div>
      
      <div class="god-window activity-border" id="activity-monitor">
        <div class="window-header">
          <h3>Activity Monitor</h3>
          <button class="window-action clear-btn" data-target="activity-monitor">Clear</button>
        </div>
        <div class="window-content">
          <div class="current-activity">
            <div class="activity-label">Current Activity:</div>
            <div id="current-activity-display">Idle</div>
          </div>
          <div class="activity-log">
            <div class="log-entry initial">Waiting for activities...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Container already exists in the DOM
  
  // Store references to DOM elements
  godWindowsElements = {
    container: container,
    zkCircuitOutput: document.getElementById('zk-circuit-output').querySelector('.code-output'),
    proofBuilder: document.getElementById('proof-builder').querySelector('.proof-steps'),
    nullifierTracker: {
      activeList: document.getElementById('nullifier-tracker').querySelector('.active-nullifiers'),
      usedList: document.getElementById('nullifier-tracker').querySelector('.used-nullifiers')
    },
    offchainLogView: document.getElementById('offchain-log-view').querySelector('.storage-output'),
    activityMonitor: {
      currentActivity: document.getElementById('current-activity-display'),
      log: document.getElementById('activity-monitor').querySelector('.activity-log')
    },
    toggleButton: document.getElementById('god-windows-toggle')
  };
  
  // Add event listeners
  godWindowsElements.toggleButton.addEventListener('change', toggleGodWindows);
  
  // Add event listeners to clear buttons
  document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      clearGodWindow(target);
    });
  });
  
  // Start the animation for borders
  startBorderAnimations();
}

// Toggle God Windows visibility
function toggleGodWindows() {
  godWindowsConfig.enabled = godWindowsElements.toggleButton.checked;
  godWindowsElements.container.classList.toggle('disabled', !godWindowsConfig.enabled);
}

// Clear a specific God Window
function clearGodWindow(windowId) {
  switch(windowId) {
    case 'zk-circuit-output':
      godWindowsState.zkCircuitLogs = [];
      godWindowsElements.zkCircuitOutput.textContent = 'Cleared ZK circuit output logs...';
      break;
    case 'proof-builder':
      godWindowsState.proofBuilderSteps = [];
      godWindowsElements.proofBuilder.innerHTML = '<div class="proof-step">Proof builder cleared...</div>';
      break;
    case 'nullifier-tracker':
      godWindowsState.nullifiers.active = [];
      godWindowsState.nullifiers.used = [];
      godWindowsElements.nullifierTracker.activeList.innerHTML = '';
      godWindowsElements.nullifierTracker.usedList.innerHTML = '';
      break;
    case 'offchain-log-view':
      godWindowsState.offchainStorage = {};
      godWindowsElements.offchainLogView.textContent = 'Off-chain storage data cleared...';
      break;
    case 'activity-monitor':
      godWindowsState.activityLog = [];
      godWindowsElements.activityMonitor.log.innerHTML = '<div class="log-entry">Activity log cleared...</div>';
      break;
  }
}

// Update current activity
function updateCurrentActivity(activity) {
  if (!godWindowsConfig.enabled) return;
  
  godWindowsState.currentActivity = activity;
  godWindowsState.activityLog.unshift({
    activity: activity,
    timestamp: new Date()
  });
  
  // Limit log size
  if (godWindowsState.activityLog.length > godWindowsConfig.maxLogEntries) {
    godWindowsState.activityLog.pop();
  }
  
  // Update UI
  renderActivityMonitor();
}

// Log ZK circuit data
function logZkCircuitData(circuitName, inputs, outputs) {
  if (!godWindowsConfig.enabled) return;
  
  godWindowsState.zkCircuitLogs.unshift({
    timestamp: new Date(),
    circuit: circuitName,
    inputs: inputs,
    outputs: outputs
  });
  
  // Limit log size
  if (godWindowsState.zkCircuitLogs.length > godWindowsConfig.maxLogEntries) {
    godWindowsState.zkCircuitLogs.pop();
  }
  
  // Update UI
  renderZkCircuitOutput();
}

// Add proof builder step
function addProofBuilderStep(stepName, details) {
  if (!godWindowsConfig.enabled) return;
  
  godWindowsState.proofBuilderSteps.unshift({
    timestamp: new Date(),
    step: stepName,
    details: details
  });
  
  // Limit steps
  if (godWindowsState.proofBuilderSteps.length > godWindowsConfig.maxLogEntries) {
    godWindowsState.proofBuilderSteps.pop();
  }
  
  // Update UI
  renderProofBuilder();
}

// Track nullifier
function trackNullifier(nullifierId, isActive = true) {
  if (!godWindowsConfig.enabled) return;
  
  if (isActive) {
    // Add to active nullifiers if not already there
    if (!godWindowsState.nullifiers.active.some(n => n.id === nullifierId)) {
      godWindowsState.nullifiers.active.push({
        id: nullifierId,
        createdAt: new Date()
      });
    }
  } else {
    // Move from active to used
    const nullifierIndex = godWindowsState.nullifiers.active.findIndex(n => n.id === nullifierId);
    if (nullifierIndex >= 0) {
      const nullifier = godWindowsState.nullifiers.active[nullifierIndex];
      godWindowsState.nullifiers.active.splice(nullifierIndex, 1);
      godWindowsState.nullifiers.used.push({
        ...nullifier,
        usedAt: new Date()
      });
    }
  }
  
  // Update UI
  renderNullifierTracker();
}

// Update off-chain storage view
function updateOffchainStorage(key, value) {
  if (!godWindowsConfig.enabled) return;
  
  godWindowsState.offchainStorage[key] = {
    value: value,
    updatedAt: new Date()
  };
  
  // Update UI
  renderOffchainLogView();
}

// Render functions for each window
function renderZkCircuitOutput() {
  if (!godWindowsElements.zkCircuitOutput) return;
  
  if (godWindowsState.zkCircuitLogs.length === 0) {
    godWindowsElements.zkCircuitOutput.textContent = 'Waiting for ZK circuit execution...';
    return;
  }
  
  let output = '';
  godWindowsState.zkCircuitLogs.forEach((log, index) => {
    const timeStr = log.timestamp.toLocaleTimeString();
    output += `[${timeStr}] Circuit: ${log.circuit}\n`;
    output += '● Inputs:\n';
    output += formatJSONForDisplay(log.inputs);
    output += '● Outputs:\n';
    output += formatJSONForDisplay(log.outputs);
    
    if (index < godWindowsState.zkCircuitLogs.length - 1) {
      output += '\n----------------------------\n\n';
    }
  });
  
  godWindowsElements.zkCircuitOutput.textContent = output;
}

function renderProofBuilder() {
  if (!godWindowsElements.proofBuilder) return;
  
  if (godWindowsState.proofBuilderSteps.length === 0) {
    godWindowsElements.proofBuilder.innerHTML = '<div class="proof-step">Waiting for proof generation...</div>';
    return;
  }
  
  let stepsHtml = '';
  godWindowsState.proofBuilderSteps.forEach((step, index) => {
    const timeStr = step.timestamp.toLocaleTimeString();
    stepsHtml += `
      <div class="proof-step">
        <div class="step-header">
          <span class="step-name">${step.step}</span>
          <span class="step-time">${timeStr}</span>
        </div>
        <div class="step-details">
          <pre>${formatJSONForDisplay(step.details)}</pre>
        </div>
      </div>
    `;
  });
  
  godWindowsElements.proofBuilder.innerHTML = stepsHtml;
}

function renderNullifierTracker() {
  if (!godWindowsElements.nullifierTracker) return;
  
  // Render active nullifiers
  let activeHtml = '';
  godWindowsState.nullifiers.active.forEach(nullifier => {
    activeHtml += `
      <div class="nullifier-item">
        <div class="nullifier-id">${formatNullifierId(nullifier.id)}</div>
        <div class="nullifier-time">Created: ${nullifier.createdAt.toLocaleTimeString()}</div>
      </div>
    `;
  });
  
  if (activeHtml === '') {
    activeHtml = '<div class="nullifier-empty">No active nullifiers</div>';
  }
  
  godWindowsElements.nullifierTracker.activeList.innerHTML = activeHtml;
  
  // Render used nullifiers
  let usedHtml = '';
  godWindowsState.nullifiers.used.forEach(nullifier => {
    usedHtml += `
      <div class="nullifier-item used">
        <div class="nullifier-id">${formatNullifierId(nullifier.id)}</div>
        <div class="nullifier-time">Used: ${nullifier.usedAt.toLocaleTimeString()}</div>
      </div>
    `;
  });
  
  if (usedHtml === '') {
    usedHtml = '<div class="nullifier-empty">No used nullifiers</div>';
  }
  
  godWindowsElements.nullifierTracker.usedList.innerHTML = usedHtml;
}

function renderOffchainLogView() {
  if (!godWindowsElements.offchainLogView) return;
  
  const storageEntries = Object.entries(godWindowsState.offchainStorage);
  
  if (storageEntries.length === 0) {
    godWindowsElements.offchainLogView.textContent = 'Off-chain storage data will appear here...';
    return;
  }
  
  let output = '';
  storageEntries.forEach(([key, entry]) => {
    const timeStr = entry.updatedAt.toLocaleTimeString();
    output += `[${timeStr}] ${key}:\n`;
    output += formatJSONForDisplay(entry.value);
    output += '\n';
  });
  
  godWindowsElements.offchainLogView.textContent = output;
}

function renderActivityMonitor() {
  if (!godWindowsElements.activityMonitor) return;
  
  // Update current activity display
  godWindowsElements.activityMonitor.currentActivity.textContent = godWindowsState.currentActivity;
  godWindowsElements.activityMonitor.currentActivity.className = 'current-activity-value';
  
  if (godWindowsState.currentActivity.toLowerCase().includes('zkproof')) {
    godWindowsElements.activityMonitor.currentActivity.classList.add('activity-zkp');
  } else if (godWindowsState.currentActivity.toLowerCase().includes('ledger')) {
    godWindowsElements.activityMonitor.currentActivity.classList.add('activity-ledger');
  } else if (godWindowsState.currentActivity.toLowerCase().includes('wallet')) {
    godWindowsElements.activityMonitor.currentActivity.classList.add('activity-wallet');
  }
  
  // Update activity log
  if (godWindowsState.activityLog.length === 0) {
    godWindowsElements.activityMonitor.log.innerHTML = '<div class="log-entry initial">Waiting for activities...</div>';
    return;
  }
  
  let logHtml = '';
  godWindowsState.activityLog.slice(0, 6).forEach((entry, index) => {
    const timeStr = entry.timestamp.toLocaleTimeString();
    logHtml += `
      <div class="log-entry ${index === 0 ? 'latest' : ''}">
        <span class="log-time">${timeStr}</span>
        <span class="log-activity">${entry.activity}</span>
      </div>
    `;
  });
  
  godWindowsElements.activityMonitor.log.innerHTML = logHtml;
}

// Helper functions
function formatJSONForDisplay(obj) {
  try {
    return JSON.stringify(obj, null, 2) + '\n';
  } catch (e) {
    return String(obj) + '\n';
  }
}

function formatNullifierId(id) {
  // Format nullifier ID to be more readable - show first and last 4 characters
  if (id.length > 12) {
    return `${id.substring(0, 6)}...${id.substring(id.length - 4)}`;
  }
  return id;
}

// Border animation
function startBorderAnimations() {
  // Create and add style element for animations
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes redBorderPulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
    }
    
    @keyframes greenBorderPulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
    }
    
    @keyframes blueBorderPulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 128, 255, 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(0, 128, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 128, 255, 0); }
    }
    
    .private-border {
      animation: redBorderPulse ${godWindowsConfig.animationSpeed}ms infinite;
      border-color: rgba(255, 0, 0, 0.7) !important;
    }
    
    .public-border {
      animation: greenBorderPulse ${godWindowsConfig.animationSpeed}ms infinite;
      border-color: rgba(0, 255, 0, 0.7) !important;
    }
    
    .activity-border {
      animation: blueBorderPulse ${godWindowsConfig.animationSpeed}ms infinite;
      border-color: rgba(0, 128, 255, 0.7) !important;
    }
  `;
  document.head.appendChild(styleEl);
}

// Hook API functions to capture ZK proof generation, state changes, etc.
function hookIntoApiCalls() {
  // Original handleVerification function
  const originalHandleVerification = window.handleVerification;
  
  // Override handleVerification to capture ZK operations
  window.handleVerification = function(event, side) {
    updateCurrentActivity(`Verifying asset ownership (${side})`);
    
    // If it's the private side, simulate ZK proof steps
    if (side === 'private') {
      const assetSelect = side === 'private' ? domElements.assetSelectPrivate : domElements.assetSelectPublic;
      const amountInput = side === 'private' ? domElements.amountInputPrivate : domElements.amountInputPublic;
      
      const assetId = assetSelect.value;
      const amount = parseInt(amountInput.value, 10);
      
      // Simulate ZK proof generation steps
      setTimeout(() => {
        updateCurrentActivity("Generating ZK Proof inputs");
        addProofBuilderStep("Setup ZK Circuit", {
          circuit: "AssetVerification",
          assetId: assetId,
          amount: amount
        });
      }, 300);
      
      setTimeout(() => {
        updateCurrentActivity("Creating commitment hash");
        addProofBuilderStep("Create commitment hash", {
          commitment: hashString(`${assetId}-${amount}-${Date.now()}`),
          salt: Date.now().toString(36)
        });
      }, 600);
      
      setTimeout(() => {
        updateCurrentActivity("Generating witness");
        addProofBuilderStep("Generate witness", {
          witnessSize: "1.2 KB",
          constraints: 42,
          privateInputs: "✓ Hidden"
        });
      }, 900);
      
      setTimeout(() => {
        const nullifierId = `nullifier_${Math.random().toString(36).substring(2, 10)}`;
        updateCurrentActivity("Creating ZK proof");
        addProofBuilderStep("Create ZK Proof", {
          proofSize: "832 bytes",
          verificationTime: "12ms",
          nullifierId: nullifierId
        });
        
        // Track nullifier
        trackNullifier(nullifierId);
        
        // Log ZK circuit data
        logZkCircuitData("AssetVerification", {
          assetType: assetId,
          amountRange: "Hidden",
          userAddress: "Hidden"
        }, {
          verificationResult: "Valid",
          verificationId: `verify_${Math.random().toString(36).substring(2, 10)}`
        });
        
        // Update off-chain storage
        updateOffchainStorage(`verification_${Date.now()}`, {
          type: "asset_verification",
          asset: assetId,
          result: "success",
          proofGenerated: true
        });
      }, 1500);
    }
    
    // Call original function
    return originalHandleVerification.apply(this, arguments);
  };
  
  // Original handleOrderSubmission function
  const originalHandleOrderSubmission = window.handleOrderSubmission;
  
  // Override handleOrderSubmission to capture ZK operations
  window.handleOrderSubmission = function(event, side) {
    updateCurrentActivity(`Submitting order (${side})`);
    
    // If it's the private side, simulate ZK proof steps
    if (side === 'private') {
      const orderTypeSelect = side === 'private' ? domElements.orderTypeSelectPrivate : domElements.orderTypeSelectPublic;
      const orderAssetSelect = side === 'private' ? domElements.orderAssetSelectPrivate : domElements.orderAssetSelectPublic;
      const orderPriceInput = side === 'private' ? domElements.orderPriceInputPrivate : domElements.orderPriceInputPublic;
      const orderAmountInput = side === 'private' ? domElements.orderAmountInputPrivate : domElements.orderAmountInputPublic;
      
      const orderType = orderTypeSelect.value;
      const assetId = orderAssetSelect.value;
      const price = parseFloat(orderPriceInput.value);
      const amount = parseInt(orderAmountInput.value, 10);
      
      // Simulate order proof generation
      setTimeout(() => {
        updateCurrentActivity("Preparing order data");
        addProofBuilderStep("Prepare Order Data", {
          orderType: orderType,
          assetId: assetId,
          priceHash: hashString(`price-${price}`),
          amountHash: hashString(`amount-${amount}`)
        });
      }, 300);
      
      setTimeout(() => {
        updateCurrentActivity("Creating order commitment");
        addProofBuilderStep("Create Order Commitment", {
          commitment: hashString(`${orderType}-${assetId}-${price}-${amount}-${Date.now()}`),
          revealed: ["orderType", "assetId"],
          hidden: ["price", "amount", "nonce"]
        });
      }, 800);
      
      setTimeout(() => {
        const orderId = `order_${Math.random().toString(36).substring(2, 10)}`;
        updateCurrentActivity("Generating ZK proof for order");
        addProofBuilderStep("Generate Order Proof", {
          proofSize: "1.4 KB",
          verificationTime: "18ms",
          orderId: orderId
        });
        
        // Log ZK circuit data
        logZkCircuitData("OrderPlacement", {
          orderType: orderType,
          assetId: assetId,
          price: "Hidden",
          amount: "Hidden"
        }, {
          commitmentId: `commit_${Math.random().toString(36).substring(2, 10)}`,
          orderId: orderId
        });
        
        // Update off-chain storage
        updateOffchainStorage(`order_${Date.now()}`, {
          type: "place_order",
          orderType: orderType,
          asset: assetId,
          status: "pending",
          timestamp: new Date().toISOString()
        });
      }, 1500);
      
      setTimeout(() => {
        updateCurrentActivity("Writing order to ledger");
        // Update off-chain storage
        updateOffchainStorage(`ledger_${Date.now()}`, {
          action: "write_order",
          status: "success",
          timestamp: new Date().toISOString()
        });
      }, 2000);
      
      setTimeout(() => {
        updateCurrentActivity("Updating wallet state");
      }, 2500);
    }
    
    // Call original function
    return originalHandleOrderSubmission.apply(this, arguments);
  };
  
  // Hook into attemptFrontrun
  const originalAttemptFrontrun = window.attemptFrontrun;
  
  window.attemptFrontrun = function(side) {
    updateCurrentActivity(`Attempting front-run (${side})`);
    
    if (side === 'private') {
      setTimeout(() => {
        updateCurrentActivity("Analyzing commitment data");
        addProofBuilderStep("Analyze Commitment", {
          result: "Unable to extract data",
          reason: "Encrypted with ZK commitments"
        });
      }, 500);
      
      setTimeout(() => {
        updateCurrentActivity("Front-run attempt failed (private)");
        // Update off-chain storage
        updateOffchainStorage(`frontrun_attempt_${Date.now()}`, {
          side: "private",
          result: "failed",
          reason: "Order details protected by ZK proofs"
        });
      }, 1000);
    } else {
      setTimeout(() => {
        updateCurrentActivity("Reading public order data");
        addProofBuilderStep("Read Public Order", {
          result: "Order details extracted",
          data: {
            type: "buy",
            asset: "TOKEN-Y",
            price: 6.25,
            amount: 100
          }
        });
      }, 500);
      
      setTimeout(() => {
        updateCurrentActivity("Front-run attempt succeeded (public)");
        // Update off-chain storage
        updateOffchainStorage(`frontrun_attempt_${Date.now()}`, {
          side: "public",
          result: "success",
          reason: "Order details publicly visible"
        });
      }, 1000);
    }
    
    // Call original function
    return originalAttemptFrontrun.apply(this, arguments);
  };
}

// Helper function to create hash strings
function hashString(str) {
  // Simple string hash function for demonstration
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return '0x' + (hash >>> 0).toString(16).padStart(8, '0');
}

// Export Dev Mode API
window.GodWindows = {
  init: initGodWindows,
  updateCurrentActivity,
  logZkCircuitData,
  addProofBuilderStep,
  trackNullifier,
  updateOffchainStorage,
  hookIntoApiCalls
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Don't initialize immediately, wait for button click
  hookIntoApiCalls();
});
