// Basic usage examples for UltraNoteI-API
// This file demonstrates common operations with the API

const XUNI = require('../index');

// Initialize the API client
const xuni = new XUNI({
  daemonHost: 'http://localhost',
  walletHost: 'http://localhost', 
  daemonRpcPort: 43000,
  walletRpcPort: 3333,
  timeout: 10000 // 10 second timeout
});

async function demonstrateBasicUsage() {
  console.log('=== UltraNoteI-API Basic Usage Examples ===\n');

  try {
    // 1. Get wallet status
    console.log('1. Getting wallet status...');
    const status = await xuni.status();
    console.log('Wallet Status:', status);
    console.log('---\n');

    // 2. Get wallet balance
    console.log('2. Getting wallet balance...');
    const balance = await xuni.balance();
    console.log('Wallet Balance:', balance);
    console.log('---\n');

    // 3. Get block height from daemon
    console.log('3. Getting block height from daemon...');
    const height = await xuni.height();
    console.log('Current Block Height:', height);
    console.log('---\n');

    // 4. Get blockchain information
    console.log('4. Getting blockchain information...');
    const info = await xuni.info();
    console.log('Blockchain Info:', info);
    console.log('---\n');

    // 5. Get addresses in wallet
    console.log('5. Getting wallet addresses...');
    const addresses = await xuni.getAddresses();
    console.log('Wallet Addresses:', addresses);
    console.log('---\n');

    // 6. Get transaction history
    console.log('6. Getting transaction history...');
    const transfers = await xuni.transfers();
    console.log('Transaction History (first 5):', transfers.slice(0, 5));
    console.log('---\n');

    console.log('✅ Basic usage demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('Make sure your UltraNoteI daemon and wallet services are running');
    console.error('and the configuration (hosts, ports) is correct.');
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateBasicUsage();
}

module.exports = { xuni, demonstrateBasicUsage };
