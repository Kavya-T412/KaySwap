export const KAVYA_TOKEN_ADDRESS = "0x89C74d54EF808F31e2420070f2c18D1b30a13781"; // Local / Sepolia default
export const KAYSWAP_AMM_ADDRESS = "0xBFe195290F79Ac9E8aD1b61C6923b37c2a478488";
export const KAYSWAP_LP_NFT_ADDRESS = "0xA0Ead7c83FB9192dc6efC179b181A0019B1AC236"; // LP Certificate NFT on Sepolia

// Public RPC Endpoints for Sepolia On-Chain Event Fetching
export const ALCHEMY_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
export const SEPOLIA_RPC_FALLBACKS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://1rpc.io/sepolia",
  "https://rpc2.sepolia.org",
  "https://rpc.ankr.com/eth_sepolia"
];

export const KAVYA_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function claimFaucet()",
  "function lastFaucetClaim(address user) view returns (uint256)",
  "function owner() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
] as const;

export const KAYSWAP_AMM_ABI = [
  "function kavToken() view returns (address)",
  "function reserveKAV() view returns (uint256)",
  "function reserveETH() view returns (uint256)",
  "function cumulativeFeeKAV() view returns (uint256)",
  "function cumulativeFeeETH() view returns (uint256)",
  "function totalVolumeKAV() view returns (uint256)",
  "function totalVolumeETH() view returns (uint256)",
  "function getReserves() view returns (uint256 _reserveKAV, uint256 _reserveETH)",
  "function getPoolStats() view returns (uint256 _cumulativeFeeKAV, uint256 _cumulativeFeeETH, uint256 _totalVolumeKAV, uint256 _totalVolumeETH)",
  "function getPendingFees(address user) view returns (uint256 pendingKAV, uint256 pendingETH)",
  "function collectFees() returns (uint256 claimedKAV, uint256 claimedETH)",
  "function addRangePosition(uint256 minPrice, uint256 maxPrice, uint256 feeTier, uint256 amountKAVDesired) payable returns (uint256 positionId)",
  "function collectPositionFees(uint256 positionId)",
  "function removePosition(uint256 positionId) returns (uint256 amountKAV, uint256 amountETH)",
  "function getUserPositions(address user) view returns (tuple(uint256 id, address owner, uint256 amountKAV, uint256 amountETH, uint256 minPrice, uint256 maxPrice, uint256 feeTier, uint256 unclaimedKAV, uint256 unclaimedETH, uint256 createdAt, bool isActive)[])",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256 amountOut)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function addLiquidity(uint256 amountKAVDesired) payable returns (uint256 liquidity)",
  "function removeLiquidity(uint256 liquidity) returns (uint256 amountKAV, uint256 amountETH)",
  "function swapKAVForETH(uint256 amountKAVIn, uint256 minETHOut) returns (uint256 amountETHOut)",
  "function swapETHForKAV(uint256 minKAVOut) payable returns (uint256 amountKAVOut)",
  "event LiquidityAdded(address indexed provider, uint256 amountKAV, uint256 amountETH, uint256 lpMinted)",
  "event LiquidityRemoved(address indexed provider, uint256 amountKAV, uint256 amountETH, uint256 lpBurned)",
  "event SwapExecuted(address indexed sender, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut, address indexed recipient)",
  "event FeesCollected(address indexed provider, uint256 amountKAV, uint256 amountETH)",
  "event PositionCreated(uint256 indexed positionId, address indexed owner, uint256 amountKAV, uint256 amountETH, uint256 minPrice, uint256 maxPrice, uint256 feeTier)",
  "event PositionClosed(uint256 indexed positionId, address indexed owner, uint256 returnedKAV, uint256 returnedETH)"
] as const;

export const KAYSWAP_LP_NFT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function owner() view returns (address)",
  "function ammContract() view returns (address)",
  "function setAmmContract(address _ammContract) external",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function getCertificate(uint256 tokenId) view returns (tuple(uint256 tokenId, address provider, string pair, uint256 amountKAV, uint256 amountETH, uint256 feeTier, uint256 issuedAt, string proofHash))",
  "function getUserCertificateIds(address user) view returns (uint256[])",
  "function totalCertificates() view returns (uint256)",
  "function renderCertificateSVG(uint256 tokenId) view returns (string)",
  "function mintCertificate(address to, string pair, uint256 amountKAV, uint256 amountETH, uint256 feeTier, string uri, string proofHash) returns (uint256)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed provider, string pair, uint256 amountKAV, uint256 amountETH, string proofHash)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
] as const;
