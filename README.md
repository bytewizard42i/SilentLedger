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

## Compatibility

This repository is updated for Midnight Compact language version 0.15.

- Uses explicit `import CompactStandardLibrary;`
- Replaces `Void` with `[]` (empty tuple) for functions with no return values
- TypeScript-aligned loops (e.g., `for (let i = 0; i < n; i++) {}`)
- Implicit `Cell` in ledger state declarations (`ledger state: TYPE`)
- No witness leakage; only derived values (e.g., hashes) are compared/stored
- Ownership verification now includes `currentTime` in `checkVerification()` to enforce expiry

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

### Developer Quick Start (Contracts)

> Note: These Compact contracts target `pragma language_version 0.15` and are structured for integration. If you have the Compact toolchain:

1. Build and check syntax for the contracts in `contracts/`:
   - `contracts/AssetVerification.compact`
   - `contracts/ObfuscatedOrderbook.compact`
   - `contracts/SilentOrderbook.compact`
2. Deploy `AssetVerification` first, then initialize `ObfuscatedOrderbook` with its address via `initialize(verificationContractAddress)`.
3. Frontend interacts via the mock wallet server and Mesh SDK.

## Example Usage

1. Verify ownership (off-chain mock call):

```js
const { verified, verificationId, timestamp } = await MidnightWallet.verifyOwnership('TOKEN-X', 100);
```

2. Place order (mock server call example):

```js
await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    caller: walletAddress,
    assetId: 'TOKEN-X',
    orderType: 'sell',
    price: 10,
    amount: 100,
    verificationId,
    currentTime: Math.floor(Date.now()/1000),
    side: 'private'
  })
});
```

## Security Considerations

- Ownership verification includes expiry enforcement (`VERIFICATION_VALIDITY_PERIOD`) and checks `currentTime`.
- Avoid disclosing witness/private data; only derived/public-safe values are returned or stored (e.g., commitments, hashes). If intentional disclosure is required, wrap with `disclose(...)` per Compact specs.
- Consider adding signature-based API auth to the mock/off-chain proof server to prevent tampering.

### API Signing (dev mock server)

- Middleware `verifyRequest` protects `POST /api/orders` in `src/api/mock-wallet-server.js`.
- Headers required:
  - `x-client`: client identifier (Ed25519 pubkey base64 when in ed25519 mode)
  - `x-timestamp`: seconds since epoch
  - `x-nonce`: unique per request
  - `x-sig`: signature over preimage
- Preimage: `DOMAIN_TAG | METHOD | PATH | sha256(canonicalJSON(body)) | timestamp | nonce`.
- Modes: `SIGNING_MODE=ed25519` (preferred) or `hmac` via `.env`.
- Config in `.env` (see `.env.example`). Helpers live in:
  - `src/api/crypto/` (canonicalize, nonce LRU, signature verification)
  - `src/api/middleware/verifyRequest.js`


## Architecture Diagram

An architecture diagram source is at `media/architecture.mmd`. Export to `media/architecture.svg` for docs. It illustrates:

- Frontend (UI, Mesh SDK wallet integration)
- Contracts: `AssetVerification`, `ObfuscatedOrderbook`, `SilentOrderbook`
- Backend: Mock wallet server / proof server
- Data flows: verifyOwnership -> placeOrder -> match -> query orderbook

## Hackathon Submission

This project is a submission for the [Midnight Mini DApp Hackathon](https://midnight.network/hackathon/midnight-mini-dapp-hackathon). It demonstrates how Midnight's privacy features can be applied to create a practical financial application.

## License

MIT
