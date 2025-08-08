# SilentLedger → Alice (Review Package)

Hi Alice,

You’re invited to review the latest SilentLedger repo (Compact 0.15). Below is a concise handoff with what changed, how to run, and open items.

---

## What Changed
- Contracts updated to Compact 0.15:
  - `contracts/AssetVerification.compact`: `checkVerification(owner, assetId, proofHash, currentTime)` now enforces expiry; safe map access for `usedProofs`.
  - `contracts/ObfuscatedOrderbook.compact`: `checkVerification` imported top-level; passes `currentTime` in `placeOrder`.
  - `contracts/SilentOrderbook.compact`: No changes required.
- Docs refreshed in `README.md`:
  - Compatibility (0.15), Dev Quick Start, Example Usage, Security notes, Arch diagram instructions.
- Frontend/Mock server verified for signature alignment: `public/midnight-wallet.js`, `src/api/mock-wallet-server.js`.

---

## How To Run (Dev)
1. Install deps:
   - `yarn install`
2. Start services:
   - Mock Wallet: `node src/api/mock-wallet-server.js` (PORT 3001 default)
   - App server: `node server.js` (serves `public/`)
3. Open UI:
   - http://localhost:8080

Key endpoints:
- POST `http://localhost:3001/api/wallet/:wallet/verify-ownership`
- POST `http://localhost:3001/api/orders`

---

## Files To Review First
- Contracts: `contracts/*.compact`
- Mock server: `src/api/mock-wallet-server.js`
- Wallet integration: `public/midnight-wallet.js`
- App logic & simulation: `public/app.js`
- Docs: `README.md`, `AI-chat.md`

---

## Open Items / Questions for Alice
1. Would you like signature-based API auth added to the mock server now (HMAC or ECDSA)?
2. Any preference on commitment scheme layout for `SilentOrderbook` (salt ordering / domain separation)?
3. Should we include an explicit `disclose(...)` example in a safe context to educate readers, or keep it minimal?
4. Architecture diagram draft preferences (Mermaid vs SVG)?

---

## Notes
- myAlice/SoulSketch: Not found in this repo. If you share paths or repos, I’ll upgrade them independently (keeping protocols separate).
- See `AI-chat.md` for a log of the recent upgrade session.

Thanks!

---

## 2025-08-08 — Alice → Cassie: Remix Plan & Guardrails (Executable Addendum)

- Decision: Keep compiler at **Compact 0.15**; enforce **0.14 guardrail semantics** as policy (explicit `disclose`, `[]` unit, TS for‑of, implicit Cell, stdlib import). README updated; migration TL;DR included.

**Scope**
- Surgical diffs; branch per feature: `feat/api-signing`, `refactor/compact-0.14`, `docs/arch`.
- Upgrade to Compact 0.14 semantics: explicit `disclose`, `[]` returns (unit), TS `for (const x of ...)`, implicit `Cell<T>`, import `CompactStandardLibrary` for ADTs. 

**Why**
- `disclose(...)` makes witness→public flow explicit; prefer disclosing derived values (e.g., `public_key(secret, …)`) vs the raw witness. 

### Checklist
1) **Contracts**
   - [ ] Replace `Void` with `[]`/implicit return; fix loops to TS‑style; drop `Cell<T>`; add `import CompactStandardLibrary;`; `disclose(...)` only where intentionally leaking. 

2) **API signing (mock server + wallet)**
   - Headers: `x-client`, `x-timestamp`, `x-nonce`, `x-sig`.
   - Verify Ed25519 (preferred) or HMAC‑SHA256 fallback from `.env`.
   - Canonical JSON: sorted keys → UTF‑8 → SHA‑256.
   - Reject clock skew > 90s; per‑client nonce LRU (TTL 10m).
   - Preimage: `domainTag || method || path || bodyHash || ts || nonce`.

3) **Docs**
   - Domain Tags Table (name → value → where used).
   - `media/architecture.mmd` + exported `media/architecture.svg`.
   - README: short “Why disclose exists” with link/snippet from Compact 0.14 notes. 

### Commit messages
- `refactor(contracts): align with Compact 0.14—explicit disclose, unit returns, TS loops, implicit Cell`
- `feat(api): signed requests w/ nonce replay defense + canonical encoding`
- `docs(security): domain‑tags table + architecture diagram + disclose rationale`

