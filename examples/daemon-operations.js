// Daemon operations examples for UltraNoteI-API
// This file demonstrates daemon-specific operations

const XUNI = require('../index');

// Initialize the API client
const xuni = new XUNI({
  daemonHost: 'http://localhost',
  walletHost: 'http://localhost', 
  daemonRpcPort: 43000,
  walletRpcPort: 3333,
  timeout: 10000
});

async function demonstrateDaemonOperations() {
  console.log('=== UltraNoteI-API Daemon Operations Examples ===\n');

  try {
    // 1. Get blockchain information
    console.log('1. Getting blockchain information...');
    const info = await xuni.info();
    console.log('Blockchain Info:', info);
    console.log('---\n');

    // 2. Get block count
    console.log('2. Getting block count...');
    const count = await xuni.count();
    console.log('Block Count:', count);
    console.log('---\n');

    // 3. Get current height
    console.log('3. Getting current block height...');
    const height = await xuni.height();
    console.log('Current Height:', height);
    console.log('---\n');

    // 4. Get currency ID
    console.log('4. Getting currency ID...');
    const currencyId = await xuni.currencyId();
    console.log('Currency ID:', currencyId);
    console.log('---\n');

    // 5. Get last block header
    console.log('5. Getting last block header...');
    const lastHeader = await xuni.lastBlockHeader();
    console.log('Last Block Header:', lastHeader);
    console.log('---\n');

    // 6. Get block hash by height (latest block)
    console.log('6. Getting block hash for current height...');
    const blockHash = await xuni.blockHashByHeight(height);
    console.log('Block Hash for height', height, ':', blockHash);
    console.log('---\n');

    // 7. Get block header by hash
    console.log('7. Getting block header by hash...');
    const blockHeader = await xuni.blockHeaderByHash(blockHash);
    console.log('Block Header:', blockHeader);
    console.log('---\n');

    // 8. Get block by hash
    console.log('8. Getting full block by hash...');
    const block = await xuni.block(blockHash);
    console.log('Full Block (simplified):', {
      hash: block.hash,
      height: block.height,
      timestamp: block.timestamp,
      transactions: block.transactions ? block.transactions.length : 0
    });
    console.log('---\n');

    // 9. Get multiple blocks
    console.log('9. Getting multiple blocks (from current height - 5)...');
    const blocks = await xuni.blocks(Math.max(0, height - 5));
    console.log('Blocks retrieved:', blocks.length);
    console.log('First block height:', blocks[0]?.height);
    console.log('Last block height:', blocks[blocks.length - 1]?.height);
    console.log('---\n');

    // 10. Get transaction pool
    console.log('10. Getting transaction pool...');
    const transactionPool = await xuni.transactionPool();
    console.log('Transaction Pool Size:', transactionPool.length);
    if (transactionPool.length > 0) {
      console.log('First transaction in pool:', transactionPool[0].hash);
    }
    console.log('---\n');

    console.log('✅ Daemon operations demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('This might be due to:');
    console.error('- Daemon not running or accessible');
    console.error('- Invalid block height or hash');
    console.error('- Network connectivity issues');
    console.error('- RPC timeout (increase timeout if needed)');
  }
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateDaemonOperations();
}

module.exports = { xuni, demonstrateDaemonOperations };
