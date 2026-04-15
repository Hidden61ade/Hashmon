# Hashmon

<p align="center">
  <strong>A Phaser 3 + Web3 monster game prototype</strong><br/>
  Battle, collect, customize, and mint your own on-chain Hashmon.
</p>

<p align="center">
  <img alt="Phaser" src="https://img.shields.io/badge/Phaser-3-1f6feb?style=for-the-badge" />
  <img alt="Ethers" src="https://img.shields.io/badge/Ethers-v6-6f42c1?style=for-the-badge" />
  <img alt="Solidity" src="https://img.shields.io/badge/Solidity-Web3-2ea44f?style=for-the-badge" />
  <img alt="Status" src="https://img.shields.io/badge/Status-Playable-success?style=for-the-badge" />
</p>

---

## 项目简介

Hashmon 是一个基于 Phaser 3 制作的 2D 像素风 Web3 游戏原型。玩家可以在游戏中连接钱包、查看自己拥有的 Hashmon、创建并 Mint NFT、参与战斗，并在花园场景中体验另一种轻量互动玩法。

这个项目的核心目标是：

- 展示 同一只 NFT 角色 在不同游戏场景中的复用能力
- 将 链上资产所有权 与 游戏玩法结合起来
- 用较轻量的前端架构快速验证 Web3 游戏原型

---

## 主要特性

### 战斗系统
- 回合制对战
- 属性克制与技能伤害计算
- 基础成长与数值系统
- 可扩展的 Hashmon 物种与技能池

### Web3 功能
- 连接 MetaMask 钱包
- 在 Sepolia 上 Mint 自定义 Hashmon NFT
- 从链上读取玩家 NFT
- 集成 IPFS 存储 NFT 元数据与上传图片
- 支持 NFT Marketplace 合约交互

### 自定义创建
- 自定义昵称
- 选择基础物种与属性类型
- 上传自己的图片作为 NFT 展示图
- 自定义技能组合
- 生成带有链上风格随机性的角色属性

### 多场景体验
- Battle Scene：对战玩法
- Garden Scene：轻互动养成展示
- Inventory Scene：查看已拥有的 Hashmon
- Web3 Scene：钱包、Mint、NFT 与市场入口

---

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 游戏引擎 | Phaser 3 |
| 前端 | Vanilla JavaScript, ES Modules |
| 区块链交互 | Ethers.js v6 |
| 智能合约 | Solidity |
| NFT 元数据 | IPFS / Pinata |
| 测试网络 | Sepolia |

---

## 快速开始

### 1. 启动本地项目

由于项目使用原生模块，请通过本地服务器运行，而不是直接双击 HTML 文件。

#### 方式一：使用 Python

```bash
python -m http.server 8080
```

#### 方式二：使用 Node

```bash
npx http-server . -p 8080
```

启动后访问：

```text
http://localhost:8080
```

---

## 如何体验这个项目

1. 打开游戏首页
2. 进入 Web3 页面并连接 MetaMask
3. 切换到 Sepolia 测试网络
4. 创建你的 Hashmon
5. 上传图片、设置昵称、技能与属性
6. Mint 成 NFT
7. 在 My NFTs 和 Inventory 中查看你的角色
8. 进入战斗或花园场景继续体验

---

## 项目结构

```text
Hashmon/
├─ assets/                # 游戏美术资源
├─ contracts/             # Solidity 合约
├─ scripts/               # 部署脚本
├─ src/
│  ├─ battle/             # 战斗逻辑
│  ├─ data/               # 角色、配置、资料数据
│  └─ scenes/             # 各个 Phaser 场景
├─ index.html             # 项目入口
└─ README.md              # 项目说明
```

---

## 核心页面说明

### Start
游戏主页与导航入口。

### Web3 Hub
整个 Web3 体验中心，包括：
- 钱包连接
- NFT 查看
- Create and Mint
- Marketplace 交互

### Battle
演示 Hashmon 的回合制战斗玩法。

### Garden
演示 Hashmon 在另一种游戏环境中的展示与互动。

### Inventory
查看角色信息、属性、技能与自定义图片。

---

## 智能合约

项目包含以下主要合约：

- HashmonNFT：负责 NFT Mint 与元数据绑定
- HashmonMarketplace：负责上架、购买与交易

如需部署到测试网，可参考仓库中的部署配置与说明文档。

---

## 开发亮点

- 将传统 Phaser 游戏与链上 NFT 结合
- 保持前端结构清晰，便于演示和课程展示
- 支持真实钱包交互，而不是纯 mock
- 支持用户自定义角色内容，提升可玩性与展示效果

---

## 适用场景

这个项目适合用于：

- Web3 游戏课程作业展示
- Phaser 游戏开发练习
- NFT 资产与游戏交互原型验证
- 区块链前端集成示例

---

## 后续可扩展方向

- 更完整的市场 UI
- 排行榜与 ELO 后端服务
- 更丰富的物种与技能体系
- 更完整的链上成长与养成机制
- ERC-6551 或更深层资产账户玩法

---

## 相关文档

- [WEB3_HANDOFF.md](WEB3_HANDOFF.md)
- [progress.md](progress.md)
- [SEPOLIA部署指南.md](SEPOLIA部署指南.md)

---

## License

This project is for learning, prototyping, and academic demonstration.
