/**
 * Web3Scene.js
 * ──────────────────────────────────────────────────────────────
 * Web3 hub with 4 tabs:
 *   1. PROFILE  — wallet address, rank, W/L record, ELO
 *   2. MY NFTs  — owned Hashmon collection
 *   3. CREATE   — design & mint a new Hashmon NFT
 *   4. MARKET   — browse & buy Hashmon from other players
 *
 * All blockchain calls are stubbed with // TODO: WEB3 markers.
 * ──────────────────────────────────────────────────────────────
 */
import { playerProfile, RANKS } from '../data/PlayerProfile.js';
import { SPECIES } from '../data/HashmonData.js';

export class Web3Scene extends Phaser.Scene {
    constructor() {
        super('Web3Scene');
    }

    create() {
        const W = this.sys.game.config.width;
        const H = this.sys.game.config.height;

        // Background
        const bg = this.add.image(0, 0, 'space_bg').setOrigin(0);
        bg.displayWidth = W;
        bg.displayHeight = H;

        // Header
        this.add.text(W / 2, 30, 'HASHMON  Web3 Hub', {
            fontFamily: 'Futile', fontSize: '40px', color: '#00ffcc',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);

        // Wallet status bar
        this.walletText = this.add.text(W - 20, 20, '', {
            fontFamily: 'Futile', fontSize: '14px', color: '#88ffaa',
        }).setOrigin(1, 0);
        this.updateWalletStatus();

        // ── Tab system ──
        this.currentTab = 'profile';
        this.contentGroup = this.add.group(); // cleared on tab switch

        this.createTabs();
        this.showTab('profile');

        // ── Bottom: Back button ──
        this.createButton(W / 2, H - 35, 'Back to Menu', () => this.scene.start('StartScene'));
    }

    // ═══════════════════════════════════════════════════════════
    // TAB BAR
    // ═══════════════════════════════════════════════════════════

    createTabs() {
        const tabs = [
            { key: 'profile', label: 'Profile' },
            { key: 'myNfts', label: 'My NFTs' },
            { key: 'create', label: 'Create & Mint' },
            { key: 'market', label: 'Marketplace' },
        ];
        const startX = 180;
        const gap = 260;
        const y = 75;

        this.tabButtons = [];

        tabs.forEach((tab, i) => {
            const x = startX + i * gap;

            const tabBg = this.add.graphics();
            const tabText = this.add.text(x, y, tab.label, {
                fontFamily: 'Futile', fontSize: '18px', color: '#aaaacc',
            }).setOrigin(0.5);

            const hitArea = this.add.rectangle(x, y, 220, 30).setInteractive().setAlpha(0.001);

            hitArea.on('pointerup', () => this.showTab(tab.key));
            hitArea.on('pointerover', () => { if (this.currentTab !== tab.key) tabText.setColor('#ffffff'); });
            hitArea.on('pointerout', () => { if (this.currentTab !== tab.key) tabText.setColor('#aaaacc'); });

            this.tabButtons.push({ key: tab.key, bg: tabBg, text: tabText, x, y });
        });
    }

    refreshTabHighlights() {
        this.tabButtons.forEach(tb => {
            const isSel = tb.key === this.currentTab;
            tb.bg.clear();
            if (isSel) {
                tb.bg.fillStyle(0x224488, 0.6);
                tb.bg.fillRoundedRect(tb.x - 110, tb.y - 15, 220, 30, 6);
            }
            tb.text.setColor(isSel ? '#ffcc00' : '#aaaacc');
        });
    }

    showTab(key) {
        this.currentTab = key;
        this.refreshTabHighlights();
        this.contentGroup.clear(true, true);

        switch (key) {
            case 'profile': this.drawProfileTab(); break;
            case 'myNfts':  this.drawMyNftsTab(); break;
            case 'create':  this.drawCreateTab(); break;
            case 'market':  this.drawMarketTab(); break;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // TAB 1: PROFILE — Wallet, Rank, Battle Record
    // ═══════════════════════════════════════════════════════════

    drawProfileTab() {
        const cx = this.cameras.main.centerX;
        const pp = playerProfile;
        const rank = pp.getRank();

        // ── Profile Card ──
        const cardX = cx - 300;
        const cardY = 120;
        const cardW = 600;
        const cardH = 480;

        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x0e0e2a, 0.9);
        cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 14);
        cardBg.lineStyle(2, 0x3344aa, 0.5);
        cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 14);
        this.contentGroup.add(cardBg);

        // Avatar placeholder circle
        const avatar = this.add.graphics();
        avatar.fillStyle(0x224466, 1);
        avatar.fillCircle(cardX + 80, cardY + 80, 50);
        avatar.lineStyle(3, 0x4488cc, 0.8);
        avatar.strokeCircle(cardX + 80, cardY + 80, 50);
        this.contentGroup.add(avatar);

        const avatarIcon = this.addText(cardX + 80, cardY + 80, '👤', '36px', '#ffffff').setOrigin(0.5);
        this.contentGroup.add(avatarIcon);

        // Username
        this.contentGroup.add(this.addText(cardX + 150, cardY + 40, pp.username, '32px', '#ffffff'));

        // Wallet address
        const addrLabel = pp.walletConnected
            ? `Wallet: ${pp.walletAddress}`
            : 'Wallet: Not Connected';
        this.contentGroup.add(this.addText(cardX + 150, cardY + 80, addrLabel, '14px', '#77aa99'));

        // Connect Wallet button
        if (!pp.walletConnected) {
            this.createContentButton(cardX + 150, cardY + 115, 'Connect Wallet', () => this.connectWallet());
        }

        // ── Rank Section ──
        const rankY = cardY + 170;
        this.contentGroup.add(this.addText(cardX + 30, rankY, 'RANK', '16px', '#888899'));

        // Rank badge
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x1a1a3a, 1);
        badgeBg.fillRoundedRect(cardX + 30, rankY + 25, 540, 70, 10);
        this.contentGroup.add(badgeBg);

