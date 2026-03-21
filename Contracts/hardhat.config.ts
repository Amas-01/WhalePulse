import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: "0.8.20" },
      { version: "0.8.28" },
    ],
  },
  networks: {
    somnia: {
      url: process.env.SOMNIA_RPC_URL || "https://api.infra.mainnet.somnia.network/",
      chainId: Number(process.env.SOMNIA_CHAIN_ID) || 5031,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: {
      somnia: process.env.SOMNIA_API_KEY || "placeholder",
    },
    customChains: [
      {
        network: "somnia",
        chainId: 5031,
        urls: {
          apiURL: "https://explorer.somnia.network/api",
          browserURL: "https://explorer.somnia.network",
        },
      },
    ],
  },
};

export default config;
