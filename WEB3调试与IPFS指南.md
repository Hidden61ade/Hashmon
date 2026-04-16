# Hashmon Web3/IPFS 配置与调试展示指南

---

## 一、IPFS服务配置（以Pinata为例）

1. 注册并登录 [Pinata](https://www.pinata.cloud/) 或 [Infura](https://www.infura.io/)
2. 获取API Key和Secret（Pinata：API Keys → New Key）
3. 前端集成建议：
   - **安全建议**：IPFS上传建议通过后端代理实现，避免暴露密钥在前端。
   - 若仅本地演示，可用fetch直传：

```js
async function uploadToIPFS(metadata, pinataApiKey, pinataSecret) {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecret
    },
    body: JSON.stringify(metadata)
  });
  const data = await res.json();
  return 'ipfs://' + data.IpfsHash;
}
```

4. 图片上传同理，接口为`/pinning/pinFileToIPFS`，需FormData。
5. 上传后获得的`ipfs://...`填入NFT元数据image和tokenURI字段。
6. 在`src/data/ContractConfig.js`中配置IPFS_GATEWAY（如`https://gateway.pinata.cloud/ipfs/`）。

---

## 二、调试与展示指南

### 1. 启动本地HTTP服务器
- 推荐命令：
  - `npx http-server . -p 8080`
  - 或 VSCode Live Server 插件
- 不要直接用file://协议打开index.html

### 2. 打开游戏
- 浏览器访问：http://localhost:8080
- 建议使用Chrome/Brave/Edge，安装MetaMask插件

### 3. Web3功能演示
- 进入“Web3 Hub”页面
- 点击“Connect Wallet”连接测试网钱包（如Sepolia）
- “My NFTs”自动读取链上NFT
- “Create & Mint”可铸造新Hashmon（需配置IPFS上传和合约地址）
- “Marketplace”可购买/上架NFT

### 4. 合约与IPFS部署
- 用Remix/Hardhat/Foundry部署HashmonNFT和Marketplace合约，填入src/data/ContractConfig.js
- Pinata/Infura上传图片和元数据，获得ipfs://哈希

### 5. 常见问题
- 钱包未连接/网络错误：检查MetaMask网络与合约部署网络一致
- IPFS上传失败：检查API Key权限，建议后端代理
- 合约调用失败：确认ABI、地址、钱包余额、授权等

---

如需进一步帮助，可随时联系开发者或AI助手。