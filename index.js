module.exports = XUNI;

const http = require('http');
const https = require('https');

const MAX_MIXIN = 10;
const MIN_MIXIN = 2;
const DEFAULT_UNLOCK_HEIGHT = 10;
const DEFAULT_FEE = 10000; // raw X
const DEFAULT_CHARACTER_FEE = 1000; // raw X

const err = {
  nonNeg: ' must be a non-negative integer',
  hex: ' must be a hexadecimal string',
  opts: 'opts must be object',
  hex64: ' must be 64-digit hexadecimal string',
  addr: ' must be 99-character string beginning with Xuni',
  raw: ' must be a raw amount of XUNI (X)',
  trans: ' must be a transfer object { address: 99-character string beginning with Xuni, amount: raw amount of XUNI (X), message: optional string }',
  arr: ' must be an array',
  str: ' must be a string'
};

function XUNI(params) {
  if (!params) throw 'parameters are required';
  if (typeof params != 'object') throw 'parameters must be a JSON object';
  if (!params.daemonHost) params.daemonHost = '127.0.0.1';
  if (!params.walletHost) params.walletHost = '127.0.0.1';
  
  const parseDaemon = params.daemonHost.match(/^([^:]*):\/\/(.*)$/);
  const parseWallet = params.walletHost.match(/^([^:]*):\/\/(.*)$/);
  
  if (parseDaemon[1] === 'http') this.daemonProtocol = http;
  else if (parseDaemon[1] === 'https') this.daemonProtocol = https;
  else throw 'Daemon host must begin with http(s)://';

  if (parseWallet[1] === 'http') this.walletProtocol = http;
  else if (parseWallet[1] === 'https') this.walletProtocol = https;
  else throw 'Wallet host must begin with http(s)://';

  this.daemonHost = parseDaemon[2];
  this.walletHost = parseWallet[2];
  this.walletRpcPort = params.walletRpcPort;
  this.daemonRpcPort = params.daemonRpcPort;
  this.timeout = params.timeout || 5000;
  this.auth = !params.rpcUser ? '': `${params.rpcUser}:${params.rpcPassword ? params.rpcPassword:''}`;
}

// Wallet RPC -- UltraNote Infinity

function wrpc(that, method, params, resolve, reject) {
  request(that.walletProtocol, that.walletHost, that.walletRpcPort, that.auth, that.timeout, buildRpc(method, params), '/json_rpc', resolve, reject);
}

XUNI.prototype.outputs = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'get_outputs', {}, resolve, reject);
  });
};

XUNI.prototype.height = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'get_height', {}, resolve, reject);
  });
};

XUNI.prototype.balance = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'getbalance', {}, resolve, reject);
  });
};

XUNI.prototype.messages = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) opts = {};
    else if (!isUndefined(opts.firstTxId) && !isNonNegative(opts.firstTxId)) reject('firstTxId' + err.nonNeg);
    else if (!isUndefined(opts.txLimit) && !isNonNegative(opts.txLimit)) reject('txLimit' + err.nonNeg);
    else {
      obj = {
        first_tx_id: opts.firstTxId,
        tx_limit: opts.txLimit
      };
      wrpc(this, 'get_messages', obj, resolve, reject);
    }
  });
};

XUNI.prototype.payments = function (paymentId) { // incoming payments
  return new Promise((resolve, reject) => {
    if (!isHex64String(paymentId)) reject('paymentId' + err.hex64);
    else wrpc(this, 'get_payments', { payment_id: paymentId }, resolve, reject);
  });
};

XUNI.prototype.transfers = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'get_transfers', {}, resolve, reject);
  });
};

XUNI.prototype.store = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'store', {}, resolve, reject);
  });
};

XUNI.prototype.reset = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'reset', {}, resolve, reject);
  });
};

XUNI.prototype.optimize = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'optimize', {}, resolve, reject);
  });
};

