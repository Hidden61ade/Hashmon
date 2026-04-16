# Sepolia 部署指南

## 当前状态

本项目已经完成：
- Hardhat 部署环境初始化
- 合约依赖安装
- 合约编译验证通过

## 方法一：本地 Hardhat 部署

1. 打开 [.env](.env)
2. 填入：
   - SEPOLIA_RPC_URL
   - PRIVATE_KEY
3. 在终端进入项目目录后运行：
   npm run deploy:sepolia
4. 记下终端输出的两个地址：
   - HashmonNFT
   - HashmonMarketplace
5. 把它们填入 [src/data/ContractConfig.js](src/data/ContractConfig.js)

## 方法二：Remix + MetaMask 部署

1. 打开 Remix
2. 导入以下文件：
   - [contracts/HashmonNFT.sol](contracts/HashmonNFT.sol)
   - [contracts/HashmonMarketplace.sol](contracts/HashmonMarketplace.sol)
3. 编译通过后，在 Deploy 页面选择 Injected Provider - MetaMask
4. 确保 MetaMask 网络是 Sepolia
5. 先部署 HashmonNFT，再把 NFT 地址作为构造参数部署 HashmonMarketplace
6. 将部署好的地址填入 [src/data/ContractConfig.js](src/data/ContractConfig.js)

## 部署完成后

刷新游戏页面，再次连接钱包并点击 Mint NFT，即可从演示模式切换为真实上链模式。
