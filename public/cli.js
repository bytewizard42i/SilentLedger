/**
 * SilentLedger CLI Interface
 * Provides command-line access to SilentLedger functionality
 */

// CLI State
const cliState = {
  active: true,
  history: [],
  historyIndex: -1
};

// DOM Elements
const cliElements = {
  container: document.querySelector('.cli-container'),
  output: document.getElementById('cli-output'),
  input: document.getElementById('cli-input'),
  submit: document.getElementById('cli-submit'),
  toggle: document.getElementById('cli-status')
};

// Initialize CLI
document.addEventListener('DOMContentLoaded', () => {
  // Setup guided tour command suggestions
  setupGuidedTour();
  
  // Set up event listeners
  cliElements.submit.addEventListener('click', handleCliSubmit);
  cliElements.input.addEventListener('keydown', handleCliKeydown);
  cliElements.toggle.addEventListener('click', toggleCli);
  
  // Focus input on click anywhere in the terminal
  cliElements.output.addEventListener('click', () => {
    cliElements.input.focus();
  });
});

// Handle CLI submission
function handleCliSubmit() {
  const command = cliElements.input.value.trim();
  
  if (command) {
    // Add to history
    cliState.history.unshift(command);
    cliState.historyIndex = -1;
    
    // Display command in output
    printToOutput(`$ ${command}`, 'command');
    
    // Process command
    processCommand(command);
    
    // Clear input
    cliElements.input.value = '';
  }
}

// Handle keyboard events for CLI input
function handleCliKeydown(e) {
  // Enter key to submit
  if (e.key === 'Enter') {
    e.preventDefault();
    handleCliSubmit();
    return;
  }
  
  // Up arrow for history navigation
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    navigateHistory('up');
    return;
  }
  
  // Down arrow for history navigation
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    navigateHistory('down');
    return;
  }
  
  // Tab for command completion (basic)
  if (e.key === 'Tab') {
    e.preventDefault();
    completeCommand();
    return;
  }
}

// Navigate command history
function navigateHistory(direction) {
  if (cliState.history.length === 0) return;
  
  if (direction === 'up') {
    cliState.historyIndex = Math.min(cliState.history.length - 1, cliState.historyIndex + 1);
  } else {
    cliState.historyIndex = Math.max(-1, cliState.historyIndex - 1);
  }
  
  if (cliState.historyIndex === -1) {
    cliElements.input.value = '';
  } else {
    cliElements.input.value = cliState.history[cliState.historyIndex];
  }
}

// Basic command completion
function completeCommand() {
  const input = cliElements.input.value.trim();
  const commands = ['connect', 'balance', 'verify', 'order', 'frontrun', 'pendingorder', 'reset', 'clear', 'help'];
  
  if (!input) return;
  
  // Find matching commands
  const matches = commands.filter(cmd => cmd.startsWith(input.split(' ')[0]));
  
  if (matches.length === 1) {
    // If only one match, complete the command
    const parts = input.split(' ');
    parts[0] = matches[0];
    cliElements.input.value = parts.join(' ');
  } else if (matches.length > 1) {
    // If multiple matches, show options
    printToOutput(`Multiple matches: ${matches.join(', ')}`, 'info');
  }
}

// Toggle CLI visibility
function toggleCli() {
  cliState.active = !cliState.active;
  cliElements.toggle.textContent = cliState.active ? 'ON' : 'OFF';
  cliElements.container.classList.toggle('cli-hidden', !cliState.active);
}

// Process CLI commands
function processCommand(command) {
  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  
  switch(cmd) {
    case 'help':
      showHelp();
      break;
    case 'clear':
      clearOutput();
      break;
    case 'connect':
      connectWalletCli(parts[1]);
      break;
    case 'balance':
      checkBalanceCli(parts[1]);
      break;
    case 'verify':
      verifyAssetCli(parts[1], parseInt(parts[2], 10));
      break;
    case 'order':
      placeOrderCli(parts[1], parts[2], parts[3], parseFloat(parts[4]), parseInt(parts[5], 10));
      break;
    case 'frontrun':
      attemptFrontrunCli(parts[1]);
      break;
    case 'pendingorder':
      createPendingOrderCli(parts[1], parts[2], parts[3], parseFloat(parts[4]), parseInt(parts[5], 10));
      break;
    case 'reset':
      resetSimulationCli();
      break;
    default:
      printToOutput(`Command not recognized: ${cmd}. Type 'help' for available commands.`, 'error');
  }
}

