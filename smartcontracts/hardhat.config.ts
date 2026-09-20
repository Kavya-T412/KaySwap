import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

function getRpcUrl(): string {
  if (process.env.SEPOLIA_RPC_URL) {
    return process.env.SEPOLIA_RPC_URL;
  }
  try {
    return configVariable("SEPOLIA_RPC_URL");
  } catch (e) {
    return "https://ethereum-sepolia-rpc.publicnode.com";
  }
}

function getPrivateKey(): string[] {
  if (process.env.SEPOLIA_PRIVATE_KEY) {
    return [process.env.SEPOLIA_PRIVATE_KEY];
  }
  try {
    return [configVariable("SEPOLIA_PRIVATE_KEY")];
  } catch (e) {
    return [];
  }
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.34",
      },
      production: {
        version: "0.8.34",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: getRpcUrl(),
      accounts: getPrivateKey(),
    },
  },
});