XUNI.prototype.send = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (isUndefined(opts.transfers) || !arrayTest(opts.transfers, isTransfer)) reject('transfers' + err.arr + ' of transfers each of which' + err.trans);
    else if (!isUndefined(opts.paymentId) && !isHex64String(opts.paymentId)) reject('paymentId' + err.hex64);
    else {
      if (isUndefined(opts.mixIn)) opts.mixIn = MIN_MIXIN;
      if (!(opts.mixIn >= MIN_MIXIN && opts.mixIn <= MAX_MIXIN)) reject(MIN_MIXIN + ' <= mixIn <= ' + MAX_MIXIN);
      else {
        if (isUndefined(opts.unlockHeight)) opts.unlockHeight = DEFAULT_UNLOCK_HEIGHT;
        if (!isNonNegative(opts.unlockHeight)) reject('unlockHeight' + err.nonNeg);
        else {
          if (isUndefined(opts.fee)) {
            opts.fee = DEFAULT_FEE;
            opts.transfers.forEach((transfer) => {
              opts.fee += (!isUndefined(transfer.message) ? transfer.message.length * DEFAULT_CHARACTER_FEE : 0);
            });
          }
          if (!isNonNegative(opts.fee)) reject('fee' + err.raw);
          else {
            const obj = {
              destinations: opts.transfers,
              mixin: opts.mixIn,
              fee: opts.fee,
              unlock_time: opts.unlockHeight,
              payment_id: opts.paymentId
            };
            wrpc(this, 'transfer', obj, resolve, reject);
          }
        }
      }
    }
  });
};

// Wallet RPC -- walletd

XUNI.prototype.resetOrReplace = function (viewSecretKey) {
  return new Promise((resolve, reject) => {
    if (!isUndefined(viewSecretKey) && !isHex64String(viewSecretKey)) reject('viewSecretKey' + err.hex64);
    else wrpc(this, 'reset', { viewSecretKey: viewSecretKey }, resolve, reject);
  });
};

XUNI.prototype.status = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'getStatus', {}, resolve, reject);
  });
};

XUNI.prototype.getBalance = function (address) {
  return new Promise((resolve, reject) => {
    if (isUndefined(address) || !isAddress(address)) reject('address' + err.addr);
    else wrpc(this, 'getBalance', { address: address }, resolve, reject);
  });
};

XUNI.prototype.createAddress = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'createAddress', {}, resolve, reject);
  });
};

XUNI.prototype.deleteAddress = function (address) {
  return new Promise((resolve, reject) => {
    if (isUndefined(address) || !isAddress(address)) reject('address' + err.addr);
    wrpc(this, 'deleteAddress', { address: address }, resolve, reject);
  });
};

XUNI.prototype.getAddresses = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'getAddresses', {}, resolve, reject);
  });
};

XUNI.prototype.getViewSecretKey = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'getViewKey', {}, resolve, reject);
  });
};

XUNI.prototype.getSpendKeys = function (address) {
  return new Promise((resolve, reject) => {
    if (isUndefined(address) || !isAddress(address)) reject('address' + err.addr);
    else wrpc(this, 'getSpendKeys', { address: address }, resolve, reject);
  });
};

XUNI.prototype.getBlockHashes = function (firstBlockIndex, blockCount) {
  return new Promise((resolve, reject) => {
    if (isUndefined(firstBlockIndex) || !isNonNegative(firstBlockIndex)) reject('firstBlockIndex' + err.nonNeg);
    else if (isUndefined(blockCount) || !isNonNegative(blockCount)) reject('blockCount' + err.nonNeg);
    else wrpc(this, 'getBlockHashes', { firstBlockIndex: firstBlockIndex, blockCount: blockCount }, resolve, reject);
  });
};

XUNI.prototype.getTransaction = function (hash) {
  return new Promise((resolve, reject) => {
    if (!isHex64String(hash)) reject('hash' + err.hex64);
    else wrpc(this, 'getTransaction', { transactionHash: hash }, resolve, reject);
  });
};

XUNI.prototype.getUnconfirmedTransactionHashes = function (addresses) {
  return new Promise((resolve, reject) => {
    if (!isUndefined(addresses) && !arrayTest(addresses, isAddress)) reject('addresses' + err.arr + ' of addresses each of which' + err.addr);
    else wrpc(this, 'getUnconfirmedTransactionHashes', { addresses: addresses }, resolve, reject);
  });
};

