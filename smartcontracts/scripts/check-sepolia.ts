import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create({
    network: "sepolia",
  });
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Sepolia balance:", ethers.formatEther(balance), "ETH");
}

main().catch(console.error);

