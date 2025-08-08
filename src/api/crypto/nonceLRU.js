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