XUNI.prototype.getTransactionHashes = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (!isNonNegative(opts.blockCount)) reject('blockCount' + err.nonNeg);
    else if (isUndefined(opts.firstBlockIndex) && isUndefined(opts.blockHash)) reject('either firstBlockIndex or blockHash is required');
    else if (!isUndefined(opts.firstBlockIndex) && !isNonNegative(opts.firstBlockIndex)) reject('firstBlockIndex' + err.nonNeg);
    else if (!isUndefined(opts.blockHash) && !isHex64String(opts.blockHash)) reject('blockHash' + err.hex64);
    else if (!isUndefined(opts.paymentId) && !isHex64String(opts.paymentId)) reject('paymentId' + err.hex64);
    else if (!isUndefined(opts.addresses) && !arrayTest(opts.addresses, isAddress)) reject('addresses' + err.arr + ' of addresses each of which' + err.addr);
    else wrpc(this, 'getTransactionHashes', opts, resolve, reject);
  });
};

XUNI.prototype.getTransactions = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (!isNonNegative(opts.blockCount)) reject('blockCount' + err.nonNeg);
    else if (isUndefined(opts.firstBlockIndex) && isUndefined(opts.blockHash)) reject('either firstBlockIndex or blockHash is required');
    else if (!isUndefined(opts.firstBlockIndex) && !isNonNegative(opts.firstBlockIndex)) reject('firstBlockIndex' + err.nonNeg);
    else if (!isUndefined(opts.blockHash) && !isHex64String(opts.blockHash)) reject('blockHash' + err.hex64);
    else if (!isUndefined(opts.paymentId) && !isHex64String(opts.paymentId)) reject('paymentId' + err.hex64);
    else if (!isUndefined(opts.addresses) && !arrayTest(opts.addresses, isAddress)) reject('addresses' + err.arr + ' of addresses each of which' + err.addr);
    else wrpc(this, 'getTransactions', opts, resolve, reject);
  });
};

XUNI.prototype.sendTransaction = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (isUndefined(opts.transfers) || !arrayTest(opts.transfers, isTransfer)) reject('transfers' + err.arr + ' of transfers each of which' + err.trans);
    else if (!isUndefined(opts.addresses) && !arrayTest(opts.addresses, isAddress)) reject('addresses' + err.arr + ' of addresses each of which' + err.addr);
    else if (!isUndefined(opts.changeAddress) && !isAddress(opts.changeAddress)) reject('changeAddress' + err.addr);
    else if (!isUndefined(opts.paymentId) && !isHex64String(opts.paymentId)) reject('paymentId' + err.hex64);
    else if (!isUndefined(opts.extra) && !isString(opts.extra)) reject('extra' + err.str);
    else {
      opts.sourceAddresses = opts.addresses; // delete opts.addresses;
      if (isUndefined(opts.mixIn)) opts.mixIn = MIN_MIXIN;
      if (!(opts.mixIn >= MIN_MIXIN && opts.mixIn <= MAX_MIXIN)) reject(MIN_MIXIN + ' <= mixIn <= ' + MAX_MIXIN);
      else {
        opts.anonymity = opts.mixIn; // delete opts.mixIn;
        if (isUndefined(opts.unlockHeight)) opts.unlockHeight = DEFAULT_UNLOCK_HEIGHT;
        if (!isNonNegative(opts.unlockHeight)) reject('unlockHeight' + err.nonNeg);
        else {
          opts.unlockTime = opts.unlockHeight; // delete opts.unlockHeight;
          if (isUndefined(opts.fee)) {
            opts.fee = DEFAULT_FEE;
            opts.transfers.forEach((transfer) => {
              opts.fee += (!isUndefined(transfer.message) ? transfer.message.length * DEFAULT_CHARACTER_FEE : 0);
            });
          }
          if (!isNonNegative(opts.fee)) reject('fee' + err.raw);
          else wrpc(this, 'sendTransaction', opts, resolve, reject);
        }
      }
    }
  });
};

