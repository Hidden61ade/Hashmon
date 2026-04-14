// ContractConfig.js
// Store contract addresses and ABIs for Web3 integration

export const CONTRACTS = {
  HashmonNFT: {
    address: '0xYourNFTContractAddress', // TODO: Replace with deployed address
    abi: [
      // ...ERC721Enumerable, ERC721URIStorage, mint, evolve, etc.
    ],
  },
  Marketplace: {
    address: '0xYourMarketplaceAddress', // TODO: Replace with deployed address
    abi: [
      // ...listItem, buyItem, cancelListing, getActiveListings, etc.
    ],
  },
  // Add ERC-6551 registry and implementation if needed
};

// IPFS gateway for metadata fetch
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
