import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("KaySwap Suite", function () {
  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const maxSupply = ethers.parseEther("1000000"); // 1 Million
    const initialSupply = ethers.parseEther("500000"); // 500k (50%)

    // Deploy KavyaToken with dynamic parameters
    const kavyaToken = await ethers.deployContract("KavyaToken", [owner.address, maxSupply, initialSupply]);
    await kavyaToken.waitForDeployment();
    const kavyaAddress = await kavyaToken.getAddress();

    // Deploy KaySwapAMM
    const kaySwapAMM = await ethers.deployContract("KaySwapAMM", [kavyaAddress]);
    await kaySwapAMM.waitForDeployment();
    const ammAddress = await kaySwapAMM.getAddress();

    return { kavyaToken, kaySwapAMM, kavyaAddress, ammAddress, owner, user1, user2 };
  }

  describe("KavyaToken (KAV)", function () {
    it("Should initialize with parameterized 1M Max Supply and 500k (50%) Initial Total Supply", async function () {
      const { kavyaToken, owner } = await deployFixture();

      const maxSupply = await kavyaToken.MAX_SUPPLY();
      const totalSupply = await kavyaToken.totalSupply();
      const ownerBalance = await kavyaToken.balanceOf(owner.address);

      expect(maxSupply).to.equal(ethers.parseEther("1000000"));
      expect(totalSupply).to.equal(ethers.parseEther("500000"));
      expect(ownerBalance).to.equal(ethers.parseEther("500000"));
    });

    it("Should allow owner to mint up to max supply limit", async function () {
      const { kavyaToken, owner, user1 } = await deployFixture();

      const mintAmount = ethers.parseEther("500000");
      await kavyaToken.mint(user1.address, mintAmount);

      expect(await kavyaToken.totalSupply()).to.equal(ethers.parseEther("1000000"));
      expect(await kavyaToken.balanceOf(user1.address)).to.equal(mintAmount);

      // Exceeding max supply should revert
      await expect(
        kavyaToken.mint(user1.address, ethers.parseEther("1"))
      ).to.be.revertedWith("KavyaToken: Exceeds max supply limit");
    });

    it("Should allow users to claim faucet tokens", async function () {
      const { kavyaToken, user1 } = await deployFixture();

      await kavyaToken.connect(user1).claimFaucet();
      expect(await kavyaToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));

      // Claiming again within 24 hours should revert
      await expect(
        kavyaToken.connect(user1).claimFaucet()
      ).to.be.revertedWith("KavyaToken: Faucet claim available once every 24 hours");
    });
  });

  describe("KaySwapAMM Liquidity & Swaps", function () {
    it("Should add liquidity and mint LP tokens correctly", async function () {
      const { kavyaToken, kaySwapAMM, ammAddress, owner } = await deployFixture();

      const kavAmount = ethers.parseEther("10000");
      const ethAmount = ethers.parseEther("10");

      await kavyaToken.approve(ammAddress, kavAmount);
      await kaySwapAMM.addLiquidity(kavAmount, { value: ethAmount });

      const [reserveKAV, reserveETH] = await kaySwapAMM.getReserves();
      expect(reserveKAV).to.equal(kavAmount);
      expect(reserveETH).to.equal(ethAmount);

      const lpBalance = await kaySwapAMM.balanceOf(owner.address);
      expect(lpBalance).to.be.gt(0n);
    });

    it("Should execute KAV to ETH swap with fee and slippage check", async function () {
      const { kavyaToken, kaySwapAMM, ammAddress, owner, user1 } = await deployFixture();

      const initialKav = ethers.parseEther("100000");
      const initialEth = ethers.parseEther("100");
      await kavyaToken.approve(ammAddress, initialKav);
      await kaySwapAMM.addLiquidity(initialKav, { value: initialEth });

      await kavyaToken.connect(user1).claimFaucet();
      const userKavIn = ethers.parseEther("1000");

      await kavyaToken.connect(user1).approve(ammAddress, userKavIn);

      const expectedEthOut = await kaySwapAMM.getAmountOut(
        userKavIn,
        initialKav,
        initialEth
      );

      const userEthBefore = await ethers.provider.getBalance(user1.address);
      const tx = await kaySwapAMM.connect(user1).swapKAVForETH(userKavIn, expectedEthOut);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const userEthAfter = await ethers.provider.getBalance(user1.address);
      expect(userEthAfter + gasUsed - userEthBefore).to.equal(expectedEthOut);
    });

    it("Should execute ETH to KAV swap correctly", async function () {
      const { kavyaToken, kaySwapAMM, ammAddress, owner, user1 } = await deployFixture();

      const initialKav = ethers.parseEther("50000");
      const initialEth = ethers.parseEther("50");
      await kavyaToken.approve(ammAddress, initialKav);
      await kaySwapAMM.addLiquidity(initialKav, { value: initialEth });

      const ethIn = ethers.parseEther("1");
      const expectedKavOut = await kaySwapAMM.getAmountOut(ethIn, initialEth, initialKav);

      await kaySwapAMM.connect(user1).swapETHForKAV(expectedKavOut, { value: ethIn });

      expect(await kavyaToken.balanceOf(user1.address)).to.equal(expectedKavOut);
    });

    it("Should allow removing liquidity", async function () {
      const { kavyaToken, kaySwapAMM, ammAddress, owner } = await deployFixture();

      const kavAmount = ethers.parseEther("10000");
      const ethAmount = ethers.parseEther("10");
      await kavyaToken.approve(ammAddress, kavAmount);
      await kaySwapAMM.addLiquidity(kavAmount, { value: ethAmount });

      const lpBalance = await kaySwapAMM.balanceOf(owner.address);
      await kaySwapAMM.removeLiquidity(lpBalance);

      expect(await kaySwapAMM.balanceOf(owner.address)).to.equal(0n);
      const [reserveKAV, reserveETH] = await kaySwapAMM.getReserves();
      expect(reserveKAV).to.equal(0n);
      expect(reserveETH).to.equal(0n);
    });
  });
});