XUNI.prototype.createDelayedTransaction = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (isUndefined(opts.transfers) || !arrayTest(opts.transfers, isTransfer)) reject('transfers' + err.arr + ' of transfers each of which' + err.trans);
    else if (!isUndefined(opts.addresses) && !arrayTest(opts.addresses, isAddress)) reject('addresses' + err.arr + ' of addresses each of which' + err.addr);
    else if (!isUndefined(opts.changeAddress) && !isAddress(opts.changeAddress)) reject('changeAddress' + err.addr);
    else if (!isUndefined(opts.paymentId) && !isHex64String(opts.paymentId)) reject('paymentId' + err.hex64);
    else if (!isUndefined(opts.extra) && !isString(opts.extra)) reject('extra' + err.str);
    else {
      if (isUndefined(opts.mixIn)) opts.mixIn = MIN_MIXIN;
      if (!(opts.mixIn >= MIN_MIXIN && opts.mixIn <= MAX_MIXIN)) reject(MIN_MIXIN + ' <= mixIn <= ' + MAX_MIXIN);
      else {
        opts.anonymity = opts.mixIn; delete opts.mixIn;
        if (isUndefined(opts.unlockHeight)) opts.unlockHeight = DEFAULT_UNLOCK_HEIGHT;
        if (!isNonNegative(opts.unlockHeight)) reject('unlockHeight' + err.nonNeg);
        else {
          opts.unlockTime = opts.unlockHeight; delete opts.unlockHeight;
          if (isUndefined(opts.fee)) opts.fee = DEFAULT_FEE * opts.transfers.length;
          if (!isNonNegative(opts.fee)) reject('fee' + err.raw);
          else wrpc(this, 'createDelayedTransaction', opts, resolve, reject);
        }
      }
    }
  });
};

XUNI.prototype.getDelayedTransactionHashes = function () {
  return new Promise((resolve, reject) => {
    wrpc(this, 'getDelayedTransactionHashes', {}, resolve, reject);
  });
};

XUNI.prototype.deleteDelayedTransaction = function (hash) {
  return new Promise((resolve, reject) => {
    if (!isHex64String(hash)) reject('hash' + err.hex64);
    else wrpc(this, 'deleteDelayedTransaction', { transactionHash: hash }, resolve, reject);
  });
};

XUNI.prototype.sendDelayedTransaction = function (hash) {
  return new Promise((resolve, reject) => {
    if (!isHex64String(hash)) reject('hash' + err.hex64);
    else wrpc(this, 'sendDelayedTransaction', { transactionHash: hash }, resolve, reject);
  });
};

XUNI.prototype.getMessagesFromExtra = function (extra) {
  return new Promise((resolve, reject) => {
    if (!isHexString(extra)) reject('extra' + err.hex);
    else wrpc(this, 'getMessagesFromExtra', { extra: extra }, resolve, reject);
  });
};

// Daemon RPC - JSON RPC

function drpc(that, method, params, resolve, reject) {
  request(that.daemonProtocol, that.daemonHost, that.daemonRpcPort, that.auth, that.timeout, buildRpc(method, params), '/json_rpc', resolve, reject);
}

XUNI.prototype.count = function () {
  return new Promise((resolve, reject) => {
    drpc(this, 'getblockcount', {}, resolve, reject);
  });
};

XUNI.prototype.blockHashByHeight = function (height) {
  return new Promise((resolve, reject) => {
    if (!isNonNegative(height)) reject('height' + err.nonNeg);
    else drpc(this, 'on_getblockhash', [height], resolve, reject);
  });
};

XUNI.prototype.blockHeaderByHash = function (hash) {
  return new Promise((resolve, reject) => {
    if (!isHex64String(hash)) reject('hash' + err.hex64);
    else drpc(this, 'getblockheaderbyhash', { hash: hash }, resolve, reject);
  });
};