// Command implementations
function showHelp() {
  printToOutput(
    'Available commands:\n' +
    '  connect [user]              - Connect wallet (admin, user1, user2)\n' +
    '  balance [asset]             - Check asset balance\n' +
    '  verify [asset] [amount]     - Verify asset ownership\n' +
    '  order [side] [type] [asset] [price] [amount] - Place order\n' +
    '                                side: private/public\n' +
    '                                type: buy/sell\n' +
    '                                asset: TOKEN-X/TOKEN-Y\n' +
    '  frontrun [side]             - Attempt front-running (side: private/public)\n' +
    '  pendingorder [side] [type] [asset] [price] [amount] - Create pending order\n' +
    '  reset                       - Reset simulation\n' +
    '  clear                       - Clear CLI output\n' +
    '  help                        - Show this help message',
    'info'
  );
}

function clearOutput() {
  cliElements.output.innerHTML = 'Output cleared.';
}

function connectWalletCli(user) {
  if (!user) {
    printToOutput('Error: Missing user parameter. Usage: connect [user]', 'error');
    return;
  }
  
  if (!['admin', 'user1', 'user2'].includes(user)) {
    printToOutput('Error: Invalid user. Must be admin, user1, or user2.', 'error');
    return;
  }
  
  printToOutput(`Connecting wallet for ${user}...`, 'info');
  
  // Call the connect wallet function from the main app
  fetch(`${API_CONFIG.mockWallet}/api/wallet/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet: user })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      appState.wallet = data.wallet;
      appState.connected = true;
      updateWalletUI();
      printToOutput(`Connected as ${user}. Address: ${formatAddress(data.wallet.address)}`, 'success');
    } else {
      throw new Error(data.error || 'Failed to connect wallet');
    }
  })
  .catch(error => {
    printToOutput(`Error connecting wallet: ${error.message}`, 'error');
  });
}

function checkBalanceCli(asset) {
  if (!appState.connected) {
    printToOutput('Error: No wallet connected. Use connect [user] first.', 'error');
    return;
  }
  
  if (!asset) {
    // Show all balances
    printToOutput('Asset Balances:', 'info');
    Object.entries(appState.wallet.balance).forEach(([assetId, amount]) => {
      printToOutput(`  ${assetId}: ${amount}`, 'info');
    });
  } else {
    // Show specific asset balance
    const balance = appState.wallet.balance[asset];
    if (balance !== undefined) {
      printToOutput(`Balance for ${asset}: ${balance}`, 'success');
    } else {
      printToOutput(`Asset ${asset} not found in wallet.`, 'error');
    }
  }
}

function verifyAssetCli(assetId, amount) {
  if (!appState.connected) {
    printToOutput('Error: No wallet connected. Use connect [user] first.', 'error');
    return;
  }
  
  if (!assetId || isNaN(amount) || amount <= 0) {
    printToOutput('Error: Invalid parameters. Usage: verify [asset] [amount]', 'error');
    return;
  }
  
  printToOutput(`Verifying ownership of ${amount} ${assetId}...`, 'info');
  
  // Call verification API
  fetch(`${API_CONFIG.mockWallet}/api/wallet/${appState.wallet ? 'user1' : 'guest'}/verify-ownership`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetId, amount })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Store the verification for later use
      appState.verifications[data.verificationId] = {
        assetId,
        amount,
        verified: data.verified,
        timestamp: new Date()
      };
      
      if (data.verified) {
        printToOutput(`✓ Ownership verified for ${amount} ${assetId}`, 'success');
        printToOutput(`Verification ID: ${data.verificationId}`, 'info');
        printToOutput('(Save this ID for placing sell orders)', 'info');
      } else {
        printToOutput(`✗ Ownership verification failed for ${amount} ${assetId}`, 'error');
      }
    } else {
      throw new Error(data.error || 'Verification failed');
    }
  })
  .catch(error => {
    printToOutput(`Error verifying ownership: ${error.message}`, 'error');
  });
}

function placeOrderCli(side, orderType, assetId, price, amount) {
  if (!appState.connected) {
    printToOutput('Error: No wallet connected. Use connect [user] first.', 'error');
    return;
  }
  
  if (!side || !['private', 'public'].includes(side) || 
      !orderType || !['buy', 'sell'].includes(orderType) ||
      !assetId || isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
    printToOutput('Error: Invalid parameters. Usage: order [side] [type] [asset] [price] [amount]', 'error');
    return;
  }
  
  printToOutput(`Placing ${orderType} order for ${amount} ${assetId} @ ${price} on ${side} side...`, 'info');
  
  // For sell orders, ask for verification ID
  if (orderType === 'sell') {
    // This is a simplification; in a real app we'd prompt for the verification ID
    const verificationIds = Object.keys(appState.verifications);
    const validVerifications = verificationIds.filter(id => {
      const v = appState.verifications[id];
      return v.assetId === assetId && v.amount >= amount && v.verified;
    });
    
    if (validVerifications.length === 0) {
      printToOutput('Error: No valid verification found for this asset and amount.', 'error');
      printToOutput('Please verify ownership first with: verify [asset] [amount]', 'info');
      return;
    }
    
    const verificationId = validVerifications[0];
    submitOrder(side, orderType, assetId, price, amount, verificationId);
  } else {
    submitOrder(side, orderType, assetId, price, amount);
  }
}

function submitOrder(side, orderType, assetId, price, amount, verificationId = null) {
  // Submit order to API
  fetch(`${API_CONFIG.mockWallet}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: appState.wallet ? 'user1' : 'guest',
      orderType,
      assetId,
      price,
      amount,
      verificationId: orderType === 'sell' ? verificationId : undefined
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      printToOutput(`✓ ${orderType.toUpperCase()} order placed successfully on ${side} side.`, 'success');
      printToOutput(`Order ID: ${data.order.id}`, 'info');
      
      // Reload orderbook to reflect changes
      loadOrderbook(assetId, side);
    } else {
      throw new Error(data.error || 'Order placement failed');
    }
  })
  .catch(error => {
    printToOutput(`Error placing order: ${error.message}`, 'error');
  });
}

