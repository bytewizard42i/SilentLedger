# SilentLedger — Midnight Mini DApp Hackathon Submission

## Hackathon Submission: SilentLedger

### Problem
Front-running and short selling are systemic issues in DeFi — they erode fairness, reduce trust, and drive users away. Attackers exploit transparency in public ledgers, extracting value before honest users can act.

### Our Solution
SilentLedger leverages Midnight’s zero-knowledge proofs to protect order integrity and enforce verifiable ownership without revealing sensitive balances. By hiding actionable details until orders settle, we eliminate front‑running opportunities and prevent short selling.

For this hackathon, we’ve included God Windows — temporary developer/educational views that let judges see the proofs in action. In production, these views would be disabled; they exist here solely to showcase the underlying ZKP mechanics for transparency, debugging, and teaching.

---

## One‑Paragraph Summary
A privacy‑preserving, verified orderbook. Users privately prove ownership of assets before they can place sell orders (stopping short selling) and place orders on a private side where actionable details are hidden (frustrating front‑running). A public side is shown in parallel as a control, where front‑running attempts may succeed. The God Windows reveal proof steps, commitments/nullifiers, and off‑chain logs so you can see the machinery normally kept private.

---

## What To Look For (Evaluation Checklist)
- Private vs Public behavior contrast is clear in the UI.
- Front‑running simulator:
  - Private side attempts fail due to obfuscated actionable details.
  - Public side attempts can succeed.
- Short selling prevention:
  - Sell requires prior ZK ownership verification; balances remain hidden.
- God Windows (dev‑only) make ZK flows visible for education, not production.

---

## Demo Script (2–3 minutes)
1) Start services
```bash
# in repo root
yarn mock-wallet   # port 3001
yarn proof-server  # port 3000 (optional demo logs)
yarn start         # app at http://localhost:8080
```
2) In the UI
- Connect Wallet.
- Verify Ownership for TOKEN‑X (or TOKEN‑Y).
- Place a Sell order on the Private side.
- Open the Front‑Running Simulator and attempt on both sides:
  - Private side should fail to front‑run.
  - Public side may succeed.
- Toggle God Windows to observe:
  - ZK circuit outputs and proof steps,
  - Active/used nullifiers,
  - Off‑chain logs (dev/demo only).

---

## How It Works
- Zero‑Knowledge ownership verification enforces that only asset owners can sell, without revealing balances.
- Obfuscated private orderbook hides actionable details, mitigating MEV/front‑running.
- Public orderbook included side‑by‑side strictly for comparison during the demo.

---

## Contracts (Compact 0.15)
- `contracts/AssetVerification.compact`
  - `checkVerification(owner, assetId, proofHash, currentTime)` enforces expiry; safe map access.
- `contracts/ObfuscatedOrderbook.compact`
  - Imports `checkVerification` at top‑level; passes `currentTime` in `placeOrder`.
- `contracts/SilentOrderbook.compact`
  - No change required.

Design guardrails use 0.14 semantics as policy: explicit `disclose(...)`, `[]` unit returns, TS‑style loops, implicit `Cell`, stdlib import.

---

## Tech Stack
- Frontend: Static web UI, Mesh SDK integration, God Windows (`public/`).
- Backend: Mock wallet/API (`src/api/`), optional proof server for demo logging.
- Contracts: Midnight Compact 0.15 (`contracts/`).

---

## Security and Ethics Note
- God Windows and proof logs intentionally reveal normally private internals solely for demos and debugging. They are disabled or removed in production.
- API request signing (optional) is supported in the mock server to prevent tampering during demos.

Env example: `.env.example` includes `SIGNING_MODE`, `ED25519_*`, `HMAC_KEY_BASE64`, `DOMAIN_TAG`, `SKEW_SECS`, `NONCE_TTL_SECS`.

---

## Setup & Run
- Prereqs: Node 14+, Yarn.
- Install: `yarn install`
- Run: `yarn mock-wallet`, (optional) `yarn proof-server`, then `yarn start`.
- Open: http://localhost:8080

Contracts quickstart and API details are in `README.md`.

---

## Roadmap (Post‑Hackathon)
- Connect to Midnight DevNet and deploy contracts.
- Replace mocks with full ZK proof generation and on‑chain settlement.
- Extend order types and matching logic; add fees and real token economics.
- Hardening: signed requests everywhere, telemetry, and audit pass.

---

## Optional Research Teaser — myAlice (Cross‑Model Memory Portability)

Separate from SilentLedger, our ongoing myAlice work explores AI persona continuity across competing model backends using GitHub‑backed persistent memory. Highlights:

- Portable, versioned memory store (Git) enabling auditable, reproducible agent state.
- Live migration of an AI agent’s working context/persona between models while retaining continuity.
- Human‑in‑the‑loop curation via PRs/issues for transparent oversight of agent memory.
- Relevance to Midnight: tamper‑evident logs and selective disclosure concepts parallel our on‑chain privacy posture.

Statement of belief: To the best of our knowledge and resources, our team has pioneered a practical demonstration of cross‑model continuity of an AI agent’s “essence” (personality, memory, contextual behavior, decision heuristics) using a Git‑backed persistence layer. We cannot conclusively prove novelty today, but we present this work in good faith as a novel direction that informs our approach to verifiable, privacy‑preserving state.

Note: myAlice is a separate research track; links and materials available upon request.

---

Thank you for your time and consideration!

— SilentLedger Team
