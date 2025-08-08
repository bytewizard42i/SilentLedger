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
