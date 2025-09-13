// Error handling examples for UltraNoteI-API
// This file demonstrates proper error handling patterns

const XUNI = require('../index');

// Initialize the API client
const xuni = new XUNI({
  daemonHost: 'http://localhost',
  walletHost: 'http://localhost', 
  daemonRpcPort: 43000,
  walletRpcPort: 3333,
  timeout: 5000
});

async function demonstrateErrorHandling() {
  console.log('=== UltraNoteI-API Error Handling Examples ===\n');

  // Example 1: Handling validation errors
  console.log('1. Demonstrating validation error handling...');
  try {
    // This will fail due to invalid address format
    await xuni.getBalance('invalid-address-format');
  } catch (error) {
    console.log('✅ Caught validation error:', error.message);
    console.log('Error type: Address validation failed');
  }
  console.log('---\n');

  // Example 2: Handling RPC connection errors
  console.log('2. Demonstrating connection error handling...');
  try {
    // Try to connect to non-existent host
    const badXuni = new XUNI({
      daemonHost: 'http://nonexistent-host',
      walletHost: 'http://nonexistent-host',
      daemonRpcPort: 43000,
      walletRpcPort: 3333,
      timeout: 2000 // Short timeout for quick failure
    });
    await badXuni.info();
  } catch (error) {
    console.log('✅ Caught connection error:', error.message);
    console.log('Error type: Network connectivity issue');
  }
  console.log('---\n');

  // Example 3: Handling timeout errors
  console.log('3. Demonstrating timeout error handling...');
  try {
    // This might timeout if services are not running
    await xuni.info();
    console.log('✅ Service is responsive - no timeout occurred');
  } catch (error) {
    if (error.message.includes('timeout') || error.message.includes('RPC timeout')) {
      console.log('✅ Caught timeout error:', error.message);
      console.log('Error type: Request timeout');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
  console.log('---\n');

  // Example 4: Handling method-specific errors
  console.log('4. Demonstrating method-specific error handling...');
  try {
    // This will fail if no transactions exist
    await xuni.getTransaction('0'.repeat(64)); // Invalid hash
  } catch (error) {
    console.log('✅ Caught transaction error:', error.message);
    console.log('Error type: Transaction not found or invalid hash');
  }
  console.log('---\n');

  // Example 5: Graceful degradation pattern
  console.log('5. Demonstrating graceful degradation...');
  try {
    const status = await xuni.status().catch(() => ({ 
      error: 'Unable to get status',
      online: false 
    }));
    
    const balance = await xuni.balance().catch(() => ({
      error: 'Unable to get balance',
      available: 0,
      locked: 0
    }));

    console.log('Application status:');
    console.log('- Service status:', status.error ? 'Offline' : 'Online');
    console.log('- Balance available:', balance.error ? 'Unknown' : balance.available);
    console.log('✅ Application continues running despite partial failures');
    
  } catch (error) {
    console.log('❌ Unexpected critical error:', error.message);
  }
  console.log('---\n');

  // Example 6: Retry pattern for transient errors
  console.log('6. Demonstrating retry pattern...');
  async function withRetry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  try {
    const result = await withRetry(() => xuni.height());
    console.log('✅ Retry successful, height:', result);
  } catch (error) {
    console.log('❌ All retry attempts failed:', error.message);
  }
  console.log('---\n');

  console.log('✅ Error handling demonstration completed!');
  console.log('\nKey takeaways:');
  console.log('1. Always use try/catch with async/await');
  console.log('2. Handle specific error types appropriately');
  console.log('3. Implement graceful degradation');
  console.log('4. Use retry patterns for transient errors');
  console.log('5. Provide meaningful error messages to users');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateErrorHandling();
}

module.exports = { 
  xuni, 
  demonstrateErrorHandling,
  withRetry: async (operation, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};
