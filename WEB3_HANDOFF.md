# Hashmon — Web3 & 后端交接文档

> **最后更新**: 2026-03-28
> **前端负责人**: 前端已完成全部场景搭建和战斗逻辑，以下内容供 Web3 / 后端同学接手使用。

---

## 一、项目概述

**Hashmon** 是一个基于 Phaser 3 的 2D 链游（Web3 Monster-Battling RPG），玩法参考宝可梦。玩家可以：

- 🎮 进行本地回合制对战（已完成）
- 🔗 连接钱包，查看链上角色 NFT
- 🎨 创建自定义 Hashmon 并铸造为 NFT
- 🛒 在市场上购买/出售其他玩家的 Hashmon NFT
- 📊 通过 ELO 排名系统记录战绩

---

## 二、技术栈

| 层级     | 技术                        | 状态     |
| -------- | --------------------------- | -------- |
| 引擎     | Phaser 3（通过 `<script>` 引入） | ✅ 已完成 |
| 前端构建 | 原生 ES6 Modules（无打包工具）  | ✅ 已完成 |
| 字体     | `Futile 14.ttf`（CSS FontFace API 加载） | ✅ 已完成 |
| Web3     | **待接入** — 预留 Ethers.js / Web3.js 接口 | ⏳ 待开发 |
| 合约     | **待开发** — ERC-721 NFT 合约 + 市场合约     | ⏳ 待开发 |
| 存储     | **待选型** — IPFS（Pinata / Infura）存元数据  | ⏳ 待选型 |

---

## 三、项目目录结构

```
Hashmon/
├── index.html                          # 入口 HTML
├── phaser.js                           # Phaser 3 引擎（本地引入）
├── assets/
│   ├── space.png                       # 背景图
│   ├── WaterRat.png                    # 水鼠精灵
│   ├── FireDragon.png                  # 火龙精灵
│   ├── Futile 14.ttf                   # 像素字体
│   └── Elements-pngs/                  # UI 素材（按钮/面板/血条等）
│
└── src/
    ├── main.js                         # Phaser 配置 + 场景注册
    │
    ├── data/                           # 📦 数据层（你主要关注这里）
    │   ├── HashmonData.js              # 种族定义、技能库、属性克制表
    │   ├── Hashmon.js                  # 运行时 Hashmon 类（HP/PP/属性值）
    │   └── PlayerProfile.js            # ⭐ 玩家档案（钱包、排名、NFT 列表）
    │
    ├── battle/
    │   └── BattleEngine.js             # 纯逻辑战斗引擎（零 Phaser 依赖）
    │
    └── scenes/
        ├── PreloaderScene.js           # 资源加载
        ├── StartScene.js               # 主菜单
        ├── BattleScene.js              # 战斗场景
        ├── InventoryScene.js           # Hashmon 图鉴/属性查看
        └── Web3Scene.js                # ⭐ Web3 集成界面（你的主战场）
```

---

## 四、核心文件说明

### 4.1 `PlayerProfile.js` — 玩家状态单例

这是**前后端共享状态**的核心。目前所有数据都是 mock 的，你需要替换为链上数据。

```javascript
// 导入方式（任何场景都可以 import）
import { playerProfile } from '../data/PlayerProfile.js';
```

**当前 Mock 数据结构：**

| 字段                 | 类型       | 说明                        | 你需要做的                          |
| -------------------- | ---------- | --------------------------- | ----------------------------------- |
| `walletConnected`    | `boolean`  | 钱包是否已连接              | 连接 MetaMask 后设为 `true`         |
| `walletAddress`      | `string`   | 钱包地址                    | 从 `eth_requestAccounts` 获取       |
| `username`           | `string`   | 玩家昵称                    | 可从合约/后端读取                   |
| `elo`                | `number`   | ELO 评分（决定段位）        | 存链上或后端数据库                  |
| `wins` / `losses`    | `number`   | 胜/败场数                   | 存链上或后端数据库                  |
| `ownedHashmon[]`     | `array`    | 拥有的 NFT 列表             | 通过合约 `balanceOf` + `tokenURI` 获取 |
| `marketplaceListings[]` | `array` | 市场上架列表                | 从市场合约读取                      |

**段位系统（已实现前端渲染）：**

| 段位       | 最低 ELO | 颜色      |
| ---------- | -------- | --------- |
| Bronze     | 0        | `#cd7f32` |
| Silver     | 1000     | `#c0c0c0` |
| Gold       | 1400     | `#ffd700` |
| Platinum   | 1700     | `#44dddd` |
| Diamond    | 2000     | `#aa88ff` |
| Legendary  | 2500     | `#ff4488` |

