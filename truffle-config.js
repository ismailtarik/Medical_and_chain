require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
//Load environment variables
const mnemonic = "shadow scan mutual cycle load jealous volcano pipe twelve flat will loan"
const INFURA_PROJECT_ID = "QOp6tWYTJ1a_1M_bAuKOIR989euSGZ2Z"

// Load environment variables
const PRIVATE_KEY = "c3cad477d1c8bc152a1b1feba1afea5fbfefefd3fc4c0fd540d73c644c8abccb"

module.exports = {
    networks: {
      development: {
        host: "127.0.0.1", // Ganache's default localhost
        port: 7545,        // Ganache's default port
        network_id: "*",   // Match any network ID
        gas: 6721975,      // Maximum gas allowed per block
        gasPrice: 20000000000, // 20 gwei
      },
      // sepolia: {
      //   provider: () =>
      //     new HDWalletProvider({
      //       privateKeys:["c3cad477d1c8bc152a1b1feba1afea5fbfefefd3fc4c0fd540d73c644c8abccb"],
      //       providerOrUrl: https://eth-sepolia.g.alchemy.com/v2/QOp6tWYTJ1a_1M_bAuKOIR989euSGZ2Z,
      //       chainId: 11155111, // Chain ID for Sepolia
      //     }),
      //     network_id: 11155111,       
      //     gas: 5500000,        
      //     confirmations: 2,    
      //     timeoutBlocks: 200,  
      //     skipDryRun: true 
      // },
    },
    compilers: {
      solc: {
        version: "0.8.0", // Adjust to your Solidity version
      },
    },
    
  };