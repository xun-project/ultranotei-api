// Wallet operations examples for UltraNoteI-API
// This file demonstrates wallet-specific operations

const XUNI = require('../index');

// Initialize the API client
const xuni = new XUNI({
  daemonHost: 'http://localhost',
  walletHost: 'http://localhost', 
  daemonRpcPort: 43000,
  walletRpcPort: 3333,
  timeout: 15000 // 15 second timeout for wallet operations
});

async function demonstrateWalletOperations() {
  console.log('=== UltraNoteI-API Wallet Operations Examples ===\n');

  try {
    // 1. Create a new address
    console.log('1. Creating a new address...');
    const newAddress = await xuni.createAddress();
    console.log('New Address Created:', newAddress);
    console.log('---\n');

    // 2. Get all addresses
    console.log('2. Getting all wallet addresses...');
    const addresses = await xuni.getAddresses();
    console.log('All Addresses:', addresses);
    console.log('---\n');

    // 3. Get balance for a specific address
    if (addresses && addresses.length > 0) {
      console.log('3. Getting balance for first address...');
      const addressBalance = await xuni.getBalance(addresses[0]);
      console.log('Balance for', addresses[0], ':', addressBalance);
      console.log('---\n');
    }

    // 4. Get view secret key
    console.log('4. Getting view secret key...');
    const viewKey = await xuni.getViewSecretKey();
    console.log('View Secret Key:', viewKey);
    console.log('---\n');

    // 5. Get spend keys for an address
    if (addresses && addresses.length > 0) {
      console.log('5. Getting spend keys for first address...');
      const spendKeys = await xuni.getSpendKeys(addresses[0]);
      console.log('Spend Keys for', addresses[0], ':', spendKeys);
      console.log('---\n');
    }

    // 6. Get unlocked outputs
    console.log('6. Getting unlocked outputs...');
    const outputs = await xuni.outputs();
    console.log('Unlocked Outputs:', outputs);
    console.log('---\n');

    // 7. Optimize wallet (combine outputs)
    console.log('7. Optimizing wallet (combining outputs)...');
    const optimizeResult = await xuni.optimize();
    console.log('Optimization Result:', optimizeResult);
    console.log('---\n');

    // 8. Store wallet to disk
    console.log('8. Storing wallet to disk...');
    const storeResult = await xuni.store();
    console.log('Store Result:', storeResult);
    console.log('---\n');

    // 9. Create integrated address
    if (addresses && addresses.length > 0) {
      console.log('9. Creating integrated address...');
      const paymentId = '0ab1cdef0123456789abcdef0123456789abcdef0123456789abcdef01234567';
      const integratedAddress = await xuni.createIntegrated(addresses[0], paymentId);
      console.log('Integrated Address:', integratedAddress);
      console.log('---\n');
    }

    console.log('✅ Wallet operations demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('This might be due to:');
    console.error('- Wallet not running or accessible');
    console.error('- Insufficient permissions');
    console.error('- Invalid address format');
    console.error('- Network connectivity issues');
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateWalletOperations();
}

module.exports = { xuni, demonstrateWalletOperations };
