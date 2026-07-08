const { runStructuralTests } = require('../../midnight-modules/tests/structural-test-helper.cjs');
const path = require('path');

runStructuralTests('AssetVerification', path.join(__dirname, '..', 'build', 'AssetVerification', 'contract', 'index.d.ts'), {
  expected: ['checkVerification', 'revokeVerification', 'verifyOwnership'],
  mustHave: ['verifyOwnership', 'checkVerification', 'revokeVerification'],
});

runStructuralTests('ObfuscatedOrderbook', path.join(__dirname, '..', 'build', 'ObfuscatedOrderbook', 'contract', 'index.d.ts'), {
  expected: ['cancelOrder', 'fillOrders', 'getOrder', 'placeOrder', 'setVerificationContract'],
  mustHave: ['placeOrder', 'fillOrders', 'cancelOrder'],
});

runStructuralTests('SilentOrderbook', path.join(__dirname, '..', 'build', 'SilentOrderbook', 'contract', 'index.d.ts'), {
  expected: ['addOrder', 'cancelOrder', 'matchOrder', 'setDexState'],
  mustHave: ['addOrder', 'matchOrder', 'cancelOrder'],
});