---

### 4.2 `Web3Scene.js` — 你的主要工作区

这个文件包含 **4 个 Tab 页面**，所有区块链交互都集中在这里。

**Tab 结构：**

| Tab            | 功能                              | 涉及的链上操作                  |
| -------------- | --------------------------------- | ------------------------------- |
| **Profile**    | 钱包地址、段位、战绩              | `connectWallet()`, 读取链上档案 |
| **My NFTs**    | 展示拥有的 Hashmon NFT 卡片       | `fetchNFTs()`                   |
| **Create & Mint** | 设计新 Hashmon 并铸造          | `mintHashmon()`                 |
| **Marketplace** | 浏览和购买其他玩家的 Hashmon     | `buyHashmon()`, `listHashmonForSale()` |

---

## 五、⭐ 需要你实现的函数（TODO 清单）

以下所有函数在 `Web3Scene.js` 中已定义好签名和注释，搜索 `// TODO: WEB3 INTEGRATION HERE` 即可定位。

### 5.1 `connectWallet()`

**位置**: `Web3Scene.js`
**作用**: 连接用户钱包（MetaMask / WalletConnect）

```javascript
async connectWallet() {
    // 1. 检查 window.ethereum 是否存在
    // 2. 创建 provider: new ethers.BrowserProvider(window.ethereum)
    // 3. 请求账户: await provider.send("eth_requestAccounts", [])
    // 4. 获取地址: const signer = await provider.getSigner()
    // 5. 更新 playerProfile:
    //    playerProfile.walletConnected = true;
    //    playerProfile.walletAddress = await signer.getAddress();
    // 6. 调用 this.fetchNFTs() 拉取链上数据
    // 7. 调用 this.updateWalletStatus() 刷新 UI
}
```

### 5.2 `fetchNFTs()`

**位置**: `Web3Scene.js`
**作用**: 从合约读取玩家拥有的所有 Hashmon NFT

```javascript
async fetchNFTs() {
    // 1. 获取合约实例: new ethers.Contract(contractAddress, abi, provider)
    // 2. 查询持有数量: const balance = await contract.balanceOf(walletAddress)
    // 3. 遍历每个 token:
    //    for (let i = 0; i < balance; i++) {
    //        const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
    //        const tokenURI = await contract.tokenURI(tokenId);
    //        const metadata = await fetch(tokenURI).then(r => r.json());
    //        // metadata 应包含: speciesKey, nickname, level, stats
    //    }
    // 4. 填充 playerProfile.ownedHashmon[]
}
```

### 5.3 `mintHashmon()`

**位置**: `Web3Scene.js`
**作用**: 铸造新的 Hashmon NFT

```javascript
async mintHashmon() {
    // 1. 收集表单数据（nickname, speciesKey, stats）
    // 2. 构建 metadata JSON:
    //    {
    //      "name": "Bubbles",
    //      "species": "WaterRat",
    //      "level": 1,
    //      "stats": { "hp": 55, "atk": 48, ... },
    //      "image": "ipfs://Qm..."
    //    }
    // 3. 上传 metadata 到 IPFS（Pinata SDK / Infura IPFS）
    // 4. 调用合约 mint:
    //    const tx = await contract.mint(walletAddress, ipfsURI);
    //    await tx.wait();
    // 5. 更新本地 playerProfile.ownedHashmon[]
    // 6. 刷新 UI: this.showTab('myNfts')
}
```

### 5.4 `buyHashmon(listing)`

**位置**: `Web3Scene.js`
**作用**: 从市场购买其他玩家的 Hashmon

```javascript
async buyHashmon(listing) {
    // listing 对象包含: { tokenId, speciesKey, nickname, level, price, seller }
    // 1. 解析价格: const priceWei = ethers.parseEther(listing.price)
    // 2. 调用市场合约:
    //    const tx = await marketplace.buyItem(listing.tokenId, { value: priceWei });
    //    await tx.wait();
    // 3. 更新 playerProfile.ownedHashmon[]
    // 4. 从 marketplaceListings 中移除已购买的
}
```

### 5.5 `listHashmonForSale(tokenId, priceInEth)`

**位置**: `Web3Scene.js`（函数已定义，UI 上架按钮待添加）
**作用**: 玩家将自己的 Hashmon 挂到市场出售

### 5.6 `evolveHashmon(tokenId1, tokenId2)`

**位置**: `Web3Scene.js`
**作用**: 合成进化 — 烧毁两个 NFT，铸造一个更强的