XUNI.prototype.blockHeaderByHeight = function (height) {
  return new Promise((resolve, reject) => {
    if (!isNonNegative(height)) reject('height' + err.nonNeg);
    else drpc(this, 'getblockheaderbyheight', { height: height }, resolve, reject);
  });
};

XUNI.prototype.lastBlockHeader = function () {
  return new Promise((resolve, reject) => {
    drpc(this, 'getlastblockheader', {}, resolve, reject);
  });
};

XUNI.prototype.block = function (hash) {
  return new Promise((resolve, reject) => {
    if (!isHex64String(hash)) reject('hash' + err.hex64);
    else drpc(this, 'f_block_json', { hash: hash }, resolve, reject);
  });
};

XUNI.prototype.blocks = function (height) {
  return new Promise((resolve, reject) => {
    if (!isNonNegative(height)) reject('height' + err.nonNeg);
    else drpc(this, 'f_blocks_list_json', { height: height }, resolve, reject);
  });
};

XUNI.prototype.transaction = function (hash) {
  return new Promise((resolve, reject) => {
    if (!isHex64String(hash)) reject('hash' + err.hex64);
    else drpc(this, 'f_transaction_json', { hash: hash }, resolve, reject);
  });
};

XUNI.prototype.transactionPool = function () {
  return new Promise((resolve, reject) => {
    drpc(this, 'f_on_transactions_pool_json', {}, resolve, reject);
  });
};

XUNI.prototype.currencyId = function () {
  return new Promise((resolve, reject) => {
    drpc(this, 'getcurrencyid', {}, resolve, reject);
  });
};

XUNI.prototype.blockTemplate = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (!isAddress(opts.address)) reject('address' + err.addr);
    else if (!isNonNegative(opts.reserveSize) || opts.reserveSize > 255) reject('0 <= reserveSize <= 255');
    else drpc(this, 'getblocktemplate', { wallet_address: opts.address, reserve_size: opts.reserveSize }, resolve, reject);
  });
};

XUNI.prototype.submitBlock = function (block) {
  return new Promise((resolve, reject) => {
    if (!isHexString(block)) reject('block' + err.hex);
    else drpc(this, 'submitblock', [block], resolve, reject);
  });
};

// Daemon RPC - JSON handlers

function hrpc(that, params, path, resolve, reject) {
  request(that.daemonProtocol, that.daemonHost, that.daemonRpcPort, that.auth, that.timeout, JSON.stringify(params), path, resolve, reject);
}

XUNI.prototype.info = function () {
  return new Promise((resolve, reject) => {
    hrpc(this, {}, '/getinfo', resolve, reject);
  });
};

XUNI.prototype.index = function () {
  return new Promise((resolve, reject) => {
    hrpc(this, {}, '/getheight', resolve, reject);
  });
};
/*
XUNI.prototype.startMining = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts)
    else if (!isAddress(opts.address)) reject('address' + err.addr)
    else if (!isNonNegative(opts.threads)) reject('unlockHeight' + err.nonNeg)
    else hrpc(this, { miner_address: opts.address, threads_count: opts.threads }, '/start_mining', resolve, reject)
  })
}
XUNI.prototype.stopMining = function () {
  return new Promise((resolve, reject) => {
    hrpc(this, { }, '/stop_mining', resolve, reject)
  })
}
*/
XUNI.prototype.transactions = function (txs) {
  return new Promise((resolve, reject) => {
    if (!arrayTest(txs, isHex64String)) reject('txs' + err.arr + ' of transactions each of which ' + err.hex64);
    else hrpc(this, { txs_hashes: txs }, '/gettransactions', resolve, reject);
  });
};

XUNI.prototype.sendRawTransaction = function (rawTx) {
  return new Promise((resolve, reject) => {
    if (!isHexString(rawTx)) reject('rawTx' + err.hex);
    else hrpc(this, { tx_as_hex: rawTx }, '/sendrawtransaction', resolve, reject);
  });
};
// XUNI.prototype.createDeposit = function(opts) {
//  return new Promise((resolve, reject) => {
//   if(!isObject(opts)) reject(err.opts);
//    else if(isUndefined(opts.address) || !isAddress(opts.address)) reject('address is not valid');
//    else if(isUndefined(opts.amount) || !isNonNegative(opts.amount)) reject('amount ' + err.nonNeg);
//    else {
//    wrpc(this, 'createDeposit', opts, resolve, reject);
//    }
//  });
// }

