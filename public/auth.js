/**
 * SilentLedger — demoLand Authentication Module
 * localStorage-based auth following the DIDzMonolith auth standard.
 * 8 auth methods: email, pgp-key, yubikey, did-wallet, trezor, biometric, chrome-oauth, brave-oauth
 */

const SL_STORAGE_KEY = 'silentledger_demo_users';
const SL_SESSION_KEY = 'silentledger_session';

// ─── Storage helpers ────────────────────────────────────────

function slReadUsers() {
  try { return JSON.parse(localStorage.getItem(SL_STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function slWriteUsers(users) {
  localStorage.setItem(SL_STORAGE_KEY, JSON.stringify(users));
}

function slGetSession() {
  try { return JSON.parse(localStorage.getItem(SL_SESSION_KEY)); }
  catch { return null; }
}

function slSetSession(session) {
  localStorage.setItem(SL_SESSION_KEY, JSON.stringify(session));
}

function slClearSession() {
  localStorage.removeItem(SL_SESSION_KEY);
}

// ─── Auth actions ───────────────────────────────────────────

function slSignup(data) {
  const users = slReadUsers();
  const exists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase());
  if (exists) throw new Error(`An account with email "${data.email}" already exists.`);

  users.push(data);
  slWriteUsers(users);

  const session = {
    userId: 'demo-' + data.email,
    displayName: data.firstName + ' ' + data.lastName,
    email: data.email,
    authMethod: data.signupMethod,
    authenticatedAt: new Date().toISOString(),
    publicKey: '0xDEMO_PK_' + data.email.replace(/[@.]/g, ''),
  };
  slSetSession(session);
  console.log('[demoLand] New user signed up: ' + session.displayName + ' (' + data.email + ')');
  return session;
}

function slLogin(method, email) {
  const users = slReadUsers();
  const found = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

  const session = {
    userId: found ? 'demo-' + found.email : 'user-001',
    displayName: found ? found.firstName + ' ' + found.lastName : 'Demo Trader',
    email: found ? found.email : 'demo@silentledger.io',
    authMethod: method,
    authenticatedAt: new Date().toISOString(),
    publicKey: '0xDEMO_PK_silentledger_default',
  };
  slSetSession(session);
  return session;
}

function slLogout() {
  slClearSession();
  window.location.href = '/login.html';
}

// ─── Auth gate (call from pages that need auth) ─────────────

function slRequireAuth() {
  const session = slGetSession();
  if (!session) {
    window.location.href = '/login.html';
    return null;
  }
  return session;
}

// ─── Simulation sequences ───────────────────────────────────

const SL_AUTH_SEQUENCES = {
  'email':        ['Deriving Argon2id key from credentials...', 'Key derived successfully', 'Authenticating...', 'Session established!'],
  'pgp-key':      ['Scanning for connected hardware keys...', 'NitroKey Pro 2 detected on USB port', 'Requesting PGP public key...', 'Key fingerprint: 7A4F 2E8C 1B3D 9E6F A08B', 'PGP identity confirmed!'],
  'yubikey':      ['Waiting for YubiKey insertion...', 'YubiKey 5 NFC detected — firmware 5.7.1', 'Initiating FIDO2/WebAuthn challenge...', 'Touch your YubiKey now...', 'ECDSA P-256 attestation verified!'],
  'did-wallet':   ['Connecting to DID wallet...', 'Waiting for wallet approval...', 'DID resolved: did:prism:abc123...xyz789', 'Verifying DID document on Cardano...', 'DID identity verified!'],
  'trezor':       ['Scanning USB ports for Trezor device...', 'Trezor 5 detected — firmware v2.8.1', 'Requesting Ed25519 public key derivation...', 'Please confirm on your Trezor touchscreen...', 'Trezor identity confirmed!'],
  'biometric':    ['Initializing WebAuthn FIDO2 protocol...', 'Requesting biometric authentication...', 'Place your finger on the sensor...', 'Biometric template captured', 'FIDO2 attestation verified!'],
  'chrome-oauth': ['Redirecting to Google sign-in...', 'Waiting for authorization...', 'OAuth token received', 'Google identity confirmed!'],
  'brave-oauth':  ['Connecting to Brave identity service...', 'BAT wallet linked', 'Fetching Brave profile...', 'Brave identity confirmed!'],
};

async function slRunSimulation(method, statusCallback) {
  const steps = SL_AUTH_SEQUENCES[method] || ['Connecting...', 'Done!'];
  for (const msg of steps) {
    statusCallback(msg);
    await new Promise(r => setTimeout(r, 900));
  }
}
