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
import { SPECIES, MOVES } from '../data/HashmonData.js';
import { CONTRACTS, IPFS_GATEWAY, uploadToIPFS, uploadFileToIPFS } from '../data/ContractConfig.js';
import { buildPortableCompanionProfile, COMPANION_SCHEMA_VERSION, normalizeTokenId } from '../data/CompanionProtocol.js';

export class Web3Scene extends Phaser.Scene {
    constructor() {
        super('Web3Scene');
    }

    create() {
        const W = this.sys.game.config.width;
        const H = this.sys.game.config.height;

        this.createDraft = this.buildCreateDraft('WaterRat');

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

        const portable = pp.getPortableActiveHashmon ? pp.getPortableActiveHashmon() : buildPortableCompanionProfile(pp.getActiveHashmon?.());
        if (portable) {
            const syncY = ownY + 35;
            const syncBg = this.add.graphics();
            syncBg.fillStyle(0x141a38, 1);
            syncBg.fillRoundedRect(cardX + 30, syncY, 540, 95, 10);
            syncBg.lineStyle(1, 0x3d67cc, 0.6);
            syncBg.strokeRoundedRect(cardX + 30, syncY, 540, 95, 10);
            this.contentGroup.add(syncBg);
            this.contentGroup.add(this.addText(cardX + 45, syncY + 10, 'Active Companion Sync Proof', '16px', '#ffdd88'));
            this.contentGroup.add(this.addText(cardX + 45, syncY + 34, `${portable.tokenId}  ${portable.identity.nickname} / ${portable.identity.speciesKey}`, '14px', '#ffffff'));
            this.contentGroup.add(this.addText(cardX + 45, syncY + 56, `Battle → HP ${portable.adapters.battle.hp} | SPD ${portable.adapters.battle.speed} | Boost +${portable.adapters.battle.preBattleBoost}`, '13px', '#88ccff'));
            this.contentGroup.add(this.addText(cardX + 45, syncY + 76, `Garden → Move ${portable.adapters.garden.roamingSpeed}px/s | Mood ${portable.state.happiness} | Interactions ${portable.state.gardenInteractions}`, '13px', '#88ddaa'));
        }
    }

    // ═══════════════════════════════════════════════════════════
    // TAB 2: MY NFTs — Owned Hashmon cards
    // ═══════════════════════════════════════════════════════════

