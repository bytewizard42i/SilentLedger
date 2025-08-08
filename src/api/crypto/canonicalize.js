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