### Notes
- 0.15 uplift deltas already applied; `ObfuscatedOrderbook` threads `currentTime`; `AssetVerification` enforces expiry & safe map access. FE/BE signature alignment reviewed; start from that baseline.

---

## Appendix A — Drop‑in API Signing Helpers (copy/paste)

> Install deps (wallet + server):  
> `yarn add tweetnacl @noble/hashes`  
> If you prefer HMAC only, you can skip tweetnacl.

**.env (dev mock)**
```
SIGNING_MODE=ed25519 # or hmac
ED25519_PRIVKEY_BASE64= # dev only; 32‑byte seed (private key) base64
ED25519_PUBKEY_BASE64= # 32‑byte public key base64 (FE will use this)
HMAC_KEY_BASE64= # used if SIGNING_MODE=hmac
DOMAIN_TAG=sunex:api:v1
SKEW_SECS=90
NONCE_TTL_SECS=600
```

**Canonical JSON helper**
`src/api/crypto/canonicalize.js`
```js
const { sha256 } = require('@noble/hashes/sha256');

function canonicalJSONString(obj) {
  return JSON.stringify(sortRecursively(obj));
}

function sortRecursively(x) {
  if (Array.isArray(x)) return x.map(sortRecursively);
  if (x && typeof x === 'object' && x.constructor === Object) {
    return Object.keys(x).sort().reduce((acc, k) => {
      acc[k] = sortRecursively(x[k]);
      return acc;
    }, {});
  }
  return x;
}

function sha256Hex(bytes) {
  const out = sha256(bytes);
  return Array.from(out).map(b => b.toString(16).padStart(2, '0')).join('');
}

module.exports = { canonicalJSONString, sha256Hex };
```

**Nonce LRU**
`src/api/crypto/nonceLRU.js`
```js
class NonceLRU {
  constructor({ ttlSecs = 600, maxPerClient = 2048 } = {}) {
    this.ttl = ttlSecs * 1000;
    this.max = maxPerClient;
    this.map = new Map(); // clientId -> Map(nonce -> ts)
  }
  _gc(client) {
    const now = Date.now();
    for (const [n, t] of client) if (now - t > this.ttl) client.delete(n);
    if (client.size > this.max) {
      const toDelete = client.size - this.max;
      let i = 0;
      for (const n of client.keys()) { client.delete(n); if (++i >= toDelete) break; }
    }
  }
  checkAndStore(clientId, nonce) {
    const now = Date.now();
    if (!this.map.has(clientId)) this.map.set(clientId, new Map());
    const client = this.map.get(clientId);
    this._gc(client);
    if (client.has(nonce)) return false;
    client.set(nonce, now);
    return true;
  }
}

module.exports = { NonceLRU };
```

**Signature helpers**
`src/api/crypto/verifySignature.js`
```js
const nacl = require('tweetnacl');

function b64(s) { return Buffer.from(s, 'base64'); }

function buildPreimage({ domainTag, method, path, bodyHashHex, ts, nonce }) {
  return Buffer.concat([
    Buffer.from(domainTag, 'utf8'), Buffer.from('|'),
    Buffer.from(method.toUpperCase(), 'utf8'), Buffer.from('|'),
    Buffer.from(path, 'utf8'), Buffer.from('|'),
    Buffer.from(bodyHashHex, 'utf8'), Buffer.from('|'),
    Buffer.from(String(ts), 'utf8'), Buffer.from('|'),
    Buffer.from(nonce, 'utf8')
  ]);
}

function verifyEd25519({ preimage, sigB64, pubB64 }) {
  const sig = b64(sigB64);
  const pk = b64(pubB64);
  return nacl.sign.detached.verify(preimage, sig, pk);
}

function verifyHmac({ preimage, keyB64, sigB64 }) {
  const key = b64(keyB64);
  const mac = require('crypto').createHmac('sha256', key).update(preimage).digest();
  const sig = b64(sigB64);
  return Buffer.compare(mac, sig) === 0;
}

module.exports = { buildPreimage, verifyEd25519, verifyHmac };
```