    drawMyNftsTab() {
        const pp = playerProfile;
        const startX = 55;
        const startY = 120;
        const cardW = 370;
        const cardH = 278;
        const gap = 25;

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
            const isActive = `#${normalizeTokenId(nft.tokenId)}` === `#${normalizeTokenId(pp.activeHashmonTokenId)}`;

            // Card bg
            const cardBg = this.add.graphics();
            cardBg.fillStyle(0x111133, 0.9);
            cardBg.fillRoundedRect(cx, cy, cardW, cardH, 10);
            cardBg.lineStyle(2, nft.isOriginalMinter ? 0x44cc88 : 0x4466aa, 0.6);
            cardBg.strokeRoundedRect(cx, cy, cardW, cardH, 10);
            this.contentGroup.add(cardBg);

            // Sprite
            const nftImage = this.add.image(cx + 55, cy + 80, nft.customTextureKey || species.textureKey);
            this.fitImageToBox(nftImage, 90, 90);
            this.contentGroup.add(nftImage);

            // Token ID
            this.contentGroup.add(this.addText(cx + 120, cy + 14, nft.tokenId, '14px', '#666688'));

            // Nickname
            this.contentGroup.add(this.addText(cx + 120, cy + 35, `"${nft.nickname}"`, '22px', '#ffffff'));

            // Species + Level
            this.contentGroup.add(this.addText(cx + 120, cy + 65, `${species.name}  Lv${nft.level}`, '16px', '#aabbcc'));

            // Type
            const typeColors = { Water: '#3399ff', Fire: '#ff6633', Grass: '#33cc66', Normal: '#cccccc', Dark: '#9966cc' };
            const nftType = nft.type || species.type;
            this.contentGroup.add(this.addText(cx + 120, cy + 90, `Type: ${nftType}`, '14px', typeColors[nftType] || '#fff'));

            // Minted by
            this.contentGroup.add(this.addText(cx + 120, cy + 115, `Minted by: ${nft.mintedBy}`, '12px', '#555577'));

            // Original minter badge
            if (nft.isOriginalMinter) {
                this.contentGroup.add(this.addText(cx + 120, cy + 135, '★ Original Creator', '13px', '#44cc88'));
            } else {
                this.contentGroup.add(this.addText(cx + 120, cy + 135, '◆ Acquired via Market', '13px', '#6688aa'));
            }

            if (isActive) {
                this.contentGroup.add(this.addText(cx + 225, cy + 135, '● Active in Battle & Garden', '13px', '#ffdd66'));
            }

            // Base stats summary
            const bstSource = nft.stats || species.baseStats;
            const bst = Object.values(bstSource).reduce((a, b) => a + b, 0);
            this.contentGroup.add(this.addText(cx + 15, cy + 160, `BST: ${bst}`, '14px', '#888899'));
            this.contentGroup.add(this.addText(cx + 90, cy + 160, `ATK ${bstSource.atk} / SPD ${bstSource.speed}`, '12px', '#99bbcc'));

            const moveNames = (nft.moves || species.moveKeys).map(key => MOVES[key]?.name || key);
            this.contentGroup.add(this.addText(cx + 15, cy + 182, `Moves: ${moveNames[0] || '-'}, ${moveNames[1] || '-'}`, '12px', '#ccddff'));
            this.contentGroup.add(this.addText(cx + 15, cy + 200, `       ${moveNames[2] || '-'}, ${moveNames[3] || '-'}`, '12px', '#ccddff'));

            this.createContentButton(cx + 62, cy + cardH - 22, isActive ? 'Active' : 'Set Active', () => {
                playerProfile.setActiveHashmon(nft.tokenId);
                this.showTab('myNfts');
            });
            this.createContentButton(cx + 160, cy + cardH - 22, 'Battle', () => {
                playerProfile.setActiveHashmon(nft.tokenId);
                this.scene.start('BattleScene');
            });
            this.createContentButton(cx + 250, cy + cardH - 22, 'List', async () => {
                playerProfile.setActiveHashmon(nft.tokenId);
                const price = window.prompt('输入上架价格（ETH）', '0.03');
                if (price && Number(price) > 0) {
                    await this.listHashmonForSale(nft.tokenId, String(price));
                }
            });
            this.createContentButton(cx + cardW - 75, cy + cardH - 22, 'View Stats', () => {
                playerProfile.setActiveHashmon(nft.tokenId);
                this.scene.start('InventoryScene');
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // TAB 3: CREATE & MINT — Design a new Hashmon
    // ═══════════════════════════════════════════════════════════

    drawCreateTab() {
        const cx = this.cameras.main.centerX;
        const cardX = cx - 420;
        const cardY = 110;
        const draft = this.createDraft;
        const species = SPECIES[draft.speciesKey];
        const previewStats = draft.randomizedStats || species.baseStats;
        const previewTexture = draft.previewTextureKey || species.textureKey;
        const movesLabel = (draft.selectedMoves || []).map(key => MOVES[key]?.name || key).join(', ');

        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x0e0e2a, 0.92);
        cardBg.fillRoundedRect(cardX, cardY, 840, 500, 14);
        cardBg.lineStyle(2, 0x3344aa, 0.5);
        cardBg.strokeRoundedRect(cardX, cardY, 840, 500, 14);
        this.contentGroup.add(cardBg);

        this.contentGroup.add(this.addText(cx, cardY + 25, 'Create Your Own Hashmon', '28px', '#ffcc00').setOrigin(0.5));
        this.contentGroup.add(this.addText(cx, cardY + 58, 'Upload art, edit 4 moves, roll chain stats, then confirm mint', '14px', '#888899').setOrigin(0.5));

        const fieldX = cardX + 30;
        let fieldY = cardY + 95;
        const fieldGap = 44;

        const renderField = (label, value, buttonText, onEdit) => {
            this.contentGroup.add(this.addText(fieldX, fieldY, label, '15px', '#aabbcc'));
            const fb = this.add.graphics();
            fb.fillStyle(0x1a1a3a, 1);
            fb.fillRoundedRect(fieldX + 140, fieldY - 4, 260, 28, 5);
            fb.lineStyle(1, 0x444488, 0.5);
            fb.strokeRoundedRect(fieldX + 140, fieldY - 4, 260, 28, 5);
            this.contentGroup.add(fb);
            this.contentGroup.add(this.addText(fieldX + 150, fieldY + 2, String(value).slice(0, 34), '14px', '#dde7ff'));
            this.createContentButton(fieldX + 470, fieldY + 8, buttonText, onEdit);
            fieldY += fieldGap;
        };

        renderField('Nickname', draft.nickname, 'Edit', () => {
            const val = window.prompt('Enter nickname', draft.nickname);
            if (val && val.trim()) {
                this.createDraft.nickname = val.trim().slice(0, 20);
                this.showTab('create');
            }
        });

        renderField('Base Species', draft.speciesKey, 'Swap', () => {
            const next = draft.speciesKey === 'WaterRat' ? 'FireDragon' : 'WaterRat';
            this.createDraft = this.buildCreateDraft(next, this.createDraft.nickname);
            this.showTab('create');
        });

        renderField('Custom Type', draft.customType, 'Edit', () => {
            const val = window.prompt('Enter type', draft.customType);
            if (val && val.trim()) {
                this.createDraft.customType = val.trim().slice(0, 16);
                this.showTab('create');
            }
        });

        renderField('Artwork', draft.imageName || 'Default sprite', 'Upload', () => this.pickMintImage());
        renderField('Moves', movesLabel || 'None', 'Edit', () => this.editMoveSet());

        fieldY += 6;
        this.contentGroup.add(this.addText(fieldX, fieldY, `Chain Seed: ${draft.seed || 'not rolled yet'}`, '13px', '#77ccee'));
        fieldY += 24;
        this.contentGroup.add(this.addText(fieldX, fieldY, 'Chain-Randomized Stats', '18px', '#cccccc'));
        fieldY += 26;

        const statRows = [
            { label: 'HP', val: previewStats.hp, color: 0x44cc44 },
            { label: 'ATK', val: previewStats.atk, color: 0xff5544 },
            { label: 'DEF', val: previewStats.def, color: 0xffaa33 },
            { label: 'SP.ATK', val: previewStats.spAtk, color: 0x5599ff },
            { label: 'SP.DEF', val: previewStats.spDef, color: 0x44ddaa },
            { label: 'SPD', val: previewStats.speed, color: 0xdddd44 },
        ];

        statRows.forEach((s, i) => {
            const sy = fieldY + i * 24;
            this.contentGroup.add(this.addText(fieldX, sy, s.label, '13px', '#999999'));
            const barBg = this.add.graphics();
            barBg.fillStyle(0x222244, 1);
            barBg.fillRoundedRect(fieldX + 70, sy + 2, 180, 10, 3);
            this.contentGroup.add(barBg);
            const barFg = this.add.graphics();
            barFg.fillStyle(s.color, 1);
            barFg.fillRoundedRect(fieldX + 70, sy + 2, 180 * (s.val / 120), 10, 3);
            this.contentGroup.add(barFg);
            this.contentGroup.add(this.addText(fieldX + 260, sy - 1, `${s.val}`, '13px', '#cccccc'));
        });

        const rightX = cardX + 610;
        this.contentGroup.add(this.addText(rightX, cardY + 95, 'Preview', '18px', '#ffdd88').setOrigin(0.5));
        const previewImage = this.add.image(rightX, cardY + 190, previewTexture);
        this.fitImageToBox(previewImage, 150, 150);
        this.contentGroup.add(previewImage);
        this.contentGroup.add(this.addText(rightX, cardY + 255, draft.nickname, '20px', '#ffffff').setOrigin(0.5));
        this.contentGroup.add(this.addText(rightX, cardY + 282, `${draft.speciesKey} / ${draft.customType}`, '13px', '#88ccff').setOrigin(0.5));
        this.contentGroup.add(this.addText(rightX, cardY + 312, `Moves: ${(draft.selectedMoves || []).length}/4`, '13px', '#cccccc').setOrigin(0.5));
        this.contentGroup.add(this.addText(rightX, cardY + 338, draft.imageFile ? 'Custom art ready for IPFS' : 'Using default art unless uploaded', '11px', '#88bb88').setOrigin(0.5));
        this.contentGroup.add(this.addText(rightX, cardY + 380, 'Mint Cost', '16px', '#888899').setOrigin(0.5));
        this.contentGroup.add(this.addText(rightX, cardY + 408, '0.02 ETH', '28px', '#ffcc44').setOrigin(0.5));

        this.createContentButton(rightX, cardY + 445, 'Roll Chain Stats', () => this.rollChainStats());
        this.createContentButton(rightX, cardY + 480, 'Confirm & Mint', () => this.mintHashmon());
        this.createContentButton(rightX - 120, cardY + 480, 'Reset', () => {
            this.createDraft = this.buildCreateDraft('WaterRat');
            this.showTab('create');
        });
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
        this.createContentButton(1080, startY + 14, 'Refresh Market', async () => {
            await this.fetchMarketListings();
            this.showTab('market');
        });

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

    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert('请先安装MetaMask钱包');
            return;
        }
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            playerProfile.walletConnected = true;
            playerProfile.walletAddress = await signer.getAddress();
            this.updateWalletStatus();
            await this.fetchNFTs();
            await this.fetchMarketListings();
            this.showTab(this.currentTab);
        } catch (e) {
            alert('钱包连接失败: ' + e.message);
        }
    }

