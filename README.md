# UltraNoteI-API: JavaScript/Node.js Interface (RPC/API)

[![npm version](https://img.shields.io/npm/v/ultranotei-api.svg)](https://www.npmjs.com/package/ultranotei-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

JavaScript/Node.js interface to UltraNoteI cryptocurrency RPC/API services. This library provides a comprehensive set of methods to interact with UltraNoteI daemon and wallet services.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install ultranotei-api
```

## Quick Start

### Prerequisites
Make sure you have UltraNoteI daemon and wallet services running:

1. **Start the network daemon (ultranoteid):**
```bash
./ultranoteid
```

2. **Start the wallet (ultranoteiwallet):**
```bash
./ultranoteiwallet --rpc-bind-port 3333 --wallet-file my --password PASSWORD
```

### Basic Usage

```javascript
const XUNI = require('ultranotei-api');

// Initialize the API client
const xuni = new XUNI({
  daemonHost: 'http://localhost',
  walletHost: 'http://localhost',
  daemonRpcPort: 43000,
  walletRpcPort: 3333,
  timeout: 5000
});

// Get wallet status
xuni.status()
  .then(status => console.log('Wallet status:', status))
  .catch(error => console.error('Error:', error));

// Send a transaction
xuni.send({
  transfers: [{
    address: 'xuni7Xd3NBbBiQNvv7vMLXmGMHyS8AVB6EhWoHo5EbGfR2Ki9pQnRTfEBt3YxYEVqpUCyJgvPjBYHp8N2yZwA7dqb4PjaGWuvs4',
    amount: 1234567
  }]
})
.then(result => console.log('Transaction successful:', result))
.catch(error => console.error('Transaction failed:', error));
```

## Configuration

The `XUNI` constructor accepts the following configuration options:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `daemonHost` | string | Yes | - | Daemon host URL (http:// or https://) |
| `walletHost` | string | Yes | - | Wallet host URL (http:// or https://) |
| `daemonRpcPort` | number | Yes | - | Daemon RPC port (default: 43000) |
| `walletRpcPort` | number | Conditional | - | Wallet RPC port (required for wallet operations) |
| `timeout` | number | No | 5000 | Request timeout in milliseconds |
| `rpcUser` | string | No | - | RPC authentication username |
| `rpcPassword` | string | No | - | RPC authentication password |

### Default Ports
- **Daemon RPC Port**: 43000
- **Daemon P2P Port**: 42000
- **Wallet RPC Port**: 3333 (configurable)

## API Reference

All API methods return Promises and should be used with `.then()`/`.catch()` or `async`/`await`.

### Wallet RPC Methods (require walletRpcPort)

#### Core Methods
- `height()` - Get last block height
- `balance()` - Get wallet balances  
- `transfers()` - Get all transfers
- `outputs()` - Get unlocked outputs
- `reset()` - Reset wallet cache
- `store()` - Save wallet to disk
- `optimize()` - Combine outputs

#### Transaction Methods
- `send(opts)` - Send transfers
- `payments(paymentId)` - Get incoming payments
- `messages([opts])` - Get transaction messages

#### Advanced Methods
- `createIntegrated(address, paymentId)` - Create integrated address
- `splitIntegrated(address)` - Split integrated address
- `createDeposit(opts)` - Create deposit
- `withdrawDeposit(depositId)` - Withdraw deposit
- `estimateFusion(opts)` - Estimate fusion
- `sendFusionTransaction(opts)` - Send fusion transaction

### Daemon RPC Methods (require daemonRpcPort)

#### Blockchain Methods
- `info()` - Get blockchain information
- `index()` - Get next block height
- `count()` - Get block count
- `currencyId()` - Get currency ID

#### Block Methods
- `blockHashByHeight(height)` - Get block hash by height
- `blockHeaderByHeight(height)` - Get block header by height
- `blockHeaderByHash(hash)` - Get block header by hash
- `lastBlockHeader()` - Get last block header
- `block(hash)` - Get block by hash
- `blocks(height)` - Get blocks from height

#### Transaction Methods
- `transaction(hash)` - Get transaction by hash
- `transactions(txs)` - Get multiple transactions
- `transactionPool()` - Get transaction pool
- `sendRawTransaction(rawTx)` - Send raw transaction

## Examples

### Basic Wallet Operations
```javascript
// Get wallet status and balance
const status = await xuni.status();
const balance = await xuni.balance();
console.log('Status:', status, 'Balance:', balance);

// Create new address
const newAddress = await xuni.createAddress();
console.log('New address:', newAddress);

// Get transaction history
const transfers = await xuni.transfers();
console.log('Transaction history:', transfers);
```

### Sending Transactions
```javascript
// Send basic transaction
const result = await xuni.send({
  transfers: [{
    address: 'xuni7Xd3NBbBiQNvv7vMLXmGMHyS8AVB6EhWoHo5EbGfR2Ki9pQnRTfEBt3YxYEVqpUCyJgvPjBYHp8N2yZwA7dqb4PjaGWuvs4',
    amount: 1000000,
    message: 'Payment for services'
  }],
  mixIn: 6,
  fee: 10000
});
console.log('Transaction result:', result);
```

### Error Handling
```javascript
try {
  const result = await xuni.send({
    transfers: [{
      address: 'invalid-address',
      amount: 1000000
    }]
  });
} catch (error) {
  console.error('Transaction failed:', error);
  // Error: address must be 99-character string beginning with Xuni
}
```

## Error Handling

The API returns Promise rejections with descriptive error messages:

### Validation Errors
- `'address must be 99-character string beginning with Xuni'`
- `'paymentId must be 64-digit hexadecimal string'`
- `'amount must be a raw amount of XUNI (X)'`

### RPC Errors
- `'RPC server error'` - Connection or server issues
- `'RPC timeout'` - Request timeout (5 seconds default)

### Network Errors
- Connection refused
- Host not found
- Connection timeout

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure daemon/wallet services are running
   - Check firewall settings
   - Verify host and port configuration

2. **Authentication errors**
   - Check RPC username/password if required
   - Verify daemon/wallet RPC authentication settings

3. **Timeout errors**
   - Increase timeout setting for slow connections
   - Check network connectivity

4. **Method not found**
   - Ensure correct method name (check API reference)
   - Verify required parameters are provided

### Debug Mode
For debugging, you can enable detailed logging:

```javascript
const xuni = new XUNI({
  daemonHost: 'http://localhost',
  walletHost: 'http://localhost',
  daemonRpcPort: 43000,
  walletRpcPort: 3333,
  timeout: 10000 // 10 second timeout
});

// Add request logging
const originalRequest = xuni.request;
xuni.request = function(...args) {
  console.log('RPC Request:', args);
  return originalRequest.apply(this, args);
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Setup
```bash
git clone https://github.com/xun-project/ultranotei-api.git
cd ultranotei-api
npm install
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check existing issues for solutions
- Review the API documentation

## Version Compatibility

| API Version | UltraNoteI Daemon | UltraNoteI Wallet |
|-------------|-------------------|-------------------|
| 4.1.0       | v2.0.0+           | v2.0.0+           |
| 4.0.0       | v1.5.0+           | v1.5.0+           |

Always ensure your UltraNoteI services are compatible with the API version you're using.