XUNI.prototype.estimateFusion = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (isUndefined(opts.threshold) || !isNonNegative(opts.threshold)) reject('threshold' + err.nonNeg);
    else if (!isUndefined(opts.addresses) && !arrayTest(opts.addresses, isAddress)) reject('addresses' + err.arr + ' of addresses each of which' + err.addr);
    wrpc(this, 'estimateFusion', opts, resolve, reject);
  });
}

XUNI.prototype.sendFusionTransaction = function (opts) {
  return new Promise((resolve, reject) => {
    if (!isObject(opts)) reject(err.opts);
    else if (isUndefined(opts.threshold) || !isNonNegative(opts.threshold)) reject('threshold' + err.nonNeg);
    else if (!isUndefined(opts.addresses) && !arrayTest(opts.addresses, isAddress)) reject('addresses' + err.arr + ' of addresses each of which' + err.addr);
    else if (opts.addresses.length > 1 && !isUndefined(opts.destinationAddress) && !isAddress(opts.destinationAddress)) reject('destinationAddress' + err.addr);
    else {
      if (isUndefined(opts.mixIn)) opts.mixIn = MIN_MIXIN;
      if (!(opts.mixIn >= MIN_MIXIN && opts.mixIn <= MAX_MIXIN)) reject(MIN_MIXIN + ' <= mixIn <= ' + MAX_MIXIN);
      else {
          opts.anonymity = opts.mixIn; delete opts.mixIn;
          wrpc(this, 'sendFusionTransaction', opts, resolve, reject);
      }
    }
    });
};

// Utilities

function arrayTest(arr, test) {
  if (!Array.isArray(arr)) return false;
  let i;
  for (i = 0; i < arr.length; i++) { if (!test(arr[i])) break; }
  if (i < arr.length) return false;
  return true;
}

function isObject(obj) { return typeof obj === 'object'; }

function isUndefined(obj) { return typeof obj === 'undefined'; }

function isString(obj) { return typeof obj === 'string'; }

function isTransfer(obj) {
  if (!isObject(obj) || !isAddress(obj.address) || !isNonNegative(obj.amount)) return false;
  if (typeof obj.message !== 'undefined' && !isString(obj.message)) return false;
  return true;
}

function isNonNegative(n) { return (Number.isInteger(n) && n >= 0); }

function isNumeric(n) { return !isNaN(parseFloat(n)) && isFinite(n); }

function isAddress(str) { return (typeof str === 'string' && str.length === 99 && str.slice(0, 4) === 'Xuni'); }

function isHex64String(str) { return (typeof str === 'string' && /^[0-9a-fA-F]{64}$/.test(str)); }

function isHexString(str) { return (typeof str === 'string' && !/[^0-9a-fA-F]/.test(str)); }

function buildRpc(method, params) { return '{"jsonrpc":"2.0","id":"0","method":"' + method + '","params":' + JSON.stringify(params) + '}'; }

function request(protocol, host, port, auth, timeout, post, path, resolve, reject) {
  const obj = {
    hostname: host,
    port: port,
    method: 'POST',
    timeout: timeout,
    path: path,
    auth: auth,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': post.length,
    }
  };
  var doRequest = protocol.request(
    obj,
    (res) => {
      let data = Buffer.alloc(0);
      res.on('data', (chunk) => { data = Buffer.concat([data, chunk]); });
      res.on('end', () => {
        try {
          data = JSON.parse(data.toString());
          if (data.error) { reject(data.error.message); return; }
        } catch (error) { reject(error.message); return; }
        if (data.result) data = data.result;
        resolve(data);
      });
    }
  );

  doRequest.on('error', (error) => {
    reject('RPC server error');
  });

  doRequest.on('timeout', () => {
    reject("RFC timeout");
    doRequest.abort();
  });

  doRequest.end(post);
}
