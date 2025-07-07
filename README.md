# SilentLedger

A privacy-preserving verified orderbook DApp built on the Midnight blockchain for the Midnight Mini DApp Hackathon.

## Project Overview

SilentLedger is a minimal but powerful DApp that provides an obfuscated orderbook with asset ownership verification. It leverages Midnight's privacy features to:

1. **Maintain order privacy** - Orders are processed without revealing unnecessary details
2. **Verify asset ownership** - Sellers must prove they own assets without revealing balances
3. **Prevent short selling** - Only verified owners can place sell orders

## Key Features

- **Obfuscated Orderbook**: Privacy-preserving order matching and execution
- **Zero-Knowledge Ownership Verification**: Prove asset ownership without revealing balances
- **Minimal UI**: Clean, efficient interface focused on core functionality
- **Proof Server**: Off-chain logging of private transaction data
- **Mock Wallet Integration**: Development support for testing without blockchain

## Architecture

The project consists of three main components:

1. **Frontend**: Simple web interface for interacting with the orderbook
2. **Smart Contracts**: Written in Compact language for the Midnight blockchain
   - Ownership verification contract
   - Orderbook management contract
3. **Backend Services**: 
   - Proof server for off-chain logging
   - Mock wallet for development testing

## Getting Started

### Prerequisites

- Node.js (v14+)
- Yarn package manager
- Midnight wallet extension (or mock wallet for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/SilentLedger.git

# Install dependencies
cd SilentLedger
yarn install

# Start the application
yarn start
```

### Development

For development, you can use these commands:

```bash
# Run the development server
yarn dev

# Start the proof server
yarn proof-server

# Run the mock wallet (for testing without blockchain)
yarn mock-wallet
```

## Hackathon Submission

This project is a submission for the [Midnight Mini DApp Hackathon](https://midnight.network/hackathon/midnight-mini-dapp-hackathon). It demonstrates how Midnight's privacy features can be applied to create a practical financial application.

## License

MIT