function attemptFrontrunCli(side) {
  if (!appState.connected) {
    printToOutput('Error: No wallet connected. Use connect [user] first.', 'error');
    return;
  }
  
  if (!side || !['private', 'public'].includes(side)) {
    printToOutput('Error: Invalid side. Usage: frontrun [private|public]', 'error');
    return;
  }
  
  // Check if there's a pending order to front-run
  const pendingOrderEl = side === 'private' ? 
    domElements.pendingOrderPrivate : domElements.pendingOrderPublic;
  const pendingDetails = pendingOrderEl.querySelector('.pending-order-details');
  
  if (pendingDetails.textContent === 'No pending orders') {
    printToOutput(`No pending orders to front-run on ${side} side.`, 'warning');
    return;
  }
  
  printToOutput(`Attempting to front-run order on ${side} side...`, 'info');
  attemptFrontrun(side);
}

function createPendingOrderCli(side, orderType, assetId, price, amount) {
  if (!side || !['private', 'public'].includes(side) || 
      !orderType || !['buy', 'sell'].includes(orderType) ||
      !assetId || isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
    printToOutput('Error: Invalid parameters. Usage: pendingorder [side] [type] [asset] [price] [amount]', 'error');
    return;
  }
  
  // Create a pending order for simulation
  const pendingOrder = {
    id: `pending-${Date.now()}`,
    orderType,
    assetId,
    price,
    amount,
    isVisible: side === 'public'
  };
  
  // Set it in the appropriate container
  displayPendingOrder(side, pendingOrder);
  
  // Enable front-run buttons
  const frontrunBtn = side === 'private' ? 
    domElements.attemptFrontrunPrivate : domElements.attemptFrontrunPublic;
  frontrunBtn.disabled = false;
  
  printToOutput(`Created pending ${orderType} order for ${amount} ${assetId} @ ${price} on ${side} side.`, 'success');
  printToOutput(`Order ${side === 'public' ? 'is' : 'is not'} visible to other users.`, side === 'public' ? 'warning' : 'info');
}

function resetSimulationCli() {
  resetSimulation();
  printToOutput('Simulation reset.', 'info');
}

// Helper functions
function printToOutput(message, type = '') {
  const line = document.createElement('div');
  line.className = type;
  line.textContent = message;
  cliElements.output.appendChild(line);
  
  // Scroll to bottom
  cliElements.output.scrollTop = cliElements.output.scrollHeight;
}

// Guided tour functionality - makes command suggestions clickable
function setupGuidedTour() {
  const suggestions = document.querySelectorAll('.cli-suggestion');
  
  suggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
      const command = suggestion.getAttribute('data-command');
      if (command) {
        // Fill the CLI input with the command
        cliElements.input.value = command;
        
        // Focus on the input
        cliElements.input.focus();
        
        // Highlight the suggestion to show it's been clicked
        suggestion.classList.add('clicked');
        
        // Remove highlight after a delay
        setTimeout(() => {
          suggestion.classList.remove('clicked');
        }, 1000);
        
        // Auto-submit after a brief delay to let users see what's happening
        setTimeout(() => {
          // Execute the command
          handleCliSubmit();
        }, 300);
      }
    });
  });
}

// Export the CLI interface for other modules to use
window.cliInterface = {
  printToOutput,
  setActive,
  getActive,
  executeCommand
};
