import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create({
    network: "sepolia",
  });

  const nftAddress = "0xA0Ead7c83FB9192dc6efC179b181A0019B1AC236";
  const [signer] = await ethers.getSigners();
  console.log("Connected signer:", signer.address);

  const abi = [
    "function owner() view returns (address)",
    "function ammContract() view returns (address)",
    "function setAmmContract(address _ammContract) external",
  ];

  const nft = new ethers.Contract(nftAddress, abi, signer);
  const owner = await nft.owner();
  const currentAmm = await nft.ammContract();

  console.log("Contract Owner:    ", owner);
  console.log("Current ammContract:", currentAmm);

  if (signer.address.toLowerCase() !== owner.toLowerCase()) {
    console.error("ERROR: Signer is not the contract owner (" + owner + ").");
    return;
  }

  if (currentAmm === ethers.ZeroAddress) {
    console.log("ammContract is already address(0)! Public LP certificate minting is already enabled.");
    return;
  }

  console.log("Sending transaction to set ammContract to address(0)...");
  const tx = await nft.setAmmContract(ethers.ZeroAddress);
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation on Sepolia...");
  await tx.wait();
  console.log("SUCCESS! ammContract is now set to address(0). Any liquidity provider can now mint their LP Certificate NFT!");
}

main().catch(console.error);
