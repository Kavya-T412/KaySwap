// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title KaySwapLPNFT
 * @notice ERC-721 Non-Fungible Token (NFT) Certificate issued to KaySwap Liquidity Providers.
 * @dev Generates full on-chain 16:9 dynamic SVG certificate images and metadata for wallets and marketplaces.
 */
contract KaySwapLPNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;
    using Strings for address;

    uint256 private _nextTokenId = 1;

    struct Certificate {
        uint256 tokenId;
        address provider;
        string pair;
        uint256 amountKAV;
        uint256 amountETH;
        uint256 feeTier;
        uint256 issuedAt;
        string proofHash;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) private _userCertificates;
    address public ammContract;

    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed provider,
        string pair,
        uint256 amountKAV,
        uint256 amountETH,
        string proofHash
    );

    constructor(address initialOwner) ERC721("KaySwap Liquidity Provider Certificate", "KAY-CERT") Ownable(initialOwner) {}

    /**
     * @notice Set authorized AMM contract address allowed to mint LP Certificates
     */
    function setAmmContract(address _ammContract) external onlyOwner {
        ammContract = _ammContract;
    }

    /**
     * @notice Mint an ERC-721 LP Certificate NFT to a liquidity provider
     */
    function mintCertificate(
        address to,
        string calldata pair,
        uint256 amountKAV,
        uint256 amountETH,
        uint256 feeTier,
        string calldata uri,
        string calldata proofHash
    ) external returns (uint256) {
        require(msg.sender == owner() || msg.sender == ammContract || ammContract == address(0), "KaySwap: Unauthorized minter");
        require(to != address(0), "KaySwap: Invalid recipient");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }

        certificates[tokenId] = Certificate({
            tokenId: tokenId,
            provider: to,
            pair: pair,
            amountKAV: amountKAV,
            amountETH: amountETH,
            feeTier: feeTier,
            issuedAt: block.timestamp,
            proofHash: proofHash
        });

        _userCertificates[to].push(tokenId);

        emit CertificateIssued(tokenId, to, pair, amountKAV, amountETH, proofHash);
        return tokenId;
    }

    /**
     * @notice Fetch certificate data for a specific token ID
     */
    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        _requireOwned(tokenId);
        return certificates[tokenId];
    }

    /**
     * @notice Fetch all certificate token IDs owned by a user
     */
    function getUserCertificateIds(address user) external view returns (uint256[] memory) {
        return _userCertificates[user];
    }

    /**
     * @notice Total number of certificates minted
     */
    function totalCertificates() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Dynamically generates on-chain SVG Certificate image
     */
    function renderCertificateSVG(uint256 tokenId) public view returns (string memory) {
        _requireOwned(tokenId);
        Certificate storage cert = certificates[tokenId];
        string memory tokenIdStr = tokenId.toString();

        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%">',
                '<defs>',
                '<linearGradient id="lavenderBase" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D5C5E8"/><stop offset="50%" stop-color="#C9B5E0"/><stop offset="100%" stop-color="#BDABDC"/></linearGradient>',
                '<radialGradient id="sphere3D" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#FF9B8A"/><stop offset="40%" stop-color="#FF5B42"/><stop offset="80%" stop-color="#167D8D"/><stop offset="100%" stop-color="#0B434C"/></radialGradient>',
                '</defs>',
                '<rect width="1600" height="900" fill="url(#lavenderBase)"/>',
                '<rect x="20" y="20" width="1560" height="860" fill="none" stroke="#167D8D" stroke-width="8"/>',
                '<rect x="32" y="32" width="1536" height="836" fill="none" stroke="#FF5B42" stroke-width="2"/>',
                '<rect x="44" y="44" width="1512" height="812" fill="none" stroke="#167D8D" stroke-width="2" stroke-dasharray="16 8"/>',
                _renderBanner(cert.pair),
                _renderCenter(tokenIdStr, cert.provider.toHexString()),
                _renderCards(cert.pair, tokenIdStr),
                _renderFooter(tokenIdStr),
                '</svg>'
            )
        );
    }

    function _renderBanner(string memory pair) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<g transform="translate(100, 75)">',
                '<rect x="0" y="0" width="60" height="60" fill="#167D8D" rx="10"/>',
                '<circle cx="30" cy="30" r="16" fill="#FF5B42"/>',
                '<text x="75" y="40" fill="#167D8D" font-size="34" font-weight="900" font-family="sans-serif">KAYSWAP</text>',
                '<rect x="75" y="48" width="370" height="24" fill="#167D8D" rx="3"/>',
                '<text x="260" y="65" fill="#ffffff" font-size="11" font-weight="800" font-family="sans-serif" text-anchor="middle">DECENTRALIZED FINANCE ACHIEVEMENT</text>',
                '</g>',
                '<g transform="translate(1500, 85)" text-anchor="end">',
                '<text x="0" y="20" fill="#167D8D" font-size="14" font-weight="800" font-family="monospace">PROOF OF LIQUIDITY (PoL)</text>',
                '<text x="0" y="40" fill="#FF5B42" font-size="12" font-weight="700" font-family="monospace">NETWORK: ETHEREUM SEPOLIA</text>',
                '</g>',
                '<g transform="translate(800, 205)" text-anchor="middle">',
                '<text x="0" y="0" fill="#167D8D" font-size="40" font-weight="900" font-family="sans-serif" letter-spacing="5">LIQUIDITY PROVIDER CERTIFICATE</text>',
                '<line x1="-350" y1="18" x2="350" y2="18" stroke="#FF5B42" stroke-width="2"/>',
                '<text x="0" y="42" fill="#0C454E" font-size="13" font-weight="700" font-family="sans-serif">OFFICIAL PROOF OF LIQUIDITY COLLECTIBLE - ',
                pair,
                '</text></g>'
            )
        );
    }

    function _renderCenter(string memory tokenIdStr, string memory ownerStr) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<g transform="translate(800, 310)" text-anchor="middle">',
                '<text x="0" y="0" fill="#167D8D" font-size="12" font-weight="800" font-family="sans-serif" letter-spacing="3">PROUDLY PRESENTED TO LIQUIDITY PROVIDER</text>',
                '<rect x="-350" y="14" width="700" height="52" rx="6" fill="#ffffff" fill-opacity="0.8" stroke="#167D8D" stroke-width="2"/>',
                '<text x="0" y="48" fill="#0C454E" font-size="22" font-weight="800" font-family="monospace">',
                ownerStr,
                '</text></g>',
                '<g transform="translate(800, 480)">',
                '<circle cx="0" cy="0" r="80" fill="url(#sphere3D)" stroke="#167D8D" stroke-width="4"/>',
                '<circle cx="0" cy="0" r="50" fill="#ffffff" stroke="#FF5B42" stroke-width="3"/>',
                '<text x="0" y="10" fill="#167D8D" font-size="28" font-weight="900" font-family="sans-serif" text-anchor="middle">KAY</text>',
                '<text x="0" y="28" fill="#FF5B42" font-size="14" font-weight="800" font-family="sans-serif" text-anchor="middle">#',
                tokenIdStr,
                '</text></g>'
            )
        );
    }

    function _renderCard(string memory x, string memory title, string memory val) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<g transform="translate(', x, ', 640)"><rect width="325" height="105" rx="6" fill="#ffffff" fill-opacity="0.85" stroke="#167D8D" stroke-width="2.5"/>',
                '<text x="16" y="26" fill="#167D8D" font-size="12" font-weight="800" font-family="sans-serif">', title, '</text>',
                '<text x="16" y="65" fill="#0C454E" font-size="20" font-weight="900" font-family="sans-serif">', val, '</text></g>'
            )
        );
    }

    function _renderCards(string memory pair, string memory tokenIdStr) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                _renderCard("100", "LIQUIDITY POOL", pair),
                _renderCard("455", "CONTRIBUTION", "KAV + ETH LIQUIDITY"),
                _renderCard("820", "LP TOKEN ID", string(abi.encodePacked("#", tokenIdStr))),
                _renderCard("1175", "STATUS", "ACTIVE POOL")
            )
        );
    }

    function _renderFooter(string memory tokenIdStr) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<g transform="translate(800, 805)" text-anchor="middle">',
                '<rect x="-420" y="0" width="840" height="32" rx="4" fill="#167D8D"/>',
                '<text x="0" y="21" fill="#ffffff" font-size="13" font-weight="900" font-family="sans-serif" letter-spacing="3">VERIFIABLE ON ETHEREUM SEPOLIA - TOKEN #',
                tokenIdStr,
                '</text></g>'
            )
        );
    }

    /**
     * @notice Returns metadata with on-chain SVG image
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory customUri = super.tokenURI(tokenId);
        if (bytes(customUri).length > 0) {
            return customUri;
        }

        Certificate storage cert = certificates[tokenId];
        string memory imageUri = string(
            abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(renderCertificateSVG(tokenId))))
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name":"KaySwap Liquidity Provider Certificate #',
                            tokenId.toString(),
                            '","description":"Official KaySwap Liquidity Provider Certificate for ',
                            cert.pair,
                            ' on Ethereum Sepolia.","image":"',
                            imageUri,
                            '","attributes":[{"trait_type":"Liquidity Pool","value":"',
                            cert.pair,
                            '"},{"trait_type":"LP Token ID","value":"',
                            tokenId.toString(),
                            '"},{"trait_type":"Network","value":"Ethereum Sepolia"}]}'
                        )
                    )
                )
            )
        );
    }
}