    async fetchNFTs() {
        if (!playerProfile.walletConnected) return;
        const address = playerProfile.walletAddress;

        if (!CONTRACTS.HashmonNFT.address || CONTRACTS.HashmonNFT.address.includes('Your') || !CONTRACTS.HashmonNFT.abi.length) {
            console.warn('[Web3] NFT contract not configured yet; using local demo inventory.');
            return;
        }

        const provider = new window.ethers.BrowserProvider(window.ethereum);
        const contract = new window.ethers.Contract(CONTRACTS.HashmonNFT.address, CONTRACTS.HashmonNFT.abi, provider);
        let balance = 0;
        try {
            balance = Number(await contract.balanceOf(address));
        } catch (e) {
            alert('NFT读取失败，请检查合约地址、ABI和网络: ' + e.message);
            return;
        }
        playerProfile.ownedHashmon = [];
        for (let i = 0; i < balance; i++) {
            const tokenId = await contract.tokenOfOwnerByIndex(address, i);
            let tokenURI = await contract.tokenURI(tokenId);
            if (tokenURI.startsWith('ipfs://')) {
                tokenURI = IPFS_GATEWAY + tokenURI.replace('ipfs://', '');
            }
            const metadata = await fetch(tokenURI).then(r => r.json());
            let customTextureKey = null;
            const imageUrl = this.toGatewayUrl(metadata.image);
            if (imageUrl) {
                customTextureKey = await this.loadTextureFromUrl(`nft_art_${tokenId.toString()}`, imageUrl);
            }
            playerProfile.ownedHashmon.push({
                tokenId: `#${tokenId.toString().padStart(4, '0')}`,
                speciesKey: metadata.attributes.species,
                nickname: metadata.name,
                level: metadata.attributes.level,
                mintedBy: metadata.attributes.mintedBy,
                isOriginalMinter: metadata.attributes.mintedBy?.toLowerCase() === address.toLowerCase(),
                type: metadata.attributes.type,
                moves: metadata.attributes.moves,
                stats: metadata.attributes.stats,
                normalizedStats: metadata.attributes.normalizedStats,
                companionState: metadata.attributes.companionState,
                image: metadata.image,
                customTextureKey,
            });
        }

        if (playerProfile.ownedHashmon.length > 0) {
            playerProfile.setActiveHashmon(playerProfile.activeHashmonTokenId || playerProfile.ownedHashmon[0].tokenId);
        }
    }

