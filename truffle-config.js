require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
//Load environment variables
const mnemonic = "shadow scan mutual cycle load jealous volcano pipe twelve flat will loan"
const INFURA_PROJECT_ID = "QOp6tWYTJ1a_1M_bAuKOIR989euSGZ2Z"


module.exports = {
    networks: {
      development: {
        host: "127.0.0.1", // Ganache's default localhost
        port: 7545,        // Ganache's default port
        network_id: "*",   // Match any network ID
        gas: 6721975,      // Maximum gas allowed per block
        gasPrice: 20000000000, // 20 gwei
      },
    //   sepolia: {
    //     provider: () =>
    //       new HDWalletProvider({
    //         privateKeys:["0x02c13b2d6fdd4de08d81b05bfbb4177104ba2bbb51342c0c1e2fe05d4860cb72"],
    //         providerOrUrl: 'https://eth-sepolia.g.alchemy.com/v2/QOp6tWYTJ1a_1M_bAuKOIR989euSGZ2Z',
    //         chainId: 11155111, // Chain ID for Sepolia
    //       }),
    //       network_id: 11155111,       
    //       gas: 5500000,        
    //       confirmations: 2,    
    //       timeoutBlocks: 200,  
    //       skipDryRun: true 
    //   },
    // },
    compilers: {
      solc: {
        version: "0.8.0", // Adjust to your Solidity version
      },
    },
    
  };
