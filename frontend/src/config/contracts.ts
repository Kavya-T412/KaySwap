export const KAVYA_TOKEN_ADDRESS = "0x4dEb61eA0fB1b6fCDb3D03Ca95C03B6fC3c1939D"; // Local / Sepolia default
export const KAYSWAP_AMM_ADDRESS = "0x98D246Ce0276024027CB40784c32cbED9B22F91a";

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
  "function owner() view returns (address)"
] as const;

export const KAYSWAP_AMM_ABI = [
  "function kavToken() view returns (address)",
  "function reserveKAV() view returns (uint256)",
  "function reserveETH() view returns (uint256)",
  "function getReserves() view returns (uint256 _reserveKAV, uint256 _reserveETH)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) pure returns (uint256 amountOut)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function addLiquidity(uint256 amountKAVDesired) payable returns (uint256 liquidity)",
  "function removeLiquidity(uint256 liquidity) returns (uint256 amountKAV, uint256 amountETH)",
  "function swapKAVForETH(uint256 amountKAVIn, uint256 minETHOut) returns (uint256 amountETHOut)",
  "function swapETHForKAV(uint256 minKAVOut) payable returns (uint256 amountKAVOut)",
  "event LiquidityAdded(address indexed provider, uint256 amountKAV, uint256 amountETH, uint256 lpMinted)",
  "event LiquidityRemoved(address indexed provider, uint256 amountKAV, uint256 amountETH, uint256 lpBurned)",
  "event SwapExecuted(address indexed sender, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut, address indexed recipient)"
] as const;
