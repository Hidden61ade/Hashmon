/**
 * InventoryScene.js
 * ──────────────────────────────────────────────────────────────
 * Allows the player to inspect their Hashmon roster, view base
 * stats, effective stats, type, level, moves with PP, etc.
 * ──────────────────────────────────────────────────────────────
 */
import { Hashmon } from '../data/Hashmon.js';
import { SPECIES, MOVES } from '../data/HashmonData.js';
import { playerProfile } from '../data/PlayerProfile.js';

export class InventoryScene extends Phaser.Scene {
    constructor() {
        super('InventoryScene');
    }

    create() {
        // Background
        const bg = this.add.image(0, 0, 'space_bg').setOrigin(0);
        bg.displayWidth = this.sys.game.config.width;
        bg.displayHeight = this.sys.game.config.height;

        // Title
        this.add.text(this.cameras.main.centerX, 40, 'MY HASHMON', {
            fontFamily: 'Futile', fontSize: '48px', color: '#00ffcc',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5);

        // ── Build the player's roster ──
        this.roster = this.buildRosterFromProfile();

        const activeToken = playerProfile.activeHashmonTokenId;
        const activeIndex = this.roster.findIndex((mon) => mon.tokenId === activeToken);
        this.selectedIndex = activeIndex >= 0 ? activeIndex : 0;

        // ── Left Panel: Roster List ──
        this.createRosterList();

        // ── Right Panel: Detail Card ──
        this.detailGroup = this.add.group();
        if (this.roster.length > 0) {
            this.drawDetailCard(this.roster[this.selectedIndex]);
        }

        // ── Back Button ──
        this.createButton(
            this.cameras.main.centerX,
            this.sys.game.config.height - 45,
            'Back to Menu',
            () => this.scene.start('StartScene')
        );
    }

    // ═══════════════════════════════════════════════════════════
    // ROSTER LIST (left column)
    // ═══════════════════════════════════════════════════════════

    createRosterList() {
        const startX = 50;
        const startY = 100;
        const slotH = 90;

        this.rosterSlots = [];

        if (this.roster.length === 0) {
            this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'No Hashmon in your wallet yet.', {
                fontFamily: 'Futile', fontSize: '26px', color: '#cccccc'
            }).setOrigin(0.5);
            return;
        }

        this.roster.forEach((mon, i) => {
            const y = startY + i * (slotH + 12);
            const isSelected = i === this.selectedIndex;

            // Slot background
            const slotBg = this.add.graphics();
            slotBg.fillStyle(isSelected ? 0x224488 : 0x111133, 0.85);
            slotBg.fillRoundedRect(startX, y, 340, slotH, 10);
            slotBg.lineStyle(2, isSelected ? 0x4488ff : 0x333366, 0.7);
            slotBg.strokeRoundedRect(startX, y, 340, slotH, 10);

            // Sprite thumbnail
            const thumb = this.add.image(startX + 50, y + slotH / 2, mon.customTextureKey || mon.textureKey);
            this.fitImageToBox(thumb, 58, 58);

            // Name + Level
            this.add.text(startX + 100, y + 12, mon.name, {
                fontFamily: 'Futile', fontSize: '22px', color: '#ffffff',
            });
            this.add.text(startX + 100, y + 40, `Lv ${mon.level}   Type: ${mon.type}`, {
                fontFamily: 'Futile', fontSize: '16px', color: '#aaaacc',
            });

            // HP bar
            const hpRatio = mon.currentHp / mon.maxHp;
            const barX = startX + 100;
            const barY = y + 64;
            const barW = 220;
            const barH = 10;
            const barBg = this.add.graphics();
            barBg.fillStyle(0x222244, 1);
            barBg.fillRoundedRect(barX, barY, barW, barH, 3);
            const barFg = this.add.graphics();
            barFg.fillStyle(0x00cc44, 1);
            barFg.fillRoundedRect(barX, barY, barW * hpRatio, barH, 3);

            // Make slot interactive
            const hitZone = this.add.rectangle(startX + 170, y + slotH / 2, 340, slotH)
                .setInteractive()
                .setOrigin(0.5)
                .setAlpha(0.001); // Invisible hit area

            hitZone.on('pointerup', () => {
                this.selectedIndex = i;
                this.refreshRosterHighlight();
                this.drawDetailCard(this.roster[i]);
            });

            this.rosterSlots.push({ bg: slotBg, hitZone, index: i });
        });
    }

