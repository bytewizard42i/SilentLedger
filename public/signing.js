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
