# SilentLedger

A privacy-preserving verified orderbook DApp built on the Midnight blockchain for the Midnight Mini DApp Hackathon.

## Judges Note (Midnight Mini DApp Hackathon)

Dear Midnight Judges — SilentLedger is an educational DApp that demonstrates how Midnight’s zero-knowledge commitments and verification can prevent front‑running and short selling. For transparency in a demo setting, we include developer‑only “God Windows” that visualize otherwise private ZK flows. These windows are opt‑in and are strictly for demonstrations, debugging, and teaching; they are not representative of production disclosure.

Key takeaways to look for during the demo:

- Private side hides actionable order details; front‑running attempts fail.
- Public side exposes order details; front‑running attempts may succeed.
- Sellers must prove ownership via ZK before placing sell orders (prevents short selling) without revealing balances.
- God Windows show proof steps, nullifiers, and off‑chain logs purely for learning.

Statement of belief (myAlice): To the best of our knowledge and resources, our team has demonstrated a practical approach to cross‑model continuity of an AI agent’s “essence” (personality, memory, contextual behavior, decision heuristics) using a Git‑backed persistence layer. We cannot conclusively prove novelty today, and we present this in good faith as related research informing our stance on verifiable, privacy‑preserving state.

## Quickstart

Fast path for judges to run the demo locally.

Prereqs: Node.js 14+ and Yarn.

1) Install dependencies
```bash
yarn install
```

2) Start services (one command)
```bash
yarn demo:start
```

This launches the mock wallet (3001), proof server (3000), and app (8080).

3) Open the app
```
http://localhost:8080
```

4) Optional: Use the Dev Mode button to toggle God Windows (educational view only; not for production).

## Submission Package

- Archive: `SilentLedger_full_2025-08-18.zip`
- SHA256: `5559137c530232a4af3becb2e4d093fd241b9f780e8d7f03f46ad8f4decb3adc`

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
- **God Windows (Dev‑Only)**: Toggleable visualizations of ZK circuits, proof steps, nullifiers, and off‑chain logs to aid demonstrations and debugging

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


#### Domain Tags

| Name        | Value         | Used In                          |
|-------------|---------------|----------------------------------|
| API Signing | `sunex:api:v1`| Request-signing preimage domain  |


## Migration Guide & Version Alignment

This codebase compiles with **Compact 0.15** while adopting the **0.14 privacy guardrails** by design:

- **Intentional disclosure required**: any witness-derived value that flows to public state must be wrapped in `disclose(...)`.
- **Unit return**: functions that return “nothing” use the empty tuple `[]`.
- **Loop syntax**: `for (const x of y)` and `for (const i of m..n)`.
- **Implicit Cells**: ledger fields are declared without `Cell<T>` and use assignment sugar.
- **Standard Library import**: ledger ADTs come via the stdlib import.

See “Compact 0.14 Migration Guide (TL;DR)” below for before/after snippets and rationale.


## Compact 0.14 Migration Guide (TL;DR)

**Breaking changes we adopted**
- `disclose(...)` is required for any intentional witness→public leak.
- `Void` is gone → use `[]` (unit), and `return;` implies `[]`.
- `for` loops are TS‑style: `for (const x of v)` and `for (const i of m..n)`.
- `Cell<T>` is implicit: write `ledger state: STATE` (not `Cell<STATE>`).
- Ledger ADTs live in the stdlib → `import CompactStandardLibrary;` when needed.

See the before/after below for the `disclose()` pattern.

```compact
// BEFORE (pre‑0.14 style) — illustrative only
// Issues: implicit leak risk, Void return, old for-syntax, explicit Cell<STATE>
enum STATE { vacant, occupied }

ledger
  state: Cell<STATE>;
  poster: Cell<Bytes<32>>;

witness local_secret_key(): Bytes<32>; // private

export circuit post(new_message: Opaque<"string">): Void {
  assert state.read() == STATE.vacant "Board occupied";

  // Derive a public key from a *private* secret.
  // Pre-0.14 compilers might allow this to flow into ledger without an error.
  const pk = public_key(local_secret_key(), instance as Field as Bytes<32>);

  poster.write(pk);          // <-- potential private→public leak
  state.write(STATE.occupied);

  // Old for syntax (range)
  for i = 0 to 3 do {
    // ...
  }
}
```

```compact
// AFTER (Compact 0.14 compliant)
import CompactStandardLibrary;

enum STATE { vacant, occupied }

ledger
  state: STATE;            // Cell<> is implicit in 0.14
  poster: Bytes<32>;

witness local_secret_key(): Bytes<32>; // remains private

// Unit return instead of Void; `return;` implies returning []
export circuit post(new_message: Opaque<"string">): [] {
  assert state == STATE.vacant "Board occupied";

  // Derive the *public* value from the private witness.
  // Make the boundary explicit by disclosing the *derived* public key (preferred).
  const pk_public = disclose(
    public_key(local_secret_key(), instance as Field as Bytes<32>)
  );

  poster = pk_public;       // now an explicit, intentional disclosure
  state = STATE.occupied;

  // TS-style loops
  for (const i of 0..3) {
    // ...
  }
  // implicit unit return
}
```

## Architecture Overview
![System Architecture](./media/architecture.mmd)

An architecture diagram source is at `media/architecture.mmd`. Export to `media/architecture.svg` for docs. It illustrates:

- Frontend (UI, Mesh SDK wallet integration)
- Contracts: `AssetVerification`, `ObfuscatedOrderbook`, `SilentOrderbook`
- Backend: Mock wallet server / proof server
- Data flows: verifyOwnership -> placeOrder -> match -> query orderbook

## Judges Demo Guide

1) Start services

```bash
yarn mock-wallet   # port 3001
yarn proof-server  # port 3000 (optional, logs private metadata for demo)
yarn start         # app at http://localhost:8080
```

2) In the UI (`public/index.html` served by `server.js`):

- Connect Wallet, then “Verify Ownership” for TOKEN‑X or TOKEN‑Y.
- Use “Place Order” to create buy/sell orders on the Private or Public side.
- Open the Front‑Running Simulator and attempt on both sides:
  - Private side: attempts should fail due to hidden actionable details.
  - Public side: attempts may succeed because details are visible.
- Toggle the “God Windows” section to visualize:
  - ZK circuit inputs/outputs and proof‑builder steps
  - Active/used nullifiers and commitments
  - Off‑chain logs from the proof server (dev/demo only)

3) What to look for

- Short selling prevention: sell requires prior ownership verification; balances remain private.
- Privacy contrast: identical actions behave differently on Private vs Public sides.
- Educational transparency: God Windows exist only to teach and debug; production would not disclose these internals.

## Hackathon Submission

This project is a submission for the [Midnight Mini DApp Hackathon](https://midnight.network/hackathon/midnight-mini-dapp-hackathon). It demonstrates how Midnight's privacy features can be applied to create a practical financial application.

## License

MIT
