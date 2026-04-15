// ContractConfig.js
// Store contract addresses and ABIs for Web3 integration

export const CONTRACTS = {
  HashmonNFT: {
    address: '0x3Af487e17274d73cB3Ed54DD01df3afCD6351C3E',
    abi: [
      'function mintPrice() view returns (uint256)',
      'function mint(address to, string tokenURI) payable returns (uint256)',
      'function evolve(uint256 tokenId1, uint256 tokenId2, string newTokenURI) returns (uint256)',
      'function balanceOf(address owner) view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function approve(address to, uint256 tokenId)',
    ],
  },
  Marketplace: {
    address: '0x61209CdF536740ab3cA939dC12580F1AF2B1d04D',
    abi: [
      'function listItem(uint256 tokenId, uint256 price)',
      'function buyItem(uint256 tokenId) payable',
      'function cancelListing(uint256 tokenId)',
      'function getActiveListings() view returns (uint256[] memory, tuple(address seller, uint256 price, bool active)[] memory)',
    ],
  },
  // Add ERC-6551 registry and implementation if needed
};

// IPFS gateway for metadata fetch
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Pinata API配置（仅本地演示用，生产请用后端代理）
export const PINATA_CONFIG = {
  apiKey: '32e7a0388ae111ede8ca',
  secret: '6c49aa18097f88469b8bf2f65b221fd2e3d52c11c119dc8a9de0c3fb9783ac11',
};

/**
 * 上传JSON到Pinata IPFS
 * @param {Object} metadata NFT元数据对象
 * @returns {Promise<string>} ipfs://哈希
 */
export async function uploadToIPFS(metadata) {
  const { apiKey, secret } = PINATA_CONFIG;
  if (!apiKey || !secret) throw new Error('请在PINATA_CONFIG中填写API Key和Secret');
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secret
    },
    body: JSON.stringify(metadata)
  });
  const data = await res.json();
  if (!data.IpfsHash) throw new Error('Pinata上传失败: ' + JSON.stringify(data));
  return 'ipfs://' + data.IpfsHash;
}

/**
 * 上传图片文件到Pinata IPFS
 * @param {File} file 浏览器选择的图片文件
 * @returns {Promise<string>} ipfs://哈希
 */
export async function uploadFileToIPFS(file) {
  const { apiKey, secret } = PINATA_CONFIG;
  if (!apiKey || !secret) throw new Error('请在PINATA_CONFIG中填写API Key和Secret');
  if (!file) throw new Error('未选择图片文件');

  const formData = new FormData();
  formData.append('file', file, file.name);

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': secret
    },
    body: formData
  });

  const data = await res.json();
  if (!data.IpfsHash) throw new Error('图片上传失败: ' + JSON.stringify(data));
  return 'ipfs://' + data.IpfsHash;
}
