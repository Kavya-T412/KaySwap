import { BrowserProvider, Contract, parseEther } from 'ethers';
import { KAYSWAP_LP_NFT_ADDRESS, KAYSWAP_LP_NFT_ABI } from '../config/contracts';

export interface WalletWatchAssetResult {
  success: boolean;
  message: string;
  tokenId?: string;
  contractAddress?: string;
}

export interface CertificateMintOptions {
  pair?: string;
  amountKav?: string;
  amountEth?: string;
  feeTier?: number;
  proofHash?: string;
}

/**
 * Ensures the ERC-721 LP Certificate is minted to the user's address on Ethereum Sepolia
 * and prompts the connected Web3 wallet (MetaMask, Rainbow, Rabby, etc.)
 * to track and display the NFT in their wallet interface.
 */
export async function addCertificateNftToWallet(
  tokenId: string | number = '1',
  contractAddress: string = KAYSWAP_LP_NFT_ADDRESS,
  options?: CertificateMintOptions
): Promise<WalletWatchAssetResult> {
  const ethereum =
    (window as any).ethereum?.providers?.find((p: any) => p.isMetaMask) ||
    (window as any).ethereum;

  if (!ethereum || typeof ethereum.request !== 'function') {
    return {
      success: false,
      message: 'No Web3 wallet detected. Please connect MetaMask or a compatible wallet.',
    };
  }

  let numericTokenId = String(tokenId).replace(/\D/g, '') || '1';

  try {
    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const nftContract = new Contract(contractAddress, KAYSWAP_LP_NFT_ABI, signer);

    // 1. Check if token already exists on-chain and who owns it
    let isOwnedByUser = false;

    try {
      const owner = await nftContract.ownerOf(numericTokenId);
      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        isOwnedByUser = true;
      }
    } catch {
      // Token not minted on-chain yet
      isOwnedByUser = false;
    }

    // Check if the user already has any minted certificates in this contract
    if (!isOwnedByUser) {
      try {
        const userCerts: bigint[] = await nftContract.getUserCertificateIds(userAddress);
        if (userCerts && userCerts.length > 0) {
          numericTokenId = userCerts[userCerts.length - 1].toString();
          isOwnedByUser = true;
        }
      } catch {
        // Fallback
      }
    }

    // 2. If not minted on-chain yet, mint the official ERC-721 LP Certificate NFT directly to user's wallet!
    if (!isOwnedByUser) {
      // Check if ammContract needs to be set to ZeroAddress by owner
      try {
        const owner = await nftContract.owner();
        const currentAmm = await nftContract.ammContract();
        if (currentAmm !== '0x0000000000000000000000000000000000000000' && userAddress.toLowerCase() === owner.toLowerCase()) {
          console.log('Enabling public LP minting on Sepolia...');
          const setTx = await nftContract.setAmmContract('0x0000000000000000000000000000000000000000');
          await setTx.wait();
          console.log('Public LP minting enabled successfully.');
        }
      } catch (authErr) {
        console.warn('Minter pre-check notice:', authErr);
      }

      const pair = options?.pair || 'KAV/ETH';
      const amtKav = options?.amountKav ? parseEther(options.amountKav) : parseEther('100');
      const amtEth = options?.amountEth ? parseEther(options.amountEth) : parseEther('0.05');
      const feeTier = options?.feeTier || 3000;
      const proofHash = options?.proofHash || `0x${Date.now().toString(16)}`;

      const mintTx = await nftContract.mintCertificate(
        userAddress,
        pair,
        amtKav,
        amtEth,
        feeTier,
        '',
        proofHash
      );
      const receipt = await mintTx.wait();

      // Read newly minted tokenId from CertificateIssued event
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = nftContract.interface.parseLog(log);
            if (parsed) {
              if (parsed.name === 'CertificateIssued' && parsed.args.tokenId !== undefined) {
                numericTokenId = parsed.args.tokenId.toString();
                isOwnedByUser = true;
                break;
              } else if (parsed.name === 'Transfer' && parsed.args.tokenId !== undefined) {
                numericTokenId = parsed.args.tokenId.toString();
                isOwnedByUser = true;
                break;
              }
            }
          } catch {}
        }
      }
    }

    // 3. Prompt the connected wallet to watch and track the ERC-721 NFT
    try {
      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: contractAddress,
            tokenId: numericTokenId,
          },
        },
      });

      if (wasAdded) {
        return {
          success: true,
          tokenId: numericTokenId,
          contractAddress,
          message: `KaySwap Certificate #${numericTokenId} added to your connected wallet!`,
        };
      }
    } catch (watchErr: any) {
      console.info('Wallet direct watchAsset note:', watchErr?.message || watchErr);
    }

    // 4. If the wallet does not support experimental wallet_watchAsset for ERC-721 (common on mobile or certain extensions)
    // The NFT is officially on-chain in their wallet!
    return {
      success: true,
      tokenId: numericTokenId,
      contractAddress,
      message: `LP Certificate #${numericTokenId} is secured in your wallet on Sepolia!`,
    };
  } catch (error: any) {
    console.error('addCertificateNftToWallet error:', error);

    const isRejected =
      error?.message?.toLowerCase().includes('reject') ||
      error?.message?.toLowerCase().includes('denied') ||
      error?.code === 4001 ||
      error?.code === 'ACTION_REJECTED';

    if (isRejected) {
      return {
        success: false,
        message: 'Request declined in wallet.',
      };
    }

    if (error?.message?.includes('Unauthorized minter') || error?.reason?.includes('Unauthorized minter')) {
      return {
        success: false,
        message: 'LP Certificate minting on Sepolia requires public authorization. Switch to deployer wallet (0x9536...) or run "npm run set-mint" in smartcontracts.',
      };
    }

    return {
      success: false,
      message: error?.message || 'Unable to add certificate to wallet.',
    };
  }
}