---

## 六、智能合约需求建议

### 6.1 ERC-721 Hashmon NFT 合约

```solidity
// 核心功能建议：
- mint(address to, string tokenURI) → 铸造新 Hashmon
- tokenURI(uint256 tokenId) → 返回 IPFS 元数据链接
- 继承 ERC721Enumerable（支持 tokenOfOwnerByIndex 查询）
```

**Metadata JSON 格式建议（存储在 IPFS）：**

```json
{
    "name": "Bubbles",
    "description": "A WaterRat Hashmon",
    "image": "ipfs://QmXxx.../waterrat.png",
    "attributes": {
        "species": "WaterRat",
        "type": "Water",
        "level": 10,
        "stats": {
            "hp": 55,
            "atk": 48,
            "def": 45,
            "spAtk": 62,
            "spDef": 50,
            "speed": 58
        },
        "moves": ["splash", "aquaJet", "bite", "defend"],
        "mintedBy": "0x7a3b...f91d",
        "mintDate": "2026-03-28"
    }
}
```

### 6.2 Marketplace 市场合约

```solidity
// 核心功能建议：
- listItem(uint256 tokenId, uint256 price) → 上架
- buyItem(uint256 tokenId) payable → 购买
- cancelListing(uint256 tokenId) → 取消上架
- getActiveListings() → 返回所有在售项
```

### 6.3 排名 / 战绩存储

**方案 A — 链上存储：**
- 在合约中记录 `elo`, `wins`, `losses`
- 优点：去中心化、不可篡改
- 缺点：每次战斗都需要 Gas

**方案 B — 后端数据库（推荐）：**
- 用 Node.js / Express 后端 + MongoDB/PostgreSQL
- 前端战斗结束后调用 API 更新战绩
- 用签名验证防止作弊
- 优点：无 Gas 费、响应快

---

## 七、前端已完成功能清单

| 功能                       | 状态   | 文件                     |
| -------------------------- | ------ | ------------------------ |
| 资源预加载 + 字体加载      | ✅     | `PreloaderScene.js`      |
| 主菜单（3 个按钮）         | ✅     | `StartScene.js`          |
| 回合制战斗引擎             | ✅     | `BattleEngine.js`        |
| 宝可梦式伤害公式（Gen-V）  | ✅     | `BattleEngine.js`        |
| PP 系统（每技能独立 PP）   | ✅     | `Hashmon.js`             |
| 六维属性（HP/ATK/DEF/...） | ✅     | `HashmonData.js`         |
| 属性克制表                 | ✅     | `HashmonData.js`         |
| 暴击 / 命中 / STAB 加成   | ✅     | `BattleEngine.js`        |
| 属性阶段变化（±6 级）     | ✅     | `Hashmon.js`             |
| 速度决定先手               | ✅     | `BattleEngine.js`        |
| 战斗 UI（HP 条 + PP 按钮） | ✅     | `BattleScene.js`         |
| 战斗日志（动态消息）       | ✅     | `BattleScene.js`         |
| Hashmon 图鉴（属性查看）   | ✅     | `InventoryScene.js`      |
| 玩家档案 / 段位系统        | ✅     | `PlayerProfile.js`       |
| 战绩记录（胜/败/ELO 变化） | ✅     | `BattleScene.js`         |
| Web3 界面（4 Tab 布局）    | ✅     | `Web3Scene.js`           |
| Web3 函数桩（TODO 标记）   | ✅     | `Web3Scene.js`           |

---

## 八、如何运行项目

项目是纯前端，不需要 `npm install`。

```bash
# 方法 1: 使用 npx 临时 HTTP 服务器
cd /path/to/Hashmon
npx http-server . -p 8080

# 方法 2: 使用 Python
python -m http.server 8080

# 方法 3: VSCode Live Server 插件
# 右键 index.html → Open with Live Server
```

打开浏览器访问 `http://localhost:8080` 即可。

> ⚠️ **注意**: 不能直接用 `file://` 协议打开 `index.html`，因为 ES Modules 和字体加载需要 HTTP 服务器。

---

## 九、接入 Ethers.js 建议

在 `index.html` 的 `<head>` 中添加：

```html
<script src="https://cdn.ethers.io/lib/ethers-6.umd.min.js"></script>
```

或者通过 npm 安装（如果后续引入打包工具）：

```bash
npm install ethers
```

然后在 `Web3Scene.js` 中可以直接使用 `window.ethers` 或 `import { ethers } from 'ethers'`。

---

## 十、跨游戏架构与进阶设计需求 (重要交接！！！)