    async fetchMarketListings() {
        const contractReady = CONTRACTS.Marketplace.address && !CONTRACTS.Marketplace.address.includes('Your') && CONTRACTS.Marketplace.abi.length;
        const nftReady = CONTRACTS.HashmonNFT.address && !CONTRACTS.HashmonNFT.address.includes('Your') && CONTRACTS.HashmonNFT.abi.length;
        if (!contractReady || !nftReady || typeof window.ethereum === 'undefined') return;

        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const market = new window.ethers.Contract(CONTRACTS.Marketplace.address, CONTRACTS.Marketplace.abi, provider);
            const nft = new window.ethers.Contract(CONTRACTS.HashmonNFT.address, CONTRACTS.HashmonNFT.abi, provider);
            const result = await market.getActiveListings();
            const tokenIds = result[0] || [];
            const rawListings = result[1] || [];
            const refreshed = [];

            for (let i = 0; i < tokenIds.length; i++) {
                const listing = rawListings[i];
                if (!listing || listing.active === false) continue;

                const cleanTokenId = tokenIds[i].toString();
                let tokenURI = await nft.tokenURI(cleanTokenId);
                if (tokenURI.startsWith('ipfs://')) {
                    tokenURI = IPFS_GATEWAY + tokenURI.replace('ipfs://', '');
                }
                const metadata = await fetch(tokenURI).then((r) => r.json());
                refreshed.push({
                    tokenId: `#${cleanTokenId.padStart(4, '0')}`,
                    speciesKey: metadata.attributes.species,
                    nickname: metadata.name,
                    level: metadata.attributes.level,
                    price: `${Number(window.ethers.formatEther(listing.price)).toFixed(3)} ETH`,
                    seller: listing.seller,
                    type: metadata.attributes.type,
                    moves: metadata.attributes.moves,
                    stats: metadata.attributes.stats,
                });
            }

            playerProfile.marketplaceListings = refreshed;
        } catch (e) {
            console.warn('[Web3] marketplace refresh failed:', e);
        }
    }

    async mintHashmon() {
        if (!playerProfile.walletConnected) {
            alert('请先连接钱包');
            return;
        }

        const { nickname, speciesKey, customType, level, selectedMoves, randomizedStats, normalizedStats, imageFile, previewTextureKey, seed } = this.createDraft;
        const species = SPECIES[speciesKey];
        const walletAddress = playerProfile.walletAddress;

        if (!selectedMoves || selectedMoves.length !== 4) {
            alert('请先自定义并确认 4 个技能');
            return;
        }

        const confirmed = window.confirm(
            `确认铸造这个 Hashmon 吗？\n\n名称: ${nickname}\n物种: ${speciesKey}\n属性: ${customType}\n技能: ${selectedMoves.join(', ')}\n种子: ${seed || '未生成'}\n贴图: ${imageFile ? imageFile.name : '默认贴图'}`
        );
        if (!confirmed) return;

        let imageURI = '';
        if (imageFile) {
            try {
                imageURI = await uploadFileToIPFS(imageFile);
            } catch (e) {
                alert('图片上传失败: ' + e.message);
                return;
            }
        }

        const metadata = {
            name: nickname,
            description: `A custom ${species.name} Hashmon minted on the Hashmon protocol.`,
            image: imageURI,
            external_url: '',
            schema: COMPANION_SCHEMA_VERSION,
            attributes: {
                species: speciesKey,
                type: customType || species.type,
                level,
                stats: { ...randomizedStats },
                normalizedStats: { ...normalizedStats },
                moves: [...selectedMoves],
                mintedBy: walletAddress,
                mintDate: new Date().toISOString().slice(0, 10),
                originalSpeciesTemplate: false,
                chainSeed: seed,
                gameAdapters: {
                    battle: 'turn-based-rpg/v1',
                    garden: 'companion-garden/v1',
                },
                companionState: {
                    battles: 0,
                    wins: 0,
                    gardenInteractions: 0,
                    happiness: 50,
                    expFromGarden: 0,
                    coinsFound: 0,
                },
            }
        };

        let tokenURI = '';
        try {
            tokenURI = await uploadToIPFS(metadata);
        } catch (e) {
            alert('元数据上传失败: ' + e.message);
            return;
        }

        const contractReady = CONTRACTS.HashmonNFT.address && !CONTRACTS.HashmonNFT.address.includes('Your') && CONTRACTS.HashmonNFT.abi.length;

        if (!contractReady) {
            playerProfile.ownedHashmon.push({
                tokenId: `#${String(playerProfile.ownedHashmon.length + 1001).padStart(4, '0')}`,
                speciesKey,
                nickname,
                level,
                mintedBy: walletAddress,
                isOriginalMinter: true,
                type: customType,
                moves: [...selectedMoves],
                stats: { ...randomizedStats },
                normalizedStats: { ...normalizedStats },
                companionState: { battles: 0, wins: 0, gardenInteractions: 0, happiness: 50, expFromGarden: 0, coinsFound: 0 },
                image: imageURI,
                customTextureKey: previewTextureKey,
            });
            playerProfile.setActiveHashmon(playerProfile.ownedHashmon[playerProfile.ownedHashmon.length - 1].tokenId);
            alert(`演示模式铸造成功，图片和元数据已上传到 IPFS。\nMetadata: ${tokenURI}`);
            this.showTab('myNfts');
            return;
        }

        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new window.ethers.Contract(CONTRACTS.HashmonNFT.address, CONTRACTS.HashmonNFT.abi, signer);
            const mintPrice = typeof contract.mintPrice === 'function' ? await contract.mintPrice() : window.ethers.parseEther('0.02');
            const tx = await contract.mint(walletAddress, tokenURI, { value: mintPrice });
            await tx.wait();
            alert('铸造成功并已上链！');
            await this.fetchNFTs();
            const newest = playerProfile.ownedHashmon[playerProfile.ownedHashmon.length - 1];
            if (newest) playerProfile.setActiveHashmon(newest.tokenId);
            this.showTab('myNfts');
        } catch (e) {
            alert('合约铸造失败，请检查是否已部署合约且当前网络正确: ' + e.message);
        }
    }

    // TODO: WEB3 INTEGRATION HERE
    // Call contract.evolve(tokenId1, tokenId2):
    //   - Burns both input NFTs
    //   - Mints a new evolved NFT with combined/boosted stats
    //   - Upload new metadata to IPFS
    async evolveHashmon(tokenId1, tokenId2) {
        console.log(`[Web3] Evolving tokens ${tokenId1} + ${tokenId2}...`);
    }

    async buyHashmon(listing) {
        if (!playerProfile.walletConnected) {
            alert('请先连接钱包');
            return;
        }

        const contractReady = CONTRACTS.Marketplace.address && !CONTRACTS.Marketplace.address.includes('Your') && CONTRACTS.Marketplace.abi.length;
        if (!contractReady) {
            playerProfile.marketplaceListings = playerProfile.marketplaceListings.filter(item => item.tokenId !== listing.tokenId);
            playerProfile.ownedHashmon.push({
                tokenId: listing.tokenId,
                speciesKey: listing.speciesKey,
                nickname: listing.nickname,
                level: listing.level,
                mintedBy: listing.seller,
                isOriginalMinter: false,
            });
            playerProfile.setActiveHashmon(listing.tokenId);
            alert('演示模式购买成功！');
            this.showTab('myNfts');
            return;
        }

        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const market = new window.ethers.Contract(CONTRACTS.Marketplace.address, CONTRACTS.Marketplace.abi, signer);
            const tokenId = String(listing.tokenId).replace('#', '');
            const priceWei = window.ethers.parseEther(listing.price.replace(' ETH', ''));
            const tx = await market.buyItem(tokenId, { value: priceWei });
            await tx.wait();
            alert('购买成功！');
            await this.fetchNFTs();
            await this.fetchMarketListings();
            playerProfile.setActiveHashmon(listing.tokenId);
            this.showTab('myNfts');
        } catch (e) {
            alert('购买失败: ' + e.message);
        }
    }

    async listHashmonForSale(tokenId, priceInEth) {
        if (!playerProfile.walletConnected) {
            alert('请先连接钱包');
            return;
        }

        const contractReady = CONTRACTS.HashmonNFT.address && !CONTRACTS.HashmonNFT.address.includes('Your') && CONTRACTS.Marketplace.address && !CONTRACTS.Marketplace.address.includes('Your');
        if (!contractReady) {
            const idx = playerProfile.ownedHashmon.findIndex(item => item.tokenId === tokenId || item.tokenId === `#${String(tokenId).padStart(4, '0')}`);
            if (idx >= 0) {
                const nft = playerProfile.ownedHashmon.splice(idx, 1)[0];
                playerProfile.marketplaceListings.push({
                    tokenId: nft.tokenId,
                    speciesKey: nft.speciesKey,
                    nickname: nft.nickname,
                    level: nft.level,
                    price: `${priceInEth} ETH`,
                    seller: playerProfile.walletAddress,
                });
                alert('演示模式上架成功！');
                this.showTab('market');
                return;
            }
        }

        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const nft = new window.ethers.Contract(CONTRACTS.HashmonNFT.address, CONTRACTS.HashmonNFT.abi, signer);
            const market = new window.ethers.Contract(CONTRACTS.Marketplace.address, CONTRACTS.Marketplace.abi, signer);
            const cleanTokenId = String(tokenId).replace('#', '');
            const approveTx = await nft.approve(CONTRACTS.Marketplace.address, cleanTokenId);
            await approveTx.wait();
            const priceWei = window.ethers.parseEther(priceInEth);
            const tx = await market.listItem(cleanTokenId, priceWei);
            await tx.wait();
            alert('上架成功！');
            await this.fetchNFTs();
            await this.fetchMarketListings();
            this.showTab('market');
        } catch (e) {
            alert('上架失败: ' + e.message);
        }
    }

    buildCreateDraft(speciesKey = 'WaterRat', nickname = 'My Hashmon') {
        const species = SPECIES[speciesKey];
        const draft = {
            nickname,
            speciesKey,
            customType: species.type,
            level: 10,
            selectedMoves: [...species.moveKeys],
            randomizedStats: { ...species.baseStats },
            normalizedStats: { ...species.baseNormalizedStats },
            imageFile: null,
            imageName: 'Default sprite',
            previewTextureKey: species.textureKey,
            seed: 'pending',
        };

        const roll = this.generateChainStats(speciesKey, nickname);
        draft.randomizedStats = roll.stats;
        draft.normalizedStats = roll.normalizedStats;
        draft.seed = roll.seed;
        return draft;
    }

    generateChainStats(speciesKey, nickname) {
        const species = SPECIES[speciesKey];
        const chainId = window.ethereum?.chainId || '0x0';
        const wallet = playerProfile.walletAddress || '0x0000000000000000000000000000000000000000';
        const entropy = new Uint32Array(4);
        window.crypto.getRandomValues(entropy);
        const seedInput = `${chainId}:${wallet}:${speciesKey}:${nickname}:${Date.now()}:${Array.from(entropy).join('-')}`;
        const hash = window.ethers?.keccak256
            ? window.ethers.keccak256(window.ethers.toUtf8Bytes(seedInput))
            : `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
        const bytes = hash.replace('0x', '').padEnd(64, '0');
        const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
        const rollAt = (base, pos, minAdj, maxAdj) => {
            const raw = parseInt(bytes.slice(pos, pos + 2), 16);
            const adj = minAdj + (raw % (maxAdj - minAdj + 1));
            return clamp(base + adj, 25, 99);
        };

        const stats = {
            hp: rollAt(species.baseStats.hp, 0, -4, 12),
            atk: rollAt(species.baseStats.atk, 2, -6, 12),
            def: rollAt(species.baseStats.def, 4, -6, 12),
            spAtk: rollAt(species.baseStats.spAtk, 6, -6, 12),
            spDef: rollAt(species.baseStats.spDef, 8, -6, 12),
            speed: rollAt(species.baseStats.speed, 10, -6, 12),
        };

        const normalizedStats = {
            strength: clamp(stats.atk / 100, 0, 1),
            vitality: clamp(stats.hp / 100, 0, 1),
            agility: clamp(stats.speed / 100, 0, 1),
            dexterity: clamp(stats.def / 100, 0, 1),
            intelligence: clamp(stats.spAtk / 100, 0, 1),
        };

        return {
            stats,
            normalizedStats,
            seed: hash.slice(0, 18),
        };
    }

    rollChainStats() {
        const roll = this.generateChainStats(this.createDraft.speciesKey, this.createDraft.nickname);
        this.createDraft.randomizedStats = roll.stats;
        this.createDraft.normalizedStats = roll.normalizedStats;
        this.createDraft.seed = roll.seed;
        this.showTab('create');
    }

    editMoveSet() {
        const available = Object.keys(MOVES);
        const current = (this.createDraft.selectedMoves || []).join(', ');
        const answer = window.prompt(
            `请输入 4 个技能 key，用逗号分隔。\n可选:\n${available.join(', ')}`,
            current
        );
        if (answer === null) return;

        const chosen = answer.split(',').map(s => s.trim()).filter(Boolean);
        if (chosen.length !== 4 || chosen.some(key => !MOVES[key])) {
            alert('请选择恰好 4 个有效技能 key');
            return;
        }
        this.createDraft.selectedMoves = chosen;
        this.showTab('create');
    }

    async pickMintImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            this.createDraft.imageFile = file;
            this.createDraft.imageName = file.name;

            const objectUrl = URL.createObjectURL(file);
            const texKey = `mint_art_${Date.now()}`;
            const loaded = await this.loadTextureFromUrl(texKey, objectUrl);
            URL.revokeObjectURL(objectUrl);
            if (loaded) {
                this.createDraft.previewTextureKey = loaded;
            }
            this.showTab('create');
        };
        input.click();
    }

    toGatewayUrl(uri) {
        if (!uri) return '';
        if (uri.startsWith('ipfs://')) return `${IPFS_GATEWAY}${uri.replace('ipfs://', '')}`;
        return uri;
    }

    loadTextureFromUrl(key, url) {
        return new Promise((resolve) => {
            if (!url) {
                resolve(null);
                return;
            }
            if (this.textures.exists(key)) {
                resolve(key);
                return;
            }
            this.load.image(key, url);
            this.load.once(Phaser.Loader.Events.COMPLETE, () => resolve(key));
            this.load.once(Phaser.Loader.Events.LOAD_ERROR, () => resolve(null));
            this.load.start();
        });
    }

    // ═══════════════════════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════════════════════

    fitImageToBox(image, maxWidth, maxHeight) {
        const sourceWidth = image.width || image.displayWidth || 1;
        const sourceHeight = image.height || image.displayHeight || 1;
        const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
        image.setScale(scale);
        return image;
    }

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