        // Rank diamond icon
        const diamondBg = this.add.graphics();
        diamondBg.fillStyle(Phaser.Display.Color.HexStringToColor(rank.color).color, 0.3);
        diamondBg.fillCircle(cardX + 75, rankY + 60, 25);
        this.contentGroup.add(diamondBg);

        this.contentGroup.add(this.addText(cardX + 75, rankY + 60, rank.name.charAt(0), '28px', rank.color).setOrigin(0.5));
        this.contentGroup.add(this.addText(cardX + 115, rankY + 40, rank.name, '26px', rank.color));
        this.contentGroup.add(this.addText(cardX + 115, rankY + 70, `ELO: ${pp.elo}`, '16px', '#aabbcc'));

        // ELO progress to next rank
        const nextRank = RANKS.find(r => r.minElo > pp.elo);
        if (nextRank) {
            const prevMin = rank.minElo;
            const progress = (pp.elo - prevMin) / (nextRank.minElo - prevMin);
            const barX = cardX + 300;
            const barW = 260;

            this.contentGroup.add(this.addText(barX, rankY + 40, `Next: ${nextRank.name}`, '14px', '#888899'));
            const pBarBg = this.add.graphics();
            pBarBg.fillStyle(0x222244, 1);
            pBarBg.fillRoundedRect(barX, rankY + 62, barW, 12, 3);
            this.contentGroup.add(pBarBg);
            const pBarFg = this.add.graphics();
            pBarFg.fillStyle(Phaser.Display.Color.HexStringToColor(nextRank.color).color, 1);
            pBarFg.fillRoundedRect(barX, rankY + 62, barW * progress, 12, 3);
            this.contentGroup.add(pBarFg);
        }

        // ── Battle Record Section ──
        const recY = rankY + 120;
        this.contentGroup.add(this.addText(cardX + 30, recY, 'BATTLE RECORD', '16px', '#888899'));

        const statBoxes = [
            { label: 'Wins', value: pp.wins, color: '#44cc66' },
            { label: 'Losses', value: pp.losses, color: '#cc4444' },
            { label: 'Total', value: pp.totalBattles, color: '#cccccc' },
            { label: 'Win Rate', value: pp.getWinRate(), color: '#ffcc44' },
        ];
        statBoxes.forEach((s, i) => {
            const sx = cardX + 30 + i * 138;
            const sy = recY + 28;
            const boxBg = this.add.graphics();
            boxBg.fillStyle(0x1a1a3a, 1);
            boxBg.fillRoundedRect(sx, sy, 126, 60, 8);
            this.contentGroup.add(boxBg);
            this.contentGroup.add(this.addText(sx + 63, sy + 14, String(s.value), '24px', s.color).setOrigin(0.5));
            this.contentGroup.add(this.addText(sx + 63, sy + 42, s.label, '13px', '#888899').setOrigin(0.5));
        });