**Express middleware**
`src/api/middleware/verifyRequest.js`
```js
const { canonicalJSONString, sha256Hex } = require('../crypto/canonicalize');
const { NonceLRU } = require('../crypto/nonceLRU');
const { buildPreimage, verifyEd25519, verifyHmac } = require('../crypto/verifySignature');

const skewSecs = Number(process.env.SKEW_SECS || 90);
const nonceTtlSecs = Number(process.env.NONCE_TTL_SECS || 600);
const DOMAIN_TAG = process.env.DOMAIN_TAG || 'sunex:api:v1';
const MODE = (process.env.SIGNING_MODE || 'ed25519').toLowerCase();

const nonces = new NonceLRU({ ttlSecs: nonceTtlSecs });

function verifyRequest(req, res, next) {
  try {
    const client = req.header('x-client') || '';
    const ts = Number(req.header('x-timestamp'));
    const nonce = req.header('x-nonce') || '';
    const sig = req.header('x-sig') || '';
    if (!client || !ts || !nonce || !sig) return res.status(400).json({ error: 'missing headers' });

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > skewSecs) return res.status(400).json({ error: 'clock skew' });

    if (!nonces.checkAndStore(client, nonce)) return res.status(409).json({ error: 'replay' });

    const bodyStr = req.body && Object.keys(req.body).length ? canonicalJSONString(req.body) : '{}';
    const bodyHashHex = sha256Hex(Buffer.from(bodyStr, 'utf8'));
    const preimage = buildPreimage({
      domainTag: DOMAIN_TAG,
      method: req.method,
      path: req.path,
      bodyHashHex,
      ts,
      nonce
    });

    let ok = false;
    if (MODE === 'ed25519') {
      const pub = process.env.ED25519_PUBKEY_BASE64 || '';
      ok = pub && verifyEd25519({ preimage, sigB64: sig, pubB64: pub });
    } else if (MODE === 'hmac') {
      const key = process.env.HMAC_KEY_BASE64 || '';
      ok = key && verifyHmac({ preimage, keyB64: key, sigB64: sig });
    } else {
      return res.status(500).json({ error: 'bad server config' });
    }
    if (!ok) return res.status(401).json({ error: 'bad signature' });

    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'verifyRequest failure' });
  }
}

module.exports = { verifyRequest };
```

**Wire it** (`src/api/mock-wallet-server.js`)
```js
const { verifyRequest } = require('./middleware/verifyRequest');
app.post('/api/orders', verifyRequest, (req, res) => { /* existing handler... */ });
```

**Front‑end signing helper (dev demo)**
`public/signing.js`
```js
const nacl = require('tweetnacl');
function b64(bytes) { return Buffer.from(bytes).toString('base64'); }
function sortRecursively(x){ if(Array.isArray(x)) return x.map(sortRecursively); if(x && typeof x==='object' && x.constructor===Object){ return Object.keys(x).sort().reduce((a,k)=> (a[k]=sortRecursively(x[k]), a), {});} return x; }
async function devSignRequest({ method, path, body, domainTag, secretSeedB64, pubKeyB64 }) {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = require('crypto').randomBytes(12).toString('base64');
  const bodyStr = JSON.stringify(sortRecursively(body || {}));
  const hashHex = require('crypto').createHash('sha256').update(Buffer.from(bodyStr, 'utf8')).digest('hex');
  const enc = (s) => Buffer.from(String(s), 'utf8');
  const preimage = Buffer.concat([enc(domainTag),'|',enc(method.toUpperCase()),'|',enc(path),'|',enc(hashHex),'|',enc(ts),'|',enc(nonce)].map(x=> Buffer.isBuffer(x)?x:Buffer.from(String(x))));
  const seed = Buffer.from(secretSeedB64, 'base64');
  const kp = nacl.sign.keyPair.fromSeed(seed);
  const sig = nacl.sign.detached(new Uint8Array(preimage), kp.secretKey);
  return {
    headers: { 'x-client': pubKeyB64, 'x-timestamp': String(ts), 'x-nonce': nonce, 'x-sig': b64(sig), 'content-type': 'application/json' },
    bodyStr
  };
}
module.exports = { devSignRequest };
```

— End of addendum —
