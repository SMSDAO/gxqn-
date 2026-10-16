import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    local: {
      url: process.env.GXQ_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337,
    },
    devnet: {
      url: process.env.DEVNET_RPC_URL || "https://devnet-rpc.gxq.network",
      chainId: 9002,
      accounts: process.env.DEVNET_DEPLOYER_PRIVATE_KEY ? [process.env.DEVNET_DEPLOYER_PRIVATE_KEY] : [],
    },
    testnet: {
      url: process.env.TESTNET_RPC_URL || "https://testnet-rpc.gxq.network",
      chainId: 9001,
      accounts: process.env.TESTNET_DEPLOYER_PRIVATE_KEY ? [process.env.TESTNET_DEPLOYER_PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "https://rpc.gxq.network",
      chainId: 9000,
      accounts: process.env.MAINNET_DEPLOYER_PRIVATE_KEY ? [process.env.MAINNET_DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
