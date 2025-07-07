/**
 * SilentLedger - Midnight Lace Wallet Integration
 * Using Mesh SDK's Midnight React bindings
 */

// Import meshsdk from the CDN for use in the browser
// Note: In a full React app, you would import from @meshsdk/midnight-react directly
const MidnightWallet = (function() {
  // Initialize wallet state
  let walletState = {
    address: null,
    connected: false,
    network: null,
    balance: {}
  };

  // Event callbacks
  const callbacks = {
    onConnectSuccess: null,
    onConnectError: null,
    onDisconnect: null,
    onAccountChange: null,
    onNetworkChange: null
  };

  // Connect to Lace wallet using window.meshSDK
  async function connect() {
    try {
      // Check if meshSDK is available (provided by the Mesh SDK browser extension)
      if (!window.meshSDK) {
        throw new Error("Mesh SDK not found. Please install the Lace Wallet extension.");
      }

      // Initialize the wallet
      await window.meshSDK.midnight.enable({
        name: 'SilentLedger',
        description: 'Privacy-Preserving Orderbook'
      });

      // Get wallet information
      const address = await window.meshSDK.midnight.getAddress();
      const network = await window.meshSDK.midnight.getNetwork();
      const balance = await window.meshSDK.midnight.getBalance();

      // Update wallet state
      walletState = {
        address,
        connected: true,
        network,
        balance
      };

      // Call success callback if defined
      if (callbacks.onConnectSuccess && typeof callbacks.onConnectSuccess === 'function') {
        callbacks.onConnectSuccess(walletState);
      }

      return walletState;
    } catch (error) {
      console.error("Error connecting to Lace Wallet:", error);
      
      // Call error callback if defined
      if (callbacks.onConnectError && typeof callbacks.onConnectError === 'function') {
        callbacks.onConnectError(error);
      }
      
      throw error;
    }
  }

  // Disconnect from wallet
  async function disconnect() {
    try {
      if (window.meshSDK && walletState.connected) {
        await window.meshSDK.midnight.disable();
        
        walletState = {
          address: null,
          connected: false,
          network: null,
          balance: {}
        };
        
        // Call disconnect callback if defined
        if (callbacks.onDisconnect && typeof callbacks.onDisconnect === 'function') {
          callbacks.onDisconnect();
        }
      }
      return true;
    } catch (error) {
      console.error("Error disconnecting from Lace Wallet:", error);
      throw error;
    }
  }

  // Get wallet balance
  async function getBalance() {
    try {
      if (!walletState.connected) {
        throw new Error("Wallet not connected");
      }
      
      const balance = await window.meshSDK.midnight.getBalance();
      walletState.balance = balance;
      
      return balance;
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      throw error;
    }
  }

  // Verify ownership of assets (for ZK proofs)
  async function verifyOwnership(assetId, amount) {
    try {
      if (!walletState.connected) {
        throw new Error("Wallet not connected");
      }
      
      // This would use the Mesh SDK to create a zero-knowledge proof of asset ownership
      const verificationResult = await window.meshSDK.midnight.createProof({
        type: 'assetOwnership',
        params: {
          assetId,
          amount
        }
      });
      
      return {
        verified: verificationResult.success,
        verificationId: verificationResult.proofId,
        proof: verificationResult.proof
      };
    } catch (error) {
      console.error("Error verifying ownership:", error);
      throw error;
    }
  }

  // Sign a transaction (for placing orders)
  async function signTransaction(tx) {
    try {
      if (!walletState.connected) {
        throw new Error("Wallet not connected");
      }
      
      const signedTx = await window.meshSDK.midnight.signTransaction(tx);
      return signedTx;
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }

  // Set event callbacks
  function setCallbacks(newCallbacks) {
    callbacks.onConnectSuccess = newCallbacks.onConnectSuccess || callbacks.onConnectSuccess;
    callbacks.onConnectError = newCallbacks.onConnectError || callbacks.onConnectError;
    callbacks.onDisconnect = newCallbacks.onDisconnect || callbacks.onDisconnect;
    callbacks.onAccountChange = newCallbacks.onAccountChange || callbacks.onAccountChange;
    callbacks.onNetworkChange = newCallbacks.onNetworkChange || callbacks.onNetworkChange;
  }

  // Setup event listeners for wallet events
  function setupEventListeners() {
    if (window.meshSDK) {
      window.meshSDK.midnight.on('accountChange', (accounts) => {
        if (accounts && accounts.length > 0) {
          walletState.address = accounts[0];
          
          if (callbacks.onAccountChange && typeof callbacks.onAccountChange === 'function') {
            callbacks.onAccountChange(accounts[0]);
          }
        }
      });
      
      window.meshSDK.midnight.on('networkChange', (network) => {
        walletState.network = network;
        
        if (callbacks.onNetworkChange && typeof callbacks.onNetworkChange === 'function') {
          callbacks.onNetworkChange(network);
        }
      });
    }
  }

  // Check if wallet is installed
  function isInstalled() {
    return !!window.meshSDK;
  }

  // Initialize the wallet module
  function init() {
    setupEventListeners();
    return {
      connect,
      disconnect,
      getBalance,
      verifyOwnership,
      signTransaction,
      setCallbacks,
      isInstalled,
      getState: () => ({ ...walletState })
    };
  }

  return init();
})();