本系统采用**双控制环境演示**，为了支持将该项目演示和升级为一个跨游戏/跨平台的标准化 Web3 IP，我们在设计中明确提出了以下要求，请在合约和后端设计中予以支持！

### 10.1 跨环境演示设计：“双控制环境”兼容性
证明 NFT 在两个系统体系下的兼容性：
- **Game A（战斗场景 `BattleScene`）**：侧重于竞技、策略与属性数值对抗。
- **Game B（花园场景 `GardenScene`）**：侧重于休闲养成。
两个场景读取**同一个区块链智能合约**和**同一个 IPFS 链接**中的同一只 Hashmon 数据。比如：同一只 Hashmon，在对战中可以释放技能，在花园里可以四处散步、积累道具。这证明了资产身份的跨游戏唯一和状态通用。

### 10.2 明确“属性语义”与参数归一化 (Normalized Stats)
未来 Hashmon 可能会进入赛车、跑酷等无关场景，跨游戏往往难以处理“属性语义”。
- **架构方案**：在 IPFS的 JSON 元数据中，所有基础属性设定为 0.0 到 1.0 之间的**标准值**（归一化数值）。例如 `{"agility": 0.8, "strength": 0.5}`。
- **多端解析权下放**：不同游戏对这 0.0 ~ 1.0 的数据分别给出自己的“定义映射”。
  - **在 Game A (BattleScene)**：`agility: 0.8` 被换算成战斗中的 80 点速度；
  - **在 Game B (GardenScene)**：`agility: 0.8` 被解释为移动寻路频率；
  - **在其他游戏 (如竞速)**：可能转化为赛车引擎的加速度。这有效解决了跨游戏数值平衡的学术难题。我们在前端数据的 `HashmonData.js` 中加入了 `baseNormalizedStats` 用于展示这一概念。

### 10.3 引入代币绑定账户 (ERC-6551 Token Bound Accounts)
从单纯的 ERC-721 静态凭证进化为**拥有状态的背包资产**。
- 传统 NFT 只是图片证明，没有自己的状态。**建议使用 ERC-6551 协议**，为每一只 Hashmon 绑定一个独立的合约钱包。
- **应用场景**：这只 Hashmon 就是一个背包！它在 Garden (Game B) 里散步捡到的 "苹果" 和获得的 "Exp"，可以直接存储在自己的 ERC-6551 账户中。当这只 Hashmon 带着自己背包里的物品进入 Battle (Game A) 时，对战游戏能将其解包为“战前增益效果（Buff）”。从而实现真正的**跨游戏状态识别和积累**。

### 10.4 视觉和动画标准化边界
为了消除“不同游戏引擎动画不通用”的问题，我们需要设定清晰的规范边界：
- **协议层**：仅仅提供标准化的视觉骨架（如 2D 标准尺寸的 Sprite Sheet 或 VRM 标准 3D 模型格式）与核心属性（0.0 ~ 1.0 数据）。
- **游戏前端实现层**：不强行规范跨系统特效的通用性。具体的攻击动作（如：喷火、水花特效）全部由所在游戏的引擎负责渲染。平台只验证 NFT 是否拥有 `Move: "ember"` 这个技能标签，而不强制规定每个游戏里火花在视觉上完全一样长什么特征。符合逻辑且极为严密！

---

## 十一、关键注意事项

1. **`playerProfile` 是单例** — 在 `PlayerProfile.js` 底部通过 `export const playerProfile = new PlayerProfile()` 导出。所有场景共享同一个实例，所以在 Web3Scene 中修改数据后，BattleScene 和 InventoryScene 会自动读取到最新值。

2. **搜索 TODO 快速定位** — 在项目中搜索 `// TODO: WEB3 INTEGRATION HERE` 可以找到所有需要你填充的位置。

3. **Hashmon 数据格式** — `HashmonData.js` 中的 `SPECIES` 对象定义了种族模板。如果需要支持用户自定义种族、自定义技能，需要扩展这个数据结构或从链上动态加载。

4. **BattleEngine 无 Phaser 依赖** — `BattleEngine.js` 是纯 JavaScript 逻辑，可以直接在 Node.js 环境中跑单元测试，也可以移植到后端做战斗验证防作弊。

5. **前端按钮已就绪** — Web3Scene 中的 "Connect Wallet"、"Mint NFT"、"Buy Now" 等按钮已经绑定好对应的 `async` 函数，你只需要在函数体内填充实际的合约调用逻辑。

---

如有疑问，可联系前端同学讨论。祝开发顺利！ 🚀
