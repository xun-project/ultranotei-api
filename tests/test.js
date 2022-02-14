const XUNI = require('..')
const xuni = new XUNI({
  daemonHost: 'http://localhost', 
  walletHost: 'http://localhost', 
  daemonRpcPort: 43000,
  walletRpcPort: 8070,
  rpcUser: 'rpcuser',
  rpcPassword: 'rpcpass'
})

xuni.status()
.then((res) => { console.log(res) }) // display tx hash upon success
.catch((err) => { console.log(err) }) // display error message upon failure
