/**
 * Utility to convert raw Web3 / Ethers / Contract revert errors into
 * clean, user-friendly messages for the UI.
 */
export function formatUserFriendlyError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const rawMsg: string =
    err?.reason ||
    err?.shortMessage ||
    (typeof err?.message === 'string' ? err.message : '') ||
    String(err);

  // 1. User Wallet Cancellations
  if (
    err?.code === 'ACTION_REJECTED' ||
    err?.code === 4001 ||
    rawMsg.toLowerCase().includes('user rejected') ||
    rawMsg.toLowerCase().includes('rejected transaction') ||
    rawMsg.toLowerCase().includes('user denied')
  ) {
    return 'Transaction was cancelled in your wallet.';
  }

  // 2. Specific Contract Revert Messages
  if (rawMsg.includes('INSUFFICIENT_INPUT_AMOUNT') || rawMsg.includes('must be > 0')) {
    return 'The entered token amount must be greater than zero.';
  }
  if (
    rawMsg.includes('INSUFFICIENT_LIQUIDITY_MINTED') ||
    rawMsg.includes('Insufficient liquidity minted')
  ) {
    return 'Initial pool deposit too small to mint liquidity. Please increase the deposit amount.';
  }
  if (
    rawMsg.includes('INSUFFICIENT_LIQUIDITY') ||
    rawMsg.includes('Pool has no liquidity')
  ) {
    return 'This pool does not currently have enough liquidity for this trade size.';
  }
  if (rawMsg.includes('Slippage tolerance exceeded')) {
    return 'Price moved beyond your slippage tolerance. Try increasing slippage in settings or reducing trade size.';
  }
  if (rawMsg.includes('Insufficient contract ETH balance')) {
    return 'The pool contract does not have sufficient ETH balance to complete this swap.';
  }
  if (rawMsg.includes('Insufficient pool KAV balance')) {
    return 'The pool contract does not have sufficient KAV balance to complete this swap.';
  }
  if (rawMsg.includes('KAV transfer failed')) {
    return 'KAV transfer failed. Please verify your KAV token balance and that the AMM is approved.';
  }
  if (rawMsg.includes('ETH refund failed') || rawMsg.includes('ETH transfer failed')) {
    return 'ETH transfer failed. Please ensure your wallet has enough ETH for the transaction and gas.';
  }
  if (rawMsg.includes('Invalid price range bounds')) {
    return 'Invalid price bounds: Maximum price must be strictly higher than minimum price.';
  }
  if (rawMsg.includes('Invalid fee tier')) {
    return 'Invalid fee tier selected. Supported fee tiers: 0.05%, 0.30%, and 1.00%.';
  }
  if (rawMsg.includes('Insufficient LP balance')) {
    return 'You do not have enough LP tokens in your wallet to withdraw this amount.';
  }
  if (rawMsg.includes('Faucet claim available once every 24 hours')) {
    return 'Faucet cooldown active: You can claim 1,000 KAV testnet tokens once every 24 hours.';
  }
  if (rawMsg.includes('Faucet claim exceeds max supply limit')) {
    return 'KAV maximum supply limit reached. No more tokens can be minted by the faucet.';
  }
  if (rawMsg.includes('Exceeds max supply limit')) {
    return 'Mint amount exceeds the 1,000,000 KAV maximum supply cap.';
  }
  if (rawMsg.includes('Not position owner')) {
    return 'Unauthorized: You are not the owner of this liquidity position NFT.';
  }
  if (rawMsg.includes('Position inactive')) {
    return 'This liquidity position has already been closed and redeemed.';
  }
  if (rawMsg.includes('No fees available to collect')) {
    return 'You do not currently have any claimable swap fees accrued.';
  }
  if (
    rawMsg.toLowerCase().includes('insufficient funds') ||
    rawMsg.toLowerCase().includes('exceeds balance')
  ) {
    return 'Insufficient ETH in your wallet to pay for gas fees and transaction value.';
  }

  // 3. Ethers CALL_EXCEPTION / EstimateGas / Missing Function Selector
  if (
    err?.code === 'CALL_EXCEPTION' ||
    rawMsg.includes('execution reverted') ||
    rawMsg.includes('require(false)') ||
    rawMsg.includes('estimateGas')
  ) {
    if (err?.data && err.data !== '0x') {
      return `Transaction reverted on-chain (${err.data}). Please verify token balance and allowance.`;
    }
    return 'Transaction cannot be executed: contract reverted. Please verify token allowance and balances.';
  }

  // 4. Network or RPC Timeouts
  if (
    rawMsg.toLowerCase().includes('timeout') ||
    rawMsg.toLowerCase().includes('network error') ||
    rawMsg.toLowerCase().includes('failed to fetch')
  ) {
    return 'Network timeout. Sepolia RPC endpoint is slow or unreachable. Please try again.';
  }

  // 5. General Cleanup (strip hex blobs, raw JSON dumps, and stack traces)
  let clean = rawMsg
    .replace(/\{.*?\}|0x[a-fA-F0-9]{8,}|code=[A-Z_]+|version=[\d.]+/g, '')
    .replace(/Error:\s*/gi, '')
    .replace(/\(action=".*?",\s*data=".*?"\)/g, '')
    .trim();

  if (clean.length > 3 && clean.length < 150) {
    return clean;
  }

  return 'Transaction failed. Please check your token allowance and wallet balance.';
}