        // ── Owned Hashmon count ──
        const ownY = recY + 110;
        this.contentGroup.add(this.addText(cardX + 30, ownY, `Hashmon Owned: ${pp.ownedHashmon.length}`, '18px', '#aabbcc'));
    }

    // ═══════════════════════════════════════════════════════════
    // TAB 2: MY NFTs — Owned Hashmon cards
    // ═══════════════════════════════════════════════════════════

    drawMyNftsTab() {
        const pp = playerProfile;
        const startX = 80;
        const startY = 120;
        const cardW = 360;
        const cardH = 220;
        const gap = 40;

        if (pp.ownedHashmon.length === 0) {
            this.contentGroup.add(this.addText(this.cameras.main.centerX, 350,
                'No Hashmon yet! Mint or buy one.', '24px', '#888899').setOrigin(0.5));
            return;
        }

        pp.ownedHashmon.forEach((nft, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = startX + col * (cardW + gap);
            const cy = startY + row * (cardH + gap);

            const species = SPECIES[nft.speciesKey];

            // Card bg
            const cardBg = this.add.graphics();
            cardBg.fillStyle(0x111133, 0.9);
            cardBg.fillRoundedRect(cx, cy, cardW, cardH, 10);
            cardBg.lineStyle(2, nft.isOriginalMinter ? 0x44cc88 : 0x4466aa, 0.6);
            cardBg.strokeRoundedRect(cx, cy, cardW, cardH, 10);
            this.contentGroup.add(cardBg);

            // Sprite
            this.contentGroup.add(this.add.image(cx + 55, cy + 80, species.textureKey).setScale(2.5));

            // Token ID
            this.contentGroup.add(this.addText(cx + 120, cy + 14, nft.tokenId, '14px', '#666688'));

            // Nickname
            this.contentGroup.add(this.addText(cx + 120, cy + 35, `"${nft.nickname}"`, '22px', '#ffffff'));

            // Species + Level
            this.contentGroup.add(this.addText(cx + 120, cy + 65, `${species.name}  Lv${nft.level}`, '16px', '#aabbcc'));

            // Type
            const typeColors = { Water: '#3399ff', Fire: '#ff6633', Grass: '#33cc66', Normal: '#cccccc', Dark: '#9966cc' };
            this.contentGroup.add(this.addText(cx + 120, cy + 90, `Type: ${species.type}`, '14px', typeColors[species.type] || '#fff'));

            // Minted by
            this.contentGroup.add(this.addText(cx + 120, cy + 115, `Minted by: ${nft.mintedBy}`, '12px', '#555577'));

            // Original minter badge
            if (nft.isOriginalMinter) {
                this.contentGroup.add(this.addText(cx + 120, cy + 135, '★ Original Creator', '13px', '#44cc88'));
            } else {
                this.contentGroup.add(this.addText(cx + 120, cy + 135, '◆ Acquired via Market', '13px', '#6688aa'));
            }

            // Base stats summary
            const bst = Object.values(species.baseStats).reduce((a, b) => a + b, 0);
            this.contentGroup.add(this.addText(cx + 15, cy + cardH - 30, `BST: ${bst}`, '14px', '#888899'));

            // View in Inventory button
            this.createContentButton(cx + cardW - 80, cy + cardH - 30, 'View Stats', () => {
                this.scene.start('InventoryScene');
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // TAB 3: CREATE & MINT — Design a new Hashmon
    // ═══════════════════════════════════════════════════════════

    drawCreateTab() {
        const cx = this.cameras.main.centerX;
        const cardX = cx - 350;
        const cardY = 120;

        // Main panel
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x0e0e2a, 0.9);
        cardBg.fillRoundedRect(cardX, cardY, 700, 480, 14);
        cardBg.lineStyle(2, 0x3344aa, 0.5);
        cardBg.strokeRoundedRect(cardX, cardY, 700, 480, 14);
        this.contentGroup.add(cardBg);

        this.contentGroup.add(this.addText(cx, cardY + 25, 'Create Your Own Hashmon', '28px', '#ffcc00').setOrigin(0.5));
        this.contentGroup.add(this.addText(cx, cardY + 60, 'Design a unique creature and mint it as an NFT on-chain', '14px', '#888899').setOrigin(0.5));

        // ── Form Fields (mock) ──
        const fieldX = cardX + 40;
        let fieldY = cardY + 100;
        const fieldGap = 55;

        const fields = [
            { label: 'Nickname', placeholder: 'Enter a name...', value: 'My Hashmon' },
            { label: 'Base Species', placeholder: 'WaterRat or FireDragon', value: 'WaterRat' },
            { label: 'Custom Type', placeholder: 'Water, Fire, Grass...', value: 'Water' },
        ];

        fields.forEach(f => {
            this.contentGroup.add(this.addText(fieldX, fieldY, f.label, '16px', '#aabbcc'));
            // Field background
            const fb = this.add.graphics();
            fb.fillStyle(0x1a1a3a, 1);
            fb.fillRoundedRect(fieldX + 150, fieldY - 4, 300, 28, 5);
            fb.lineStyle(1, 0x444488, 0.5);
            fb.strokeRoundedRect(fieldX + 150, fieldY - 4, 300, 28, 5);
            this.contentGroup.add(fb);
            this.contentGroup.add(this.addText(fieldX + 160, fieldY + 2, f.value, '15px', '#667788'));
            fieldY += fieldGap;
        });

        // Stat allocation preview
        fieldY += 10;
        this.contentGroup.add(this.addText(fieldX, fieldY, 'Stat Allocation Preview', '18px', '#cccccc'));
        fieldY += 30;

        const previewStats = [
            { label: 'HP',     val: 55, color: 0x44cc44 },
            { label: 'ATK',    val: 48, color: 0xff5544 },
            { label: 'DEF',    val: 45, color: 0xffaa33 },
            { label: 'SP.ATK', val: 62, color: 0x5599ff },
            { label: 'SP.DEF', val: 50, color: 0x44ddaa },
            { label: 'SPD',    val: 58, color: 0xdddd44 },
        ];

        previewStats.forEach((s, i) => {
            const sy = fieldY + i * 26;
            this.contentGroup.add(this.addText(fieldX, sy, s.label, '14px', '#999999'));
            const barBg = this.add.graphics();
            barBg.fillStyle(0x222244, 1);
            barBg.fillRoundedRect(fieldX + 80, sy + 2, 200, 12, 3);
            this.contentGroup.add(barBg);
            const barFg = this.add.graphics();
            barFg.fillStyle(s.color, 1);
            barFg.fillRoundedRect(fieldX + 80, sy + 2, 200 * (s.val / 120), 12, 3);
            this.contentGroup.add(barFg);
            this.contentGroup.add(this.addText(fieldX + 290, sy, `${s.val}`, '14px', '#cccccc'));
        });

        // Estimated mint cost
        this.contentGroup.add(this.addText(fieldX + 380, fieldY, 'Mint Cost', '16px', '#888899'));
        this.contentGroup.add(this.addText(fieldX + 380, fieldY + 30, '0.02 ETH', '28px', '#ffcc44'));
        this.contentGroup.add(this.addText(fieldX + 380, fieldY + 65, '+ Gas Fees', '13px', '#666688'));

        // Mint button
        this.createContentButton(fieldX + 440, fieldY + 120, '  Mint NFT  ', () => this.mintHashmon());

        // TODO notice
        this.contentGroup.add(this.addText(fieldX + 360, fieldY + 155,
            '// TODO: Form inputs will be\nimplemented with DOM overlay\nor Phaser input fields',
            '11px', '#444466'));
    }

    // ═══════════════════════════════════════════════════════════
    // TAB 4: MARKETPLACE — Browse & buy Hashmon
    // ═══════════════════════════════════════════════════════════

    drawMarketTab() {
        const pp = playerProfile;
        const startX = 50;
        const startY = 115;

        this.contentGroup.add(this.addText(this.cameras.main.centerX, startY,
            'Hashmon NFT Marketplace', '26px', '#ffcc00').setOrigin(0.5));
        this.contentGroup.add(this.addText(this.cameras.main.centerX, startY + 30,
            'Browse and purchase Hashmon minted by other trainers', '14px', '#888899').setOrigin(0.5));

        const listY = startY + 65;
        const rowH = 120;

        pp.marketplaceListings.forEach((listing, i) => {
            const ry = listY + i * (rowH + 15);
            const species = SPECIES[listing.speciesKey];

            // Row background
            const rowBg = this.add.graphics();
            rowBg.fillStyle(0x111133, 0.85);
            rowBg.fillRoundedRect(startX, ry, 1180, rowH, 10);
            rowBg.lineStyle(1, 0x333366, 0.5);
            rowBg.strokeRoundedRect(startX, ry, 1180, rowH, 10);
            this.contentGroup.add(rowBg);

            // Sprite
            this.contentGroup.add(this.add.image(startX + 60, ry + rowH / 2, species.textureKey).setScale(2.2));

            // Info
            this.contentGroup.add(this.addText(startX + 130, ry + 12, `"${listing.nickname}"`, '22px', '#ffffff'));
            this.contentGroup.add(this.addText(startX + 130, ry + 40, `${species.name}  Lv${listing.level}   |   ${listing.tokenId}`, '15px', '#aabbcc'));
            this.contentGroup.add(this.addText(startX + 130, ry + 65, `Seller: ${listing.seller}`, '13px', '#666688'));

            // Type
            const typeColors = { Water: '#3399ff', Fire: '#ff6633', Grass: '#33cc66', Normal: '#cccccc' };
            this.contentGroup.add(this.addText(startX + 130, ry + 88, `Type: ${species.type}`, '14px', typeColors[species.type] || '#fff'));

            // BST
            const bst = Object.values(species.baseStats).reduce((a, b) => a + b, 0);
            this.contentGroup.add(this.addText(startX + 340, ry + 88, `BST: ${bst}`, '14px', '#888899'));

            // Price
            this.contentGroup.add(this.addText(startX + 900, ry + 20, listing.price, '28px', '#ffcc44'));

            // Buy button
            this.createContentButton(startX + 920, ry + 75, '  Buy Now  ', () => this.buyHashmon(listing));
        });
    }

    // ═══════════════════════════════════════════════════════════
    // WALLET STATUS
    // ═══════════════════════════════════════════════════════════

    updateWalletStatus() {
        if (playerProfile.walletConnected) {
            this.walletText.setText(`🟢 ${playerProfile.walletAddress}`);
        } else {
            this.walletText.setText('🔴 Wallet Not Connected');
            this.walletText.setColor('#cc6666');
        }
    }

    // ═══════════════════════════════════════════════════════════
    // WEB3 PLACEHOLDER FUNCTIONS
    // All marked for blockchain developer handoff
    // ═══════════════════════════════════════════════════════════

    // TODO: WEB3 INTEGRATION HERE
    // Connect to MetaMask / WalletConnect / Coinbase Wallet.
    // On success: set playerProfile.walletConnected = true,
    //             set playerProfile.walletAddress = accounts[0],
    //             then call fetchNFTs() to hydrate owned Hashmon.
    // Example:
    //   const provider = new ethers.BrowserProvider(window.ethereum);
    //   const accounts = await provider.send("eth_requestAccounts", []);
    //   playerProfile.walletAddress = accounts[0];
    async connectWallet() {
        console.log('[Web3] Requesting wallet connection...');
        // Mock: simulate successful connection
        playerProfile.walletConnected = true;
        playerProfile.walletAddress = '0x7a3b...f91d';
        this.updateWalletStatus();
        this.showTab(this.currentTab); // Refresh current tab
    }

    // TODO: WEB3 INTEGRATION HERE
    // Query the Hashmon NFT smart contract for all tokens owned by
    // the connected wallet. For each token:
    //   - Read tokenURI → fetch metadata JSON from IPFS
    //   - Parse species, nickname, level, stats from metadata
    //   - Push into playerProfile.ownedHashmon[]
    async fetchNFTs() {
        console.log('[Web3] Fetching owned Hashmon NFTs from contract...');
        // Mock data already populated in PlayerProfile constructor
    }

    // TODO: WEB3 INTEGRATION HERE
    // Call the Hashmon contract's mint() function:
    //   - Pass species, nickname, stats as parameters
    //   - Upload metadata JSON + image to IPFS via Pinata/Infura
    //   - Send mint transaction (user pays gas + mint price)
    //   - On receipt: add new NFT to playerProfile.ownedHashmon[]
    async mintHashmon() {
        console.log('[Web3] Initiating Hashmon mint transaction...');
        console.log('[Web3] Steps: 1. Upload metadata to IPFS');
        console.log('[Web3]        2. Call contract.mint(tokenURI)');
        console.log('[Web3]        3. Wait for transaction receipt');
        console.log('[Web3]        4. Update local inventory');
    }

    // TODO: WEB3 INTEGRATION HERE
    // Call contract.evolve(tokenId1, tokenId2):
    //   - Burns both input NFTs
    //   - Mints a new evolved NFT with combined/boosted stats
    //   - Upload new metadata to IPFS
    async evolveHashmon(tokenId1, tokenId2) {
        console.log(`[Web3] Evolving tokens ${tokenId1} + ${tokenId2}...`);
    }

    // TODO: WEB3 INTEGRATION HERE
    // Purchase a listed NFT from the marketplace:
    //   - Call marketplace contract's buy(tokenId) with msg.value = listing price
    //   - Transfer NFT from seller to buyer
    //   - Update playerProfile.ownedHashmon[]
    //   - Remove listing from marketplace
    async buyHashmon(listing) {
        console.log(`[Web3] Purchasing ${listing.nickname} (${listing.tokenId}) for ${listing.price}...`);
        console.log('[Web3] Steps: 1. Approve spend');
        console.log('[Web3]        2. Call marketplace.buyItem(tokenId)');
        console.log('[Web3]        3. Wait for transfer confirmation');
    }

    // TODO: WEB3 INTEGRATION HERE
    // List one of the player's owned Hashmon on the marketplace:
    //   - Call marketplace contract's listItem(tokenId, price)
    //   - NFT gets held in escrow by the marketplace contract
    async listHashmonForSale(tokenId, priceInEth) {
        console.log(`[Web3] Listing ${tokenId} for sale at ${priceInEth} ETH...`);
    }

    // ═══════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════

    addText(x, y, content, fontSize, color) {
        return this.add.text(x, y, content, {
            fontFamily: 'Futile', fontSize, color,
        });
    }

    createButton(x, y, text, onClick) {
        const btnBg = this.add.graphics();
        const w = 180;
        const h = 36;
        btnBg.fillStyle(0x2a2a4a, 1);
        btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        btnBg.lineStyle(2, 0x5555aa, 0.6);
        btnBg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);

        const btnText = this.add.text(x, y, text, {
            fontFamily: 'Futile', fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5);

        const hit = this.add.rectangle(x, y, w, h).setInteractive().setAlpha(0.001);
        hit.on('pointerover', () => { btnBg.clear(); btnBg.fillStyle(0x3a3a6a, 1); btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6); btnBg.lineStyle(2, 0x7777cc, 0.8); btnBg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6); btnText.setColor('#ffff88'); });
        hit.on('pointerout', () => { btnBg.clear(); btnBg.fillStyle(0x2a2a4a, 1); btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6); btnBg.lineStyle(2, 0x5555aa, 0.6); btnBg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6); btnText.setColor('#ffffff'); });
        hit.on('pointerup', onClick);
    }

    createContentButton(x, y, text, onClick) {
        const w = text.length * 10 + 20;
        const h = 28;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x224488, 1);
        btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 5);
        this.contentGroup.add(btnBg);

        const btnText = this.add.text(x, y, text, {
            fontFamily: 'Futile', fontSize: '14px', color: '#ffffff',
        }).setOrigin(0.5);
        this.contentGroup.add(btnText);

        const hit = this.add.rectangle(x, y, w, h).setInteractive().setAlpha(0.001);
        this.contentGroup.add(hit);

        hit.on('pointerover', () => { btnBg.clear(); btnBg.fillStyle(0x3366aa, 1); btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 5); btnText.setColor('#ffff88'); });
        hit.on('pointerout', () => { btnBg.clear(); btnBg.fillStyle(0x224488, 1); btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 5); btnText.setColor('#ffffff'); });
        hit.on('pointerup', onClick);
    }
}