    refreshRosterHighlight() {
        this.rosterSlots.forEach(slot => {
            const isSel = slot.index === this.selectedIndex;
            slot.bg.clear();
            slot.bg.fillStyle(isSel ? 0x224488 : 0x111133, 0.85);
            slot.bg.fillRoundedRect(50, 100 + slot.index * 102, 340, 90, 10);
            slot.bg.lineStyle(2, isSel ? 0x4488ff : 0x333366, 0.7);
            slot.bg.strokeRoundedRect(50, 100 + slot.index * 102, 340, 90, 10);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // DETAIL CARD (right panel)
    // ═══════════════════════════════════════════════════════════

    drawDetailCard(mon) {
        // Destroy previous detail group contents
        this.detailGroup.clear(true, true);

        const panelX = 430;
        const panelY = 90;
        const panelW = 810;
        const panelH = 560;

        // Card background
        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x0e0e2a, 0.9);
        cardBg.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
        cardBg.lineStyle(2, 0x3344aa, 0.5);
        cardBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);
        this.detailGroup.add(cardBg);

        // ── Sprite (large) ──
        const spriteImg = this.add.image(panelX + 120, panelY + 120, mon.customTextureKey || mon.textureKey);
        this.fitImageToBox(spriteImg, 160, 160);
        this.detailGroup.add(spriteImg);

        // ── Name / Type / Level ──
        const nameT = this.add.text(panelX + 240, panelY + 30, mon.name, {
            fontFamily: 'Futile', fontSize: '36px', color: '#ffffff',
        });
        this.detailGroup.add(nameT);

        const typeColors = { Water: '#3399ff', Fire: '#ff6633', Grass: '#33cc66', Normal: '#cccccc', Dark: '#9966cc' };
        const typeColor = typeColors[mon.type] || '#ffffff';

        const typeT = this.add.text(panelX + 240, panelY + 75, `Type: ${mon.type}`, {
            fontFamily: 'Futile', fontSize: '22px', color: typeColor,
        });
        this.detailGroup.add(typeT);

        const lvlT = this.add.text(panelX + 240, panelY + 105, `Level: ${mon.level}`, {
            fontFamily: 'Futile', fontSize: '20px', color: '#bbbbbb',
        });
        this.detailGroup.add(lvlT);

        const hpT = this.add.text(panelX + 240, panelY + 135, `HP: ${mon.currentHp} / ${mon.maxHp}`, {
            fontFamily: 'Futile', fontSize: '20px', color: '#88ff88',
        });
        this.detailGroup.add(hpT);

        const tokenT = this.add.text(panelX + 240, panelY + 160, `Token: ${mon.tokenId || 'Untracked'}${playerProfile.activeHashmonTokenId === mon.tokenId ? '   ● Active' : ''}`, {
            fontFamily: 'Futile', fontSize: '16px', color: '#ffdd88',
        });
        this.detailGroup.add(tokenT);

        this.createActionButton(panelX + 650, panelY + 40, 'Set Active', () => {
            playerProfile.setActiveHashmon(mon.tokenId);
            this.drawDetailCard(mon);
            this.refreshRosterHighlight();
        });
        this.createActionButton(panelX + 650, panelY + 80, 'Use in Battle', () => {
            playerProfile.setActiveHashmon(mon.tokenId);
            this.scene.start('BattleScene');
        });
        this.createActionButton(panelX + 650, panelY + 120, 'Open Garden', () => {
            playerProfile.setActiveHashmon(mon.tokenId);
            this.scene.start('GardenScene');
        });

        // ── STAT BARS ──
        const statBarStartX = panelX + 40;
        const statBarStartY = panelY + 210;
        const stats = [
            { key: 'hp',    label: 'HP',      color: 0x44cc44, base: mon.baseStats.hp },
            { key: 'atk',   label: 'ATK',     color: 0xff5544, base: mon.baseStats.atk },
            { key: 'def',   label: 'DEF',     color: 0xffaa33, base: mon.baseStats.def },
            { key: 'spAtk', label: 'SP.ATK',  color: 0x5599ff, base: mon.baseStats.spAtk },
            { key: 'spDef', label: 'SP.DEF',  color: 0x44ddaa, base: mon.baseStats.spDef },
            { key: 'speed', label: 'SPEED',   color: 0xdddd44, base: mon.baseStats.speed },
        ];

        stats.forEach((s, i) => {
            const sy = statBarStartY + i * 36;

            // Label
            const lab = this.add.text(statBarStartX, sy, s.label, {
                fontFamily: 'Futile', fontSize: '18px', color: '#cccccc',
            });
            this.detailGroup.add(lab);

            // Bar background
            const maxStatVal = 120; // Visual ceiling for bar scaling
            const barX = statBarStartX + 100;
            const barW = 340;
            const barH = 18;
            const ratio = Math.min(1, s.base / maxStatVal);

            const barBgG = this.add.graphics();
            barBgG.fillStyle(0x222244, 1);
            barBgG.fillRoundedRect(barX, sy + 2, barW, barH, 4);
            this.detailGroup.add(barBgG);

            const barFgG = this.add.graphics();
            barFgG.fillStyle(s.color, 1);
            barFgG.fillRoundedRect(barX, sy + 2, barW * ratio, barH, 4);
            this.detailGroup.add(barFgG);

            // Effective stat value
            const effectiveVal = s.key === 'hp' ? mon.maxHp : mon.getStat(s.key);
            const valT = this.add.text(barX + barW + 10, sy, `${effectiveVal}`, {
                fontFamily: 'Futile', fontSize: '18px', color: '#ffffff',
            });
            this.detailGroup.add(valT);

            // Base stat in parentheses
            const baseT = this.add.text(barX + barW + 55, sy, `(${s.base})`, {
                fontFamily: 'Futile', fontSize: '14px', color: '#888888',
            });
            this.detailGroup.add(baseT);
        });

        const portable = playerProfile.getPortableHashmon?.(mon.tokenId);
        if (portable) {
            const proofY = panelY + 430;
            const proofBg = this.add.graphics();
            proofBg.fillStyle(0x141a38, 0.96);
            proofBg.fillRoundedRect(panelX + 30, proofY, 450, 105, 10);
            proofBg.lineStyle(1, 0x3d67cc, 0.6);
            proofBg.strokeRoundedRect(panelX + 30, proofY, 450, 105, 10);
            this.detailGroup.add(proofBg);
            this.detailGroup.add(this.add.text(panelX + 45, proofY + 10, 'Cross-Game Interoperability Proof', {
                fontFamily: 'Futile', fontSize: '18px', color: '#ffdd88',
            }));
            this.detailGroup.add(this.add.text(panelX + 45, proofY + 36, `Schema: ${portable.schema}`, {
                fontFamily: 'Futile', fontSize: '14px', color: '#ffffff',
            }));
            this.detailGroup.add(this.add.text(panelX + 45, proofY + 56, `Battle → SPD ${portable.adapters.battle.speed}, Boost +${portable.adapters.battle.preBattleBoost}`, {
                fontFamily: 'Futile', fontSize: '13px', color: '#88ccff',
            }));
            this.detailGroup.add(this.add.text(panelX + 45, proofY + 76, `Garden → Move ${portable.adapters.garden.roamingSpeed}px/s, Mood ${portable.state.happiness}, Interactions ${portable.state.gardenInteractions}`, {
                fontFamily: 'Futile', fontSize: '13px', color: '#88ddaa',
            }));
        }

        // ── MOVES LIST ──
        const moveStartX = panelX + 530;
        const moveStartY = panelY + 210;

        const moveHeader = this.add.text(moveStartX, panelY + 180, 'MOVES', {
            fontFamily: 'Futile', fontSize: '22px', color: '#ffcc00',
        });
        this.detailGroup.add(moveHeader);

        mon.moves.forEach((move, i) => {
            const my = moveStartY + i * 80;

            // Move card background
            const moveBg = this.add.graphics();
            moveBg.fillStyle(0x1a1a3a, 0.8);
            moveBg.fillRoundedRect(moveStartX, my, 250, 68, 8);
            moveBg.lineStyle(1, 0x444488, 0.5);
            moveBg.strokeRoundedRect(moveStartX, my, 250, 68, 8);
            this.detailGroup.add(moveBg);

            // Move name
            const mName = this.add.text(moveStartX + 10, my + 6, move.name, {
                fontFamily: 'Futile', fontSize: '18px', color: '#ffffff',
            });
            this.detailGroup.add(mName);

            // Type + Category
            const mType = this.add.text(moveStartX + 10, my + 28, `${move.type}  |  ${move.category}`, {
                fontFamily: 'Futile', fontSize: '14px', color: '#aaaacc',
            });
            this.detailGroup.add(mType);

            // Power / Accuracy / PP
            const pwrLabel = move.power > 0 ? `Pwr:${move.power}` : 'Pwr:—';
            const mStats = this.add.text(moveStartX + 10, my + 48, `${pwrLabel}  Acc:${move.accuracy}%  PP:${move.currentPP}/${move.pp}`, {
                fontFamily: 'Futile', fontSize: '13px', color: '#88aacc',
            });
            this.detailGroup.add(mStats);
        });
    }

    buildRosterFromProfile() {
        if (!playerProfile.ownedHashmon || playerProfile.ownedHashmon.length === 0) {
            return [];
        }

        return playerProfile.ownedHashmon.map((nft) => {
            const mon = new Hashmon(nft.speciesKey, nft.level || 10);
            mon.name = nft.nickname || mon.name;
            mon.type = nft.type || mon.type;
            mon.tokenId = nft.tokenId;
            mon.normalizedStats = nft.normalizedStats || null;
            mon.companionState = nft.companionState || null;
            mon.customTextureKey = nft.customTextureKey || null;

            if (nft.stats) {
                mon.baseStats = { ...mon.baseStats, ...nft.stats };
                mon.maxHp = mon.calcMaxHp();
                mon.currentHp = mon.maxHp;
            }

            if (Array.isArray(nft.moves) && nft.moves.length) {
                mon.moves = nft.moves.map((key) => {
                    const move = MOVES[key];
                    return move ? { ...move, currentPP: move.pp } : {
                        name: key,
                        type: 'Normal',
                        category: 'Status',
                        power: 0,
                        accuracy: 100,
                        pp: 10,
                        currentPP: 10,
                    };
                });
            }

            return mon;
        });
    }

    // ═══════════════════════════════════════════════════════════
    // BUTTON HELPER
    // ═══════════════════════════════════════════════════════════

    fitImageToBox(image, maxWidth, maxHeight) {
        const sourceWidth = image.width || image.displayWidth || 1;
        const sourceHeight = image.height || image.displayHeight || 1;
        const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
        image.setScale(scale);
        return image;
    }

    createActionButton(x, y, text, onClick) {
        const btn = this.add.image(x, y, 'btn_normal').setInteractive().setScale(2.2, 1.1);
        const btnText = this.add.text(x, y, text, {
            fontFamily: 'Futile', fontSize: '14px', color: '#ffffff',
        }).setOrigin(0.5);

        btn.on('pointerover', () => { btn.setTexture('btn_hover'); btnText.setColor('#ffff00'); });
        btn.on('pointerout', () => { btn.setTexture('btn_normal'); btnText.setColor('#ffffff'); });
        btn.on('pointerdown', () => btn.setTexture('btn_pressed'));
        btn.on('pointerup', () => { btn.setTexture('btn_hover'); onClick(); });
    }

    createButton(x, y, text, onClick) {
        const btn = this.add.image(x, y, 'btn_normal').setInteractive().setScale(3.5, 1.8);
        const btnText = this.add.text(x, y, text, {
            fontFamily: 'Futile', fontSize: '22px', color: '#ffffff',
        }).setOrigin(0.5);

        btn.on('pointerover', () => { btn.setTexture('btn_hover'); btnText.setColor('#ffff00'); });
        btn.on('pointerout', () => { btn.setTexture('btn_normal'); btnText.setColor('#ffffff'); });
        btn.on('pointerdown', () => btn.setTexture('btn_pressed'));
        btn.on('pointerup', () => { btn.setTexture('btn_hover'); onClick(); });
    }
}
