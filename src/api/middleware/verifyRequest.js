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
