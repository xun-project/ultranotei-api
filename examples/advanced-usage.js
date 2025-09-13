// Advanced usage examples for UltraNoteI-API
// This file demonstrates complex operations and patterns

const XUNI = require('../index');

// Initialize the API client
const xuni = new XUNI({
  daemonHost: 'http://localhost',
  walletHost: 'http://localhost', 
  daemonRpcPort: 43000,
  walletRpcPort: 3333,
  timeout: 15000
});

async function demonstrateAdvancedUsage() {
  console.log('=== UltraNoteI-API Advanced Usage Examples ===\n');

  try {
    // 1. Transaction with payment ID and message
    console.log('1. Creating transaction with payment ID and message...');
    const paymentId = '0ab1cdef0123456789abcdef0123456789abcdef0123456789abcdef01234567';
    
    const transactionResult = await xuni.send({
      transfers: [{
        address: 'xuni7Xd3NBbBiQNvv7vMLXmGMHyS8AVB6EhWoHo5EbGfR2Ki9pQnRTfEBt3YxYEVqpUCyJgvPjBYHp8N2yZwA7dqb4PjaGWuvs4',
    amount: 1000000, // 1.0 XUNI (6 decimal places)
        message: 'Payment for services rendered - Invoice #12345'
      }],
      paymentId: paymentId,
      mixIn: 6, // Higher privacy
      fee: 20000, // Custom fee
      unlockHeight: 0 // Immediate unlock
    });
    
    console.log('Transaction created successfully:');
    console.log('- Transaction Hash:', transactionResult.transactionHash);
    console.log('- Fee:', transactionResult.fee);
    console.log('---\n');

    // 2. Batch operations - get multiple pieces of information
    console.log('2. Performing batch operations...');
    const [status, balance, height, info] = await Promise.all([
      xuni.status(),
      xuni.balance(),
      xuni.height(),
      xuni.info()
    ]);

    console.log('Batch results:');
    console.log('- Status:', status.blockCount, 'blocks synced');
    console.log('- Balance:', balance.available, 'available,', balance.locked, 'locked');
    console.log('- Height:', height);
    console.log('- Network Difficulty:', info.difficulty);
    console.log('---\n');

    // 3. Transaction monitoring with filtering
    console.log('3. Monitoring transactions with filtering...');
    
    // Get recent transaction hashes
    const transactionHashes = await xuni.getTransactionHashes({
      firstBlockIndex: Math.max(0, height - 10), // Last 10 blocks
      blockCount: 10,
      addresses: [] // Empty array = all addresses
    });

    console.log('Recent transactions (last 10 blocks):', transactionHashes.length);
    
    if (transactionHashes.length > 0) {
      // Get details for first 3 transactions
      const transactionDetails = await Promise.all(
        transactionHashes.slice(0, 3).map(hash => 
          xuni.getTransaction(hash).catch(() => ({ hash, error: 'Failed to fetch' }))
        )
      );
      
      console.log('Sample transaction details:');
      transactionDetails.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.hash}: ${tx.amount || 'N/A'} XUNI`);
      });
    }
    console.log('---\n');

    // 4. Integrated address usage
    console.log('4. Working with integrated addresses...');
    
    const regularAddress = 'xuni7Xd3NBbBiQNvv7vMLXmGMHyS8AVB6EhWoHo5EbGfR2Ki9pQnRTfEBt3YxYEVqpUCyJgvPjBYHp8N2yZwA7dqb4PjaGWuvs4';
    const integratedAddress = await xuni.createIntegrated(regularAddress, paymentId);
    
    console.log('Regular Address:', regularAddress);
    console.log('Integrated Address:', integratedAddress);
    console.log('---\n');

    // 5. Advanced error handling with custom wrapper
    console.log('5. Advanced error handling with custom wrapper...');
    
    async function safeApiCall(apiCall, defaultResponse = null) {
      try {
        return await apiCall();
      } catch (error) {
        console.warn('API call failed:', error.message);
        return defaultResponse;
      }
    }

    // Safe batch calls that won't fail entirely if one call fails
    const safeResults = await Promise.all([
      safeApiCall(() => xuni.status(), { error: 'Status unavailable' }),
      safeApiCall(() => xuni.balance(), { error: 'Balance unavailable' }),
      safeApiCall(() => xuni.height(), 0)
    ]);

    console.log('Safe API results:');
    console.log('- Status:', safeResults[0].blockCount || 'Unavailable');
    console.log('- Balance:', safeResults[1].available || 'Unavailable');
    console.log('- Height:', safeResults[2]);
    console.log('---\n');

    // 6. Performance monitoring
    console.log('6. Performance monitoring example...');
    
    async function timedApiCall(apiCall, operationName) {
      const start = Date.now();
      try {
        const result = await apiCall();
        const duration = Date.now() - start;
        console.log(`${operationName}: ${duration}ms`);
        return { result, duration, success: true };
      } catch (error) {
        const duration = Date.now() - start;
        console.log(`${operationName}: ${duration}ms (failed)`);
        return { error, duration, success: false };
      }
    }

    const timedResults = await Promise.all([
      timedApiCall(() => xuni.status(), 'Status check'),
      timedApiCall(() => xuni.balance(), 'Balance check'),
      timedApiCall(() => xuni.height(), 'Height check')
    ]);

    const totalTime = timedResults.reduce((sum, r) => sum + r.duration, 0);
    const successfulCalls = timedResults.filter(r => r.success).length;
    
    console.log(`Performance summary: ${successfulCalls}/3 successful, ${totalTime}ms total`);
    console.log('---\n');

    console.log('✅ Advanced usage demonstration completed successfully!');
    console.log('\nAdvanced patterns demonstrated:');
    console.log('1. Complex transaction creation');
    console.log('2. Batch parallel operations');
    console.log('3. Transaction monitoring with filtering');
    console.log('4. Integrated address usage');
    console.log('5. Robust error handling wrappers');
    console.log('6. Performance monitoring');

  } catch (error) {
    console.error('❌ Advanced usage demonstration failed:', error.message);
    console.error('This might be due to specific wallet/daemon state requirements');
  }
}

// Utility function for advanced usage
function createPaymentId() {
  return Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateAdvancedUsage();
}

module.exports = { 
  xuni, 
  demonstrateAdvancedUsage,
  safeApiCall: async (apiCall, defaultResponse = null) => {
    try {
      return await apiCall();
    } catch (error) {
      console.warn('API call failed:', error.message);
      return defaultResponse;
    }
  },
  timedApiCall: async (apiCall, operationName) => {
    const start = Date.now();
    try {
      const result = await apiCall();
      const duration = Date.now() - start;
      return { result, duration, success: true };
    } catch (error) {
      const duration = Date.now() - start;
      return { error, duration, success: false };
    }
  },
  createPaymentId
};
