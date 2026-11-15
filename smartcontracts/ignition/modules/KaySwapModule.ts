import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const KaySwapModule = buildModule("KaySwapModule", (m) => {
  const initialOwner = m.getAccount(0);
  const maxSupply = m.getParameter("maxSupply", 1000000n * 10n ** 18n); // 1,000,000 KAV
  const initialSupply = m.getParameter("initialSupply", 500000n * 10n ** 18n); // 500,000 KAV (50%)

  const kavyaToken = m.contract("KavyaToken", [initialOwner, maxSupply, initialSupply]);
  const kaySwapAMM = m.contract("KaySwapAMM", [kavyaToken]);
  const kaySwapLPNFT = m.contract("KaySwapLPNFT", [initialOwner]);

  // Keep ammContract at address(0) so all liquidity providers can mint their dynamic LP certificate NFTs
  // m.call(kaySwapLPNFT, "setAmmContract", [kaySwapAMM]);

  return { kavyaToken, kaySwapAMM, kaySwapLPNFT };
});

export default KaySwapModule;
