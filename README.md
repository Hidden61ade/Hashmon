# Hashmon — Complete Project Architecture & Web3 Backend Handoff

> **Document Purpose**: This README is written as a comprehensive agent-to-agent handoff. If you are an AI agent picking up this project, read this document in its entirety before making any changes. It describes the complete frontend architecture, data contracts, integration points, and the precise scope of remaining backend/Web3 work.

> **Last Updated**: 2026-04-15
> **Frontend Status**: ✅ Complete — all game scenes, battle logic, UI, and placeholder Web3 stubs are in place.
> **Backend/Web3 Status**: ⏳ Not started — all blockchain calls are mock/stub. This is your job.

---

## Table of Contents

1. [Project Overview & Goals](#1-project-overview--goals)
2. [Academic Context & Design Rationale](#2-academic-context--design-rationale)
3. [Technology Stack](#3-technology-stack)
4. [How to Run the Project](#4-how-to-run-the-project)
5. [Directory Structure](#5-directory-structure)
6. [Complete File Reference](#6-complete-file-reference)
7. [Architecture Diagram](#7-architecture-diagram)
8. [Data Layer — The Bridge Between Frontend & Backend](#8-data-layer--the-bridge-between-frontend--backend)
9. [Scene-by-Scene Breakdown](#9-scene-by-scene-breakdown)
10. [Web3 Integration Points — TODO Functions](#10-web3-integration-points--todo-functions)
11. [Smart Contract Requirements](#11-smart-contract-requirements)
12. [ERC-6551 Token Bound Accounts](#12-erc-6551-token-bound-accounts)
13. [Normalized Stats & Cross-Game Semantic Mapping](#13-normalized-stats--cross-game-semantic-mapping)
14. [IPFS Metadata Schema](#14-ipfs-metadata-schema)
15. [Backend API Design (If Applicable)](#15-backend-api-design-if-applicable)
16. [Integration Checklist](#16-integration-checklist)
17. [Known Issues & Constraints](#17-known-issues--constraints)

---

## 1. Project Overview & Goals

**Hashmon** is a 2D Web3 monster-battling RPG built with Phaser 3. Think Pokémon, but every monster is an NFT that the player truly owns on-chain. The game demonstrates:

- **Turn-based combat** (Game A — `BattleScene`) with Gen-V damage formulas, PP, STAB, type effectiveness, crits, and stat stages
- **Casual pet garden** (Game B — `GardenScene`) where Hashmon roam, and players interact for coins and EXP
- **NFT minting**: Players design custom Hashmon and mint them as ERC-721 tokens
- **NFT marketplace**: Buy and sell Hashmon NFTs between players
- **Player profile & ranking**: ELO-based rank system (Bronze→Legendary) tracking battle records
- **Cross-game asset portability**: The same NFT is recognized and usable in both Game A and Game B

### Final Goal

When the Web3 integration is complete, the flow should be:

1. Player opens the game → connects MetaMask wallet
2. Player's owned Hashmon NFTs are fetched from the smart contract
3. Player can battle (Game A) or visit the garden (Game B) with **the same NFT-backed Hashmon**
4. Player can mint new Hashmon (→ ERC-721 on-chain + IPFS metadata)
5. Player can buy/sell Hashmon on the marketplace
6. Battle outcomes update the player's ELO rating and win/loss record
7. Garden interactions accumulate state on the Hashmon's ERC-6551 Token Bound Account

---

## 2. Academic Context & Design Rationale

This project is a university coursework submission. The instructor raised specific concerns that shaped the architecture. Understanding these is critical for making correct implementation decisions.

### 2.1 "Dual Controlled Environment" Requirement

The instructor required proof that **the same NFT asset functions in two different game systems**. This is why we have:

- **Game A** (`BattleScene`): Competitive, stat-driven turn-based combat
- **Game B** (`GardenScene`): Casual pet garden with roaming AI

Both scenes read from the **same `PlayerProfile` singleton** and the **same IPFS metadata**. Both use the same `SPECIES` definitions from `HashmonData.js`. The contract and IPFS link must be the single source of truth for both.

### 2.2 "Attribute Semantics" Across Games

The instructor questioned how stats can have meaning across different game types. Our answer is **normalized stats** (0.0–1.0) stored in IPFS metadata, with each game applying its own interpretation:

| Normalized Stat | Game A (Battle) Interpretation | Game B (Garden) Interpretation |
|---|---|---|
| `agility: 0.58` | Speed stat = 58, determines turn order | Movement speed = `50 + 0.58 * 200 = 166px/s` |
| `strength: 0.65` | Attack stat = 65 | (future) Foraging success rate |
| `vitality: 0.60` | HP stat = 60 | (future) Stamina / play duration |

### 2.3 ERC-6551 — Solving "State Accumulation"

The instructor asked: "How does a monster carry state between games?" Answer: **ERC-6551 Token Bound Accounts**. Each Hashmon NFT has its own smart contract wallet. Garden interactions (coins, EXP, items) are stored *in the NFT's own account*, not the player's wallet. When the NFT moves to Battle, the battle system can read those items as pre-battle buffs.

### 2.4 Visual/Animation Standardization Boundary

The protocol layer provides only: standardized sprite sheets (2D) or VRM models (3D) + normalized stat data. Each game engine implements its own visual effects (fire animations, water splashes, etc.). The contract only verifies ownership of move tags like `"ember"`, not what the fire looks like.

---

## 3. Technology Stack

| Layer | Technology | Status | Notes |
|---|---|---|---|
| Game Engine | Phaser 3 (local `phaser.js` file) | ✅ Done | Loaded via `<script>` tag, no CDN |
| Frontend Build | Vanilla ES6 Modules | ✅ Done | No bundler (no webpack/vite) |
| Physics | Phaser Arcade Physics | ✅ Done | Used in GardenScene for roaming |
| Font | `Futile 14.ttf` via CSS FontFace API | ✅ Done | Loaded in PreloaderScene |
| Web3 Library | **Ethers.js v6** (recommended) | ⏳ TODO | Add `<script>` tag or npm install |
| Smart Contracts | **Solidity** (ERC-721 + Marketplace) | ⏳ TODO | Deploy to testnet first |
| NFT Standard | **ERC-721** (with ERC-6551 TBA) | ⏳ TODO | Use ERC721Enumerable for indexing |
| Metadata Storage | **IPFS** (Pinata or Infura) | ⏳ TODO | Store JSON metadata + sprite images |
| Backend (optional) | Node.js / Express | ⏳ TODO | For ELO/ranking if not on-chain |

---

## 4. How to Run the Project

The project is pure frontend. **No `npm install` required.**

```bash
# Option 1: npx http-server
cd /path/to/Hashmon
npx http-server . -p 8080

# Option 2: Python
python -m http.server 8080

# Option 3: VSCode Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8080` in a browser.

> ⚠️ **CRITICAL**: You cannot open `index.html` directly via `file://` protocol. ES Modules and FontFace API require an HTTP server.

### To add Ethers.js

Add this to `index.html` in the `<head>` section:

```html
<script src="https://cdn.ethers.io/lib/ethers-6.umd.min.js"></script>
```

Then `window.ethers` becomes available globally in all scene files.

---

## 5. Directory Structure

```
Hashmon/
├── index.html                              # Entry point (50 lines)
├── phaser.js                               # Phaser 3 engine (local copy)
├── README.md                               # ← THIS FILE
├── WEB3_HANDOFF.md                         # Chinese-language handoff doc (supplementary)
│
├── assets/
│   ├── space.png                           # Dark space background (BattleScene, StartScene, etc.)
│   ├── Garden.png                          # Garden background (GardenScene)
│   ├── coin.png                            # Coin sprite for garden rewards
│   ├── WaterRat.png                        # Water-type Hashmon sprite (32×32 pixel art)
│   ├── FireDragon.png                      # Fire-type Hashmon sprite (32×32 pixel art)
│   ├── Futile 14.ttf                       # Pixel font used for all UI text
│   ├── phaser.png                          # Phaser logo (unused in game)
│   ├── spaceship.png                       # Placeholder (unused in game)
│   ├── Elements-pngs/                      # UI kit: buttons, panels, inventory slots
│   │   ├── Buttons/                        # btn_normal, btn_hover, btn_pressed
│   │   ├── Panels/                         # panel_dark, panel_dark_sm
│   │   ├── Inventory Items/                # inv_normal, inv_hover, inv_selected
│   │   └── Generic or Dialog Boxes/        # dialog_blue
│   ├── button ver 2/                       # Alternative button assets (unused)
│   └── PixelMons Pack by Captainskeleto/   # Extra monster sprites (unused, for expansion)
│
└── src/
    ├── main.js                             # Phaser config, scene registration, physics setup
    │
    ├── data/                               # ★ DATA LAYER — your primary integration target
    │   ├── HashmonData.js                  # Species definitions, moves, type chart, normalized stats
    │   ├── Hashmon.js                      # Runtime battle instance (HP, PP, stat stages)
    │   └── PlayerProfile.js                # ★ Singleton: wallet, ELO, NFTs, coins, marketplace
    │
    ├── battle/
    │   └── BattleEngine.js                 # Pure-logic combat engine (ZERO Phaser dependency)
    │
    └── scenes/
        ├── PreloaderScene.js               # Asset loading + font loading
        ├── StartScene.js                   # Main menu (4 buttons)
        ├── BattleScene.js                  # Game A: Turn-based combat UI
        ├── GardenScene.js                  # Game B: Pet garden with roaming + interaction
        ├── InventoryScene.js               # Hashmon stat viewer / roster inspector
        ├── Web3Scene.js                    # ★ Web3 Hub: 4-tab interface (your main worksite)
        └── Start.js                        # Legacy/unused starter scene (safe to ignore)
```

---

## 6. Complete File Reference

### 6.1 `src/main.js` (37 lines)
**Purpose**: Phaser game configuration and scene registration.

**Key details**:
- Canvas: 1280×720, pixel art mode enabled
- Physics: Arcade (default), used by GardenScene
- Scene load order: Preloader → Start → Web3 → Battle → Inventory → Garden
- Scale mode: FIT with CENTER_BOTH

### 6.2 `src/data/HashmonData.js` (208 lines)
**Purpose**: Central game data registry. This is the **source of truth** for all Hashmon definitions.

**Exports**:
- `TYPE_CHART` — Type effectiveness multipliers (Water→Fire=2.0×, Fire→Water=0.5×, etc.)
- `getTypeEffectiveness(atkType, defType)` — Lookup function
- `MOVES` — Complete move database (13 moves defined), each with: `name`, `type`, `category` (Physical/Special/Status), `power`, `accuracy`, `pp`, `description`, and optional `statChange`
- `SPECIES` — Species definitions with:
  - `baseStats` — 6 stats: `hp`, `atk`, `def`, `spAtk`, `spDef`, `speed` (integers, Pokémon-scale)
  - `baseNormalizedStats` — 5 normalized stats: `strength`, `vitality`, `agility`, `dexterity`, `intelligence` (floats 0.0–1.0, for cross-game use)
  - `textureKey` — Phaser texture key for the sprite
  - `moveKeys` — Array of 4 move keys

**Current species**: `WaterRat` (Water), `FireDragon` (Fire)

> **For Web3 integration**: When fetching NFT metadata from IPFS, the metadata's `species` field maps directly to a key in `SPECIES`. If you support user-created species, you'll need to either extend `SPECIES` dynamically at runtime or create a generic species template that reads stats from the NFT metadata.

### 6.3 `src/data/Hashmon.js` (137 lines)
**Purpose**: Runtime battle instance. Created fresh for each battle from a species template.

**Constructor**: `new Hashmon(speciesKey, level)`
- Computes `maxHp` using Pokémon-style formula: `floor((2*base+31)*level/100) + level + 10`
- Computes other stats: `floor((2*base+31)*level/100) + 5`, then applies stat stage multiplier
- Initializes 4 moves with full PP
- Initializes all stat stages to 0

**Key methods**:
- `getStat(statName)` — Returns effective stat with stage multiplier applied
- `changeStatStage(statName, stages)` — Apply buff/debuff, clamped to [-6, +6]
- `canUseMove(i)` / `usePP(i)` — PP management
- `takeDamage(amount)` / `heal(amount)` — HP management
- `resetForBattle()` — Full reset to pristine state

### 6.4 `src/data/PlayerProfile.js` (124 lines) ★ CRITICAL
**Purpose**: Global singleton holding all player state. This is the **bridge between frontend and blockchain**.

**Singleton pattern**:
```javascript
export const playerProfile = new PlayerProfile();
// Import from any scene:
import { playerProfile } from '../data/PlayerProfile.js';
```

**Current mock fields** (all must be replaced with on-chain / backend data):

| Field | Type | Current Mock Value | Replace With |
|---|---|---|---|
| `walletConnected` | `boolean` | `false` | MetaMask connection state |
| `walletAddress` | `string\|null` | `null` | `eth_requestAccounts` result |
| `username` | `string` | `'Trainer'` | On-chain profile or ENS name |
| `coins` | `number` | `0` | ERC-6551 TBA balance or backend |
| `elo` | `number` | `1150` | On-chain or backend database |
| `wins` | `number` | `12` | On-chain or backend database |
| `losses` | `number` | `5` | On-chain or backend database |
| `totalBattles` | `number` | `17` | Computed from wins+losses |
| `ownedHashmon[]` | `Array` | 2 mock NFTs | `balanceOf` + `tokenURI` from contract |
| `marketplaceListings[]` | `Array` | 3 mock listings | Marketplace contract query |

**Each `ownedHashmon` entry shape**:
```javascript
{
    tokenId: '#0001',           // On-chain token ID
    speciesKey: 'WaterRat',     // Maps to SPECIES in HashmonData.js
    nickname: 'Bubbles',        // From IPFS metadata
    level: 10,                  // From IPFS metadata
    mintedBy: '0x7a3b...f91d',  // Original minter address
    isOriginalMinter: true,     // Compare mintedBy with current wallet
}
```

**Each `marketplaceListings` entry shape**:
```javascript
{
    tokenId: '#0108',
    speciesKey: 'FireDragon',
    nickname: 'Inferno',
    level: 15,
    price: '0.05 ETH',          // Listing price in ETH
    seller: '0x9f2a...b301',    // Seller wallet address
}
```

**Methods (already implemented, work correctly)**:
- `getRank()` — Returns current rank tier object based on ELO
- `getWinRate()` — Returns formatted win rate string
- `recordWin()` — Increments wins, total, ELO +25
- `recordLoss()` — Increments losses, total, ELO -20 (min 0)

**Rank tiers** (exported as `RANKS`):

| Rank | Min ELO | Color |
|---|---|---|
| Bronze | 0 | `#cd7f32` |
| Silver | 1000 | `#c0c0c0` |
| Gold | 1400 | `#ffd700` |
| Platinum | 1700 | `#44dddd` |
| Diamond | 2000 | `#aa88ff` |
| Legendary | 2500 | `#ff4488` |

### 6.5 `src/battle/BattleEngine.js` (264 lines)
**Purpose**: Pure-logic turn-based battle engine. **Zero Phaser dependencies.** Can be run in Node.js for server-side battle validation.

**Constructor**: `new BattleEngine(playerMon, enemyMon)` — takes two `Hashmon` instances

**Core method**: `resolveTurn(playerMoveIndex)` → returns `BattleEvent[]`

**Damage formula** (Gen-V Pokémon):
```
levelFactor = (2 * level / 5) + 2
baseDamage = ((levelFactor * power * (atk / def)) / 50) + 2
finalDamage = baseDamage * STAB * typeEffectiveness * random(0.85-1.0) * critMultiplier
```

**Event types returned**: `use_move`, `damage`, `miss`, `no_pp`, `stat_change`, `log`, `faint`

**Enemy AI**: Random move selection from moves with remaining PP.

> **For anti-cheat**: This engine can be **copied to a Node.js backend** to validate battle results server-side before updating ELO.

### 6.6 `src/scenes/Web3Scene.js` (576 lines) ★ YOUR MAIN WORKSITE

**Purpose**: 4-tab Web3 hub with all blockchain interaction stubs.

**Tab layout**:

| Tab | Method | What it shows |
|---|---|---|
| Profile | `drawProfileTab()` | Avatar, wallet, rank badge, ELO progress bar, W/L record |
| My NFTs | `drawMyNftsTab()` | Card grid of owned Hashmon with sprites, stats, minter badge |
| Create & Mint | `drawCreateTab()` | Mock form: nickname, species, type, stat bars, mint cost |
| Marketplace | `drawMarketTab()` | Listing rows with sprites, seller info, price, buy buttons |

**Stub functions to implement** (all marked with `// TODO: WEB3 INTEGRATION HERE`):
- `connectWallet()` — Line 462
- `fetchNFTs()` — Line 477
- `mintHashmon()` — Line 488
- `evolveHashmon(tokenId1, tokenId2)` — Line 501
- `buyHashmon(listing)` — Line 511
- `listHashmonForSale(tokenId, priceInEth)` — Line 522

### 6.7 `src/scenes/BattleScene.js` (512 lines)
**Purpose**: Game A — Full Pokémon-style turn-based battle UI.

**Layout** (1280×720):
- Top center: Battle log (500×80px, scrolling 4 lines)
- Mid-left: Player sprite + HUD card (HP bar, level)
- Mid-right: Enemy sprite + HUD card
- Bottom panel (200px tall): Left = move info on hover, Right = 2×2 skill button grid
- Top-right: Player rank badge (rank initial + W/L record)

**Integration with PlayerProfile**:
- On battle win: calls `playerProfile.recordWin()`, logs `+25 ELO`
- On battle loss: calls `playerProfile.recordLoss()`, logs `-20 ELO`
- After 3 seconds, auto-returns to StartScene

**Current limitation**: Always spawns WaterRat vs FireDragon at Lv10. In the future, this should use the player's selected NFT Hashmon from their wallet.

### 6.8 `src/scenes/GardenScene.js` (188 lines)
**Purpose**: Game B — Casual pet garden demonstrating cross-game NFT compatibility.

**Key behaviors**:
- Spawns all Hashmon from `playerProfile.ownedHashmon[]`
- Each sprite's movement speed is determined by **normalized `agility` stat** from `baseNormalizedStats`: `speed = 50 + agility * 200`
- Hashmon roam randomly with Arcade physics (random direction, random pause/move intervals)
- Click interaction: 40% chance → +1 Coin, 30% → Exp +10, 30% → "Happy!"
- Coins are stored in `playerProfile.coins`
- Floating text feedback with tween animation
- Name labels follow sprites

**ERC-6551 integration point**: When a player clicks a Hashmon and earns coins/EXP, that should be written to the Hashmon's own Token Bound Account on-chain.

### 6.9 `src/scenes/InventoryScene.js` (283 lines)
**Purpose**: Hashmon roster viewer with detailed stat inspection.

**Layout**: Left panel = roster list (clickable slots), Right panel = detail card with:
- Large sprite, name, type, level, HP
- 6 stat bars (HP/ATK/DEF/SP.ATK/SP.DEF/SPD) showing both effective value and base value
- 4 move cards showing name, type, category, power, accuracy, PP

### 6.10 `src/scenes/PreloaderScene.js` (61 lines)
**Purpose**: Load all game assets + custom font before any scene runs.

**Assets loaded**:
- `space_bg`, `garden_bg`, `coin`, `water_rat`, `fire_dragon`
- UI panels: `panel_dark`, `panel_dark_sm`
- Buttons: `btn_normal`, `btn_hover`, `btn_pressed`
- Inventory slots: `inv_normal`, `inv_hover`, `inv_selected`
- Dialog: `dialog_blue`
- Font: `Futile` via `FontFace` API (async, waits for load before proceeding)

### 6.11 `src/scenes/StartScene.js` (91 lines)
**Purpose**: Main menu with 4 navigation buttons.

**Buttons**:
1. "Start Local Demo (Battle)" → `BattleScene`
2. "My Hashmon" → `InventoryScene`
3. "Hashmon Garden" → `GardenScene`
4. "Connect Wallet" → `Web3Scene`

---

## 7. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        index.html                               │
│   <script src="phaser.js">                                      │
│   <script type="module" src="src/main.js">                      │
│   (TODO: <script src="ethers-6.umd.min.js">)                   │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  main.js — Phaser.Game config                                   │
│  Scenes: [Preloader, Start, Web3, Battle, Inventory, Garden]    │
│  Physics: Arcade                                                │
└───────────────────┬─────────────────────────────────────────────┘
                    │
    ┌───────────────┼─────────────────────────────┐
    │               │                             │
    ▼               ▼                             ▼
┌─────────┐  ┌────────────┐  ┌──────────────────────────────────┐
│ Scenes  │  │  Data Layer │  │       Battle Engine              │
│         │  │  (shared)   │  │  (pure JS, no Phaser dep)        │
│ Start ──┤  │             │  │                                  │
│ Battle ─┤  │ HashmonData │  │  • Gen-V damage formula          │
│ Garden ─┤  │ Hashmon     │  │  • PP system                     │
│ Inv.  ──┤  │ ★PlayerProf │  │  • Stat stages ±6               │
│ Web3  ──┤  │             │  │  • Type effectiveness            │
│ Preload │  └──────┬──────┘  │  • STAB, crits, accuracy         │
└─────────┘         │         │  • Enemy AI (random)             │
                    │         └──────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐    ┌─────────────────────────┐
│ playerProfile │    │  SPECIES / MOVES / TYPES │
│  (singleton)  │    │  (static game data)      │
│               │    └─────────────────────────┘
│ • wallet      │
│ • elo/rank    │         ▲ (future: dynamic load from IPFS)
│ • ownedNFTs[] │         │
│ • coins       │    ┌────┴────────────────────────────────────┐
│ • market[]    │    │         BLOCKCHAIN LAYER (TODO)          │
│               │    │                                          │
│  ← hydrate ───┤◄───│  ERC-721 Contract (mint, transfer, URI) │
│    from chain  │    │  Marketplace Contract (list, buy, cancel)│
│               │    │  ERC-6551 Registry (TBA per NFT)        │
│               │    │  IPFS (Pinata/Infura) for metadata      │
└───────────────┘    └──────────────────────────────────────────┘
```

---

## 8. Data Layer — The Bridge Between Frontend & Backend

The data layer (`src/data/`) is the **only place** the blockchain developer needs to modify for basic integration. The scenes read from these modules and render accordingly.

### Data Flow: Wallet Connect → Game Ready

```
1. User clicks "Connect Wallet" (Web3Scene or StartScene)
2. → connectWallet() in Web3Scene.js
3.   → ethers.BrowserProvider(window.ethereum)
4.   → eth_requestAccounts
5.   → playerProfile.walletConnected = true
6.   → playerProfile.walletAddress = address
7. → fetchNFTs()
8.   → contract.balanceOf(address) → count
9.   → for each: contract.tokenOfOwnerByIndex(address, i) → tokenId
10.  → for each: contract.tokenURI(tokenId) → IPFS URL
11.  → for each: fetch(ipfsURL) → JSON metadata
12.  → parse metadata → push to playerProfile.ownedHashmon[]
13. → UI refreshes automatically (scenes re-read playerProfile)
```

### Data Flow: Mint New Hashmon

```
1. User fills form in Web3Scene "Create & Mint" tab
2. → mintHashmon() called
3.   → Build metadata JSON object
4.   → Upload metadata JSON to IPFS (Pinata SDK)
5.   → Get back ipfs://Qm... URI
6.   → contract.mint(walletAddress, ipfsURI) — user pays gas
7.   → Wait for transaction receipt
8.   → Parse receipt for tokenId
9.   → Push new entry to playerProfile.ownedHashmon[]
10.  → Switch to "My NFTs" tab to show the new NFT
```

### Data Flow: Battle End → ELO Update

```
1. BattleEngine.isBattleOver() returns true
2. BattleScene.handleBattleEnd() called
3.   → playerProfile.recordWin() or recordLoss()
4.   → ELO updated in memory (+25 or -20)
5.   → (TODO) Send signed result to backend API or on-chain
6.   → After 3s delay, return to StartScene
```

---

## 9. Scene-by-Scene Breakdown

### Scene Navigation Map

```
PreloaderScene
    └──→ StartScene
            ├──→ BattleScene ──→ (auto-return after battle end)
            ├──→ InventoryScene
            ├──→ GardenScene
            └──→ Web3Scene
```

All scenes use `this.scene.start('SceneName')` for navigation (full scene replacement, not overlay).

---

## 10. Web3 Integration Points — TODO Functions

Search for `// TODO: WEB3 INTEGRATION HERE` in the codebase. All 6 stubs are in `Web3Scene.js`.

### 10.1 `connectWallet()` — Line 462

```javascript
async connectWallet() {
    // CURRENT: Mock — sets walletConnected=true, address='0x7a3b...f91d'
    // REPLACE WITH:
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    
    playerProfile.walletConnected = true;
    playerProfile.walletAddress = await signer.getAddress();
    
    await this.fetchNFTs();
    this.updateWalletStatus();
    this.showTab(this.currentTab);
}
```

### 10.2 `fetchNFTs()` — Line 477

```javascript
async fetchNFTs() {
    // CURRENT: No-op (mock data in PlayerProfile constructor)
    // REPLACE WITH:
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const balance = await contract.balanceOf(playerProfile.walletAddress);
    
    playerProfile.ownedHashmon = [];
    for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(playerProfile.walletAddress, i);
        const tokenURI = await contract.tokenURI(tokenId);
        // tokenURI is like "ipfs://QmXxx..."
        // Convert to HTTP gateway: "https://gateway.pinata.cloud/ipfs/QmXxx..."
        const metadata = await fetch(gatewayURL).then(r => r.json());
        
        playerProfile.ownedHashmon.push({
            tokenId: tokenId.toString(),
            speciesKey: metadata.attributes.species,   // Must match SPECIES keys
            nickname: metadata.name,
            level: metadata.attributes.level,
            mintedBy: metadata.attributes.mintedBy,
            isOriginalMinter: metadata.attributes.mintedBy === playerProfile.walletAddress,
        });
    }
}
```

### 10.3 `mintHashmon()` — Line 488

```javascript
async mintHashmon() {
    // CURRENT: Console logs only
    // REPLACE WITH:
    // 1. Collect form data (currently mock — need DOM overlay or Phaser input plugin)
    // 2. Build metadata JSON (see IPFS Metadata Schema section)
    // 3. Upload to IPFS via Pinata:
    //    const res = await pinata.upload.json(metadata);
    //    const tokenURI = `ipfs://${res.IpfsHash}`;
    // 4. Mint:
    //    const signer = await provider.getSigner();
    //    const contractWithSigner = contract.connect(signer);
    //    const tx = await contractWithSigner.mint(walletAddress, tokenURI);
    //    const receipt = await tx.wait();
    // 5. Update playerProfile.ownedHashmon[]
    // 6. Refresh UI: this.showTab('myNfts')
}
```

### 10.4 `buyHashmon(listing)` — Line 511

```javascript
async buyHashmon(listing) {
    // CURRENT: Console logs only
    // REPLACE WITH:
    // 1. const priceWei = ethers.parseEther(listing.price.replace(' ETH', ''));
    // 2. const signer = await provider.getSigner();
    // 3. const tx = await marketplace.buyItem(listing.tokenId, { value: priceWei });
    // 4. await tx.wait();
    // 5. Move listing from marketplaceListings to ownedHashmon
    // 6. Refresh UI
}
```

### 10.5 `evolveHashmon(tokenId1, tokenId2)` — Line 501

```javascript
// Burns 2 NFTs, mints 1 evolved NFT with boosted stats.
// Contract: evolve(uint256 tokenId1, uint256 tokenId2) → mints new token
```

### 10.6 `listHashmonForSale(tokenId, priceInEth)` — Line 522

```javascript
// List player's NFT on marketplace.
// 1. Approve marketplace contract to transfer the NFT
// 2. Call marketplace.listItem(tokenId, priceInWei)
// 3. Move from ownedHashmon to marketplaceListings
```

---

## 11. Smart Contract Requirements

### 11.1 Hashmon NFT Contract (ERC-721)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract HashmonNFT is ERC721Enumerable, ERC721URIStorage {
    uint256 private _nextTokenId;
    uint256 public mintPrice = 0.02 ether;

    // Core functions needed by the frontend:
    function mint(address to, string memory tokenURI) external payable returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    // ERC721Enumerable provides:
    //   balanceOf(address) → uint256
    //   tokenOfOwnerByIndex(address, uint256) → uint256
    
    // Optional: evolve function
    function evolve(uint256 tokenId1, uint256 tokenId2) external returns (uint256);
}
```

### 11.2 Marketplace Contract

```solidity
contract HashmonMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    mapping(uint256 => Listing) public listings;
    
    // Core functions needed by the frontend:
    function listItem(uint256 tokenId, uint256 price) external;
    function buyItem(uint256 tokenId) external payable;
    function cancelListing(uint256 tokenId) external;
    function getActiveListings() external view returns (uint256[] memory tokenIds, Listing[] memory);
}
```

---

## 12. ERC-6551 Token Bound Accounts

**Standard**: [EIP-6551](https://eips.ethereum.org/EIPS/eip-6551)

**Concept**: Each Hashmon NFT gets its own smart contract wallet (Token Bound Account / TBA). This wallet can:
- Hold ERC-20 tokens (e.g., garden coins)
- Hold ERC-1155 items (e.g., potions, berries)
- Store key-value state data (e.g., experience, happiness)

**Implementation sketch**:

```solidity
// Deploy ERC-6551 Registry (or use existing deployment)
// For each minted Hashmon, create a TBA:
address tba = registry.createAccount(
    implementation,    // TBA implementation contract
    chainId,
    hashmonContractAddress,
    tokenId,
    salt,
    initData
);

// Now the Hashmon NFT at tokenId owns the wallet at `tba`
// Garden scene writes: tba.execute(coinContract, 0, transferData, 0)
// Battle scene reads: coinContract.balanceOf(tba) to check items
```

**Frontend integration points**:
- `GardenScene.interactWithHashmon()` — When coins/EXP are earned, write to the Hashmon's TBA
- `BattleScene.create()` — Read the Hashmon's TBA for pre-battle buffs
- `Web3Scene.drawMyNftsTab()` — Show each NFT's TBA balance (coins, items, EXP)

---

## 13. Normalized Stats & Cross-Game Semantic Mapping

Each species in `HashmonData.js` has a `baseNormalizedStats` object with values from 0.0 to 1.0.

```javascript
baseNormalizedStats: {
    strength: 0.48,     // → Game A: ATK stat | Game C: melee damage
    vitality: 0.55,     // → Game A: HP stat  | Game C: health pool
    agility: 0.58,      // → Game A: Speed    | Game B: move speed
    dexterity: 0.45,    // → Game A: DEF stat | Game C: dodge chance
    intelligence: 0.62  // → Game A: SP.ATK   | Game C: mana pool
}
```

**How Game A uses them** (in `BattleEngine.js` via `HashmonData.js`):
- `strength * 100 → atk base stat (48)`
- `agility * 100 → speed base stat (58)`

**How Game B uses them** (in `GardenScene.js`, line 76-77):
```javascript
const agility = speciesData.baseNormalizedStats.agility; // 0.58
sprite.targetSpeed = 50 + (agility * 200); // = 166 pixels/sec
```

**IPFS metadata must include both**:
- `stats` (game-specific integers) for backward compatibility
- `normalizedStats` (0.0–1.0 floats) for cross-game portability

---

## 14. IPFS Metadata Schema

This is the **canonical metadata format** that should be stored on IPFS for each minted Hashmon NFT.

```json
{
    "name": "Bubbles",
    "description": "A WaterRat Hashmon minted on the Hashmon protocol.",
    "image": "ipfs://QmXxx.../waterrat.png",
    "external_url": "https://hashmon.game/nft/0001",
    
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
        
        "normalizedStats": {
            "strength": 0.48,
            "vitality": 0.55,
            "agility": 0.58,
            "dexterity": 0.45,
            "intelligence": 0.62
        },
        
        "moves": ["splash", "aquaJet", "bite", "defend"],
        
        "mintedBy": "0x7a3b...f91d",
        "mintDate": "2026-03-28",
        "originalSpeciesTemplate": true
    }
}
```

> **Note**: The `species` field value **must** match a key in `SPECIES` from `HashmonData.js`, or the frontend will fail to render the Hashmon. For user-created species, you may need to add a fallback rendering path.

---

## 15. Backend API Design (If Applicable)

If ELO and battle records are stored off-chain (recommended to avoid gas costs), you need a simple REST API:

### Endpoints

```
POST /api/battle/result
  Body: { walletAddress, opponentAddress, result: "win"|"loss", signature }
  Response: { newElo, rank, wins, losses }
  
GET /api/profile/:walletAddress
  Response: { username, elo, rank, wins, losses, totalBattles }
  
GET /api/leaderboard?limit=50
  Response: [{ walletAddress, username, elo, rank, wins }]
```

### Anti-Cheat

The `BattleEngine.js` is pure JavaScript with zero Phaser dependencies. You can run it server-side:

```javascript
// Server-side battle validation
import { BattleEngine } from './src/battle/BattleEngine.js';
import { Hashmon } from './src/data/Hashmon.js';

const player = new Hashmon('WaterRat', 10);
const enemy = new Hashmon('FireDragon', 10);
const engine = new BattleEngine(player, enemy);

// Replay the exact move sequence the client claims happened
// Compare results to detect cheating
```

---

## 16. Integration Checklist

Use this checklist to track progress:

### Phase 1: Wallet Connection
- [ ] Add Ethers.js script tag to `index.html`
- [ ] Implement `connectWallet()` in `Web3Scene.js`
- [ ] Test with MetaMask on a testnet (Sepolia/Goerli)

### Phase 2: Smart Contracts
- [ ] Write and deploy `HashmonNFT.sol` (ERC721Enumerable + URIStorage)
- [ ] Write and deploy `HashmonMarketplace.sol`
- [ ] Verify contracts on Etherscan
- [ ] Store contract addresses and ABIs in a new `src/data/ContractConfig.js`

### Phase 3: IPFS Integration
- [ ] Set up Pinata or Infura IPFS account
- [ ] Implement metadata JSON upload for minting
- [ ] Upload Hashmon sprite images to IPFS
- [ ] Store IPFS gateway URL in config

### Phase 4: Core Web3 Functions
- [ ] Implement `fetchNFTs()` — read owned NFTs from contract
- [ ] Implement `mintHashmon()` — full mint flow with IPFS upload
- [ ] Implement `buyHashmon()` — marketplace purchase
- [ ] Implement `listHashmonForSale()` — marketplace listing

### Phase 5: ERC-6551 (Advanced)
- [ ] Deploy ERC-6551 Registry
- [ ] Deploy TBA Implementation contract
- [ ] Create TBA for each minted Hashmon
- [ ] Write garden interactions to TBA
- [ ] Read TBA state in battle scene for buffs

### Phase 6: Backend (If Applicable)
- [ ] Set up Node.js/Express server
- [ ] Implement ELO tracking API
- [ ] Implement battle result validation
- [ ] Connect `BattleScene.handleBattleEnd()` to API
- [ ] Implement leaderboard endpoint

### Phase 7: Polish
- [ ] Add loading spinners during blockchain transactions
- [ ] Add transaction confirmation toasts
- [ ] Handle wallet disconnect/switch events
- [ ] Add error handling for failed transactions
- [ ] Implement the "Create & Mint" form with actual DOM overlay inputs

---

## 17. Known Issues & Constraints

1. **No bundler**: The project uses raw ES6 modules. If you need to import npm packages (like `ethers`), either use the UMD build via `<script>` tag or introduce a bundler (Vite recommended).

2. **CORS**: The project must be served via HTTP, not `file://`. The font loading and ES modules both require a real HTTP server.

3. **Static roster in BattleScene**: Currently `BattleScene` always creates `WaterRat` vs `FireDragon` at Lv10. After Web3 integration, it should use the player's selected NFT Hashmon. You'll need to pass the selected NFT data to BattleScene (e.g., via `this.scene.start('BattleScene', { selectedNft: ... })`).

4. **Static roster in InventoryScene**: Same issue — currently hardcoded. Should read from `playerProfile.ownedHashmon` and create `Hashmon` instances dynamically.

5. **Create & Mint form**: The form fields in the "Create & Mint" tab are currently just rendered text (not actual input fields). To accept real user input, you'll need either:
   - Phaser's DOM Element game objects via `this.add.dom()`
   - A transparent HTML overlay positioned above the Phaser canvas
   - Phaser's RexUI plugin for in-canvas text input

6. **`Start.js` is legacy**: The file `src/scenes/Start.js` is an old Phaser template scene. It's not registered in `main.js` and can be safely deleted.

7. **Sprite assets are 32×32 pixel art**: The sprites are tiny and are scaled up (3x-4x) in-game. For NFT images on IPFS, you may want higher-resolution versions.

8. **`PixelMons Pack by Captainskeleto/`**: There's an unused monster sprite pack in assets. These could be used to expand the species roster but are not yet integrated into `HashmonData.js`.

---

*This document was written by the frontend development agent and is intended for the backend/Web3 development agent. If anything is unclear, examine the source files directly — they are thoroughly commented.*
