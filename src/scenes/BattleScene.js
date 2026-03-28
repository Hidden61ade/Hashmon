/**
 * BattleScene.js
 * ──────────────────────────────────────────────────────────────
 * Pokémon-style turn-based battle scene powered by BattleEngine.
 * Displays HP bars, PP counts, stat HUDs, and a rich battle log.
 *
 * LAYOUT (1280×720):
 *   ┌──────────────────────────────────────────────────┐
 *   │  [Battle Log - top center 500×80]                │  y=10
 *   │                                                  │
 *   │  [Player HUD 280×70]          [Enemy HUD 280×70] │  y=120
 *   │                                                  │
 *   │   🐀 WaterRat               FireDragon 🐉        │  y=300
 *   │                                                  │
 *   ├──────────────────────────────────────────────────┤  y=520
 *   │ Move Info        │  [Btn] [Btn]                  │
 *   │ (left 460px)     │  [Btn] [Btn]  (right 800px)   │
 *   └──────────────────────────────────────────────────┘  y=720
 * ──────────────────────────────────────────────────────
 */
import { Hashmon } from '../data/Hashmon.js';
import { BattleEngine } from '../battle/BattleEngine.js';
import { playerProfile } from '../data/PlayerProfile.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
    }

    create() {
        const W = this.sys.game.config.width;   // 1280
        const H = this.sys.game.config.height;  // 720
        this.cameras.main.fadeIn(800, 0, 0, 0);

        // ═══════════════════════════════════════════════════════
        // 1. BACKGROUND
        // ═══════════════════════════════════════════════════════
        const bg = this.add.image(0, 0, 'space_bg').setOrigin(0);
        bg.displayWidth = W;
        bg.displayHeight = H;

        // ═══════════════════════════════════════════════════════
        // 2. CREATE HASHMON INSTANCES
        // ═══════════════════════════════════════════════════════
        this.playerMon = new Hashmon('WaterRat', 10);
        this.enemyMon = new Hashmon('FireDragon', 10);
        this.engine = new BattleEngine(this.playerMon, this.enemyMon);
        this.isAnimating = false;

        // ═══════════════════════════════════════════════════════
        // 3. HASHMON SPRITES (positioned in the middle zone)
        // ═══════════════════════════════════════════════════════
        // Player sprite — left side, vertically centered in battle area
        this.playerSprite = this.add.image(220, 340, 'water_rat').setScale(3);
        this.tweens.add({
            targets: this.playerSprite,
            y: 330, duration: 1500, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Enemy sprite — right side
        this.enemySprite = this.add.image(1060, 340, 'fire_dragon').setScale(3).setFlipX(true);
        this.tweens.add({
            targets: this.enemySprite,
            y: 325, duration: 2000, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ═══════════════════════════════════════════════════════
        // 4. STAT HUD CARDS (compact, above sprites)
        // ═══════════════════════════════════════════════════════
        this.createStatHuds();

        // ═══════════════════════════════════════════════════════
        // 5. BATTLE LOG (top center, compact)
        // ═══════════════════════════════════════════════════════
        this.createBattleLog();
        this.addLogMessage('A wild FireDragon appeared!');
        this.addLogMessage('What will WaterRat do?');

        // ═══════════════════════════════════════════════════════
        // 6. BOTTOM PANEL + SKILL BUTTONS
        // ═══════════════════════════════════════════════════════
        this.createBottomPanel();

        // ═══════════════════════════════════════════════════════
        // 7. PLAYER RANK BADGE (top-left corner)
        // ═══════════════════════════════════════════════════════
        this.createRankBadge();
    }

    // ═══════════════════════════════════════════════════════════
    // STAT HUD CARDS — compact version (280×70)
    // ═══════════════════════════════════════════════════════════

    createStatHuds() {
        // Player HUD — top-left, above the player sprite
        this.playerHud = this.createHudCard(30, 120, this.playerMon, '#66ccff');
        // Enemy HUD — top-right, above the enemy sprite
        this.enemyHud = this.createHudCard(970, 120, this.enemyMon, '#ff6666');
    }

    createHudCard(x, y, mon, nameColor) {
        const hud = {};
        const cardW = 280;
        const cardH = 70;

        // Background card
        hud.bg = this.add.graphics();
        hud.bg.fillStyle(0x111122, 0.85);
        hud.bg.fillRoundedRect(x, y, cardW, cardH, 8);
        hud.bg.lineStyle(2, 0x4444aa, 0.6);
        hud.bg.strokeRoundedRect(x, y, cardW, cardH, 8);

        // Name + Level (same line)
        hud.nameText = this.add.text(x + 10, y + 6, mon.name, {
            fontFamily: 'Futile', fontSize: '18px', color: nameColor,
        });
        hud.levelText = this.add.text(x + cardW - 10, y + 6, `Lv${mon.level}`, {
            fontFamily: 'Futile', fontSize: '16px', color: '#cccccc',
        }).setOrigin(1, 0);

        // HP bar
        hud.hpBarBg = this.add.graphics();
        hud.hpBar = this.add.graphics();
        hud.barX = x + 10;
        hud.barY = y + 30;
        hud.barWidth = cardW - 20;
        hud.barHeight = 14;
        hud.mon = mon;

        // HP text (numeric readout)
        hud.hpText = this.add.text(x + cardW - 10, y + 50, '', {
            fontFamily: 'Futile', fontSize: '14px', color: '#ffffff',
        }).setOrigin(1, 0);

        this.drawHpBar(hud);
        return hud;
    }

    drawHpBar(hud) {
        const mon = hud.mon;
        const ratio = Math.max(0, mon.currentHp) / mon.maxHp;

        let color = 0x00cc44;
        if (ratio <= 0.5) color = 0xddaa00;
        if (ratio <= 0.2) color = 0xcc2222;

        hud.hpBarBg.clear();
        hud.hpBarBg.fillStyle(0x222233, 1);
        hud.hpBarBg.fillRoundedRect(hud.barX, hud.barY, hud.barWidth, hud.barHeight, 3);

        hud.hpBar.clear();
        if (ratio > 0) {
            hud.hpBar.fillStyle(color, 1);
            hud.hpBar.fillRoundedRect(hud.barX, hud.barY, hud.barWidth * ratio, hud.barHeight, 3);
        }

        hud.hpText.setText(`${Math.max(0, mon.currentHp)} / ${mon.maxHp} HP`);
    }

    // ═══════════════════════════════════════════════════════════
    // BATTLE LOG — compact top-center
    // ═══════════════════════════════════════════════════════════

    createBattleLog() {
        const logW = 500;
        const logH = 80;
        const logX = this.cameras.main.centerX - logW / 2;
        const logY = 10;

        const logBg = this.add.graphics();
        logBg.fillStyle(0x0a0a1e, 0.85);
        logBg.fillRoundedRect(logX, logY, logW, logH, 10);
        logBg.lineStyle(2, 0x3344aa, 0.5);
        logBg.strokeRoundedRect(logX, logY, logW, logH, 10);

        this.logLines = [];
        this.logText = this.add.text(logX + 12, logY + 10, '', {
            fontFamily: 'Futile', fontSize: '16px', color: '#ccddff',
            wordWrap: { width: logW - 24 }, lineSpacing: 3,
        });
    }

    addLogMessage(msg) {
        this.logLines.push(msg);
        if (this.logLines.length > 4) this.logLines.shift();
        this.logText.setText(this.logLines.join('\n'));
    }

    // ═══════════════════════════════════════════════════════════
    // BOTTOM PANEL — 1280×200, split into info (left) + buttons (right)
    // ═══════════════════════════════════════════════════════════

    createBottomPanel() {
        const W = this.sys.game.config.width;
        const panelH = 200;
        const panelY = this.sys.game.config.height - panelH; // y=520

        // Panel background
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x0e0e28, 0.92);
        panelBg.fillRect(0, panelY, W, panelH);
        panelBg.lineStyle(2, 0x3344aa, 0.4);
        panelBg.lineBetween(0, panelY, W, panelY);

        // Vertical divider line
        const dividerX = 460;
        panelBg.lineStyle(1, 0x3344aa, 0.3);
        panelBg.lineBetween(dividerX, panelY + 10, dividerX, panelY + panelH - 10);

        // ── Info area (left side: 0–460) ──
        this.panelInfoText = this.add.text(30, panelY + 20, '', {
            fontFamily: 'Futile', fontSize: '16px', color: '#aabbcc',
            wordWrap: { width: 410 }, lineSpacing: 5,
        });
        this.updatePanelInfo(null);

        // ── 2×2 Skill Buttons (right side: 460–1280 = 820px wide) ──
        // Grid parameters
        const gridCenterX = dividerX + (W - dividerX) / 2; // center of right half = 870
        const btnW = 160;  // visual width of each button zone
        const btnH = 44;   // visual height of each button zone
        const gapX = 180;  // horizontal spacing between button centers
        const gapY = 55;   // vertical spacing between button centers
        const gridCenterY = panelY + panelH / 2; // vertical center of panel = 620

        this.skillButtons = [];
        this.skillTexts = [];

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const bx = gridCenterX + (col - 0.5) * gapX;   // two columns centered
            const by = gridCenterY + (row - 0.5) * gapY;    // two rows centered
            this.createSkillButton(bx, by, i);
        }
    }

    createSkillButton(x, y, moveIndex) {
        const move = this.playerMon.moves[moveIndex];

        // Draw button using graphics for precise sizing
        const btnW = 160;
        const btnH = 44;

        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x2a2a4a, 1);
        btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
        btnBg.lineStyle(2, 0x5555aa, 0.6);
        btnBg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);

        // Invisible interactive hit area
        const hitArea = this.add.rectangle(x, y, btnW, btnH).setInteractive().setAlpha(0.001);

        // Move name (top line) + PP (bottom line)
        const nameText = this.add.text(x, y - 9, move.name, {
            fontFamily: 'Futile', fontSize: '16px', color: '#ffffff',
        }).setOrigin(0.5);

        const ppText = this.add.text(x, y + 11, `PP  ${move.currentPP}/${move.pp}`, {
            fontFamily: 'Futile', fontSize: '13px', color: '#88aacc',
        }).setOrigin(0.5);

        // ── Hover: show move details in info panel ──
        hitArea.on('pointerover', () => {
            if (this.isAnimating) return;
            btnBg.clear();
            btnBg.fillStyle(0x3a3a6a, 1);
            btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
            btnBg.lineStyle(2, 0x7777cc, 0.8);
            btnBg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
            nameText.setColor('#ffff88');
            this.updatePanelInfo(moveIndex);
        });

        hitArea.on('pointerout', () => {
            if (this.isAnimating) return;
            this.redrawBtnNormal(btnBg, x, y, btnW, btnH, move.currentPP > 0);
            nameText.setColor(move.currentPP > 0 ? '#ffffff' : '#666666');
            this.updatePanelInfo(null);
        });

        hitArea.on('pointerdown', () => {
            if (this.isAnimating) return;
            btnBg.clear();
            btnBg.fillStyle(0x1a1a3a, 1);
            btnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
            btnBg.lineStyle(2, 0x4444aa, 0.6);
            btnBg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
        });

        hitArea.on('pointerup', () => {
            if (this.isAnimating) return;

            if (!this.playerMon.canUseMove(moveIndex)) {
                this.addLogMessage(`No PP left for ${move.name}!`);
                return;
            }

            this.executeTurn(moveIndex);
        });

        this.skillButtons.push({ hitArea, btnBg, x, y, btnW, btnH });
        this.skillTexts.push({ nameText, ppText, move });
    }

    redrawBtnNormal(btnBg, x, y, w, h, hasPP) {
        btnBg.clear();
        btnBg.fillStyle(hasPP ? 0x2a2a4a : 0x1a1a2a, 1);
        btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        btnBg.lineStyle(2, hasPP ? 0x5555aa : 0x333355, hasPP ? 0.6 : 0.3);
        btnBg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
    }

    /** Show move details (type, category, power, accuracy, description) */
    updatePanelInfo(moveIndex) {
        if (moveIndex === null) {
            this.panelInfoText.setText('Hover over a move to see details...');
            return;
        }
        const m = this.playerMon.moves[moveIndex];
        const pwr = m.power > 0 ? m.power : '—';
        const lines = [
            `${m.name}   [${m.type}]   ${m.category}`,
            `Power: ${pwr}   Accuracy: ${m.accuracy}%`,
            `PP: ${m.currentPP} / ${m.pp}`,
            ``,
            `${m.description}`,
        ];
        this.panelInfoText.setText(lines.join('\n'));
    }

    refreshButtonLabels() {
        this.skillTexts.forEach((entry, i) => {
            const move = this.playerMon.moves[i];
            entry.ppText.setText(`PP  ${move.currentPP}/${move.pp}`);

            if (move.currentPP <= 0) {
                entry.nameText.setColor('#666666');
                entry.ppText.setColor('#555555');
            } else {
                entry.nameText.setColor('#ffffff');
                entry.ppText.setColor('#88aacc');
            }

            // Redraw button background
            const btn = this.skillButtons[i];
            this.redrawBtnNormal(btn.btnBg, btn.x, btn.y, btn.btnW, btn.btnH, move.currentPP > 0);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // TURN EXECUTION — delegates to BattleEngine, then animates
    // ═══════════════════════════════════════════════════════════

    executeTurn(playerMoveIndex) {
        this.isAnimating = true;

        const events = this.engine.resolveTurn(playerMoveIndex);

        this.playEvents(events, 0, () => {
            if (this.engine.isBattleOver()) {
                this.handleBattleEnd();
                return;
            }

            this.refreshButtonLabels();
            this.drawHpBar(this.playerHud);
            this.drawHpBar(this.enemyHud);
            this.isAnimating = false;
            this.addLogMessage('What will WaterRat do?');
        });
    }

    /**
     * Recursively play battle events with appropriate delays
     * and animations for each event type.
     */
    playEvents(events, index, onComplete) {
        if (index >= events.length) {
            onComplete();
            return;
        }

        const evt = events[index];
        const next = () => this.playEvents(events, index + 1, onComplete);

        switch (evt.type) {
            case 'use_move':
                this.addLogMessage(evt.message);
                this.animateAttack(evt.side, next);
                break;

            case 'damage':
                this.drawHpBar(evt.side === 'player' ? this.enemyHud : this.playerHud);
                this.animateHit(evt.side === 'player' ? 'enemy' : 'player', next);
                break;

            case 'miss':
                this.addLogMessage(evt.message);
                this.time.delayedCall(800, next);
                break;

            case 'no_pp':
                this.addLogMessage(evt.message);
                this.time.delayedCall(800, next);
                break;

            case 'stat_change':
                this.addLogMessage(evt.message);
                this.time.delayedCall(800, next);
                break;

            case 'log':
                this.addLogMessage(evt.message);
                this.time.delayedCall(900, next);
                break;

            case 'faint':
                this.addLogMessage(evt.message);
                this.animateFaint(evt.side, next);
                break;

            default:
                next();
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // BATTLE ANIMATIONS
    // ═══════════════════════════════════════════════════════════

    animateAttack(side, onDone) {
        const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
        const dx = side === 'player' ? 60 : -60;
        this.tweens.add({
            targets: sprite, x: sprite.x + dx,
            duration: 120, yoyo: true,
            onComplete: () => this.time.delayedCall(200, onDone),
        });
    }

    animateHit(targetSide, onDone) {
        const sprite = targetSide === 'player' ? this.playerSprite : this.enemySprite;
        this.tweens.add({
            targets: sprite, alpha: 0.2,
            duration: 80, yoyo: true, repeat: 2,
            onComplete: () => this.time.delayedCall(300, onDone),
        });
    }

    animateFaint(side, onDone) {
        const sprite = side === 'player' ? this.playerSprite : this.enemySprite;
        this.tweens.add({
            targets: sprite, alpha: 0, y: sprite.y + 40,
            duration: 600, ease: 'Power2',
            onComplete: () => this.time.delayedCall(600, onDone),
        });
    }

    // ═══════════════════════════════════════════════════════════
    // BATTLE END
    // ═══════════════════════════════════════════════════════════

    handleBattleEnd() {
        if (this.engine.didPlayerWin()) {
            playerProfile.recordWin();
            this.addLogMessage('You defeated FireDragon!');
            this.addLogMessage(`Victory!  +25 ELO  (${playerProfile.elo})`);
        } else {
            playerProfile.recordLoss();
            this.addLogMessage('WaterRat fainted...');
            this.addLogMessage(`You blacked out!  -20 ELO  (${playerProfile.elo})`);
        }
        this.time.delayedCall(3000, () => this.scene.start('StartScene'));
    }

    // ═══════════════════════════════════════════════════════════
    // PLAYER RANK BADGE
    // ═══════════════════════════════════════════════════════════

    createRankBadge() {
        const rank = playerProfile.getRank();
        const pp = playerProfile;
        const bx = 1100;
        const by = 10;

        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x111122, 0.8);
        badgeBg.fillRoundedRect(bx, by, 170, 50, 8);
        badgeBg.lineStyle(1, 0x3344aa, 0.5);
        badgeBg.strokeRoundedRect(bx, by, 170, 50, 8);

        // Rank icon circle
        const iconBg = this.add.graphics();
        iconBg.fillStyle(Phaser.Display.Color.HexStringToColor(rank.color).color, 0.4);
        iconBg.fillCircle(bx + 22, by + 25, 14);
        this.add.text(bx + 22, by + 25, rank.name.charAt(0), {
            fontFamily: 'Futile', fontSize: '16px', color: rank.color,
        }).setOrigin(0.5);

        this.add.text(bx + 44, by + 8, rank.name, {
            fontFamily: 'Futile', fontSize: '14px', color: rank.color,
        });
        this.add.text(bx + 44, by + 28, `W:${pp.wins} L:${pp.losses}`, {
            fontFamily: 'Futile', fontSize: '12px', color: '#aabbcc',
        });
    }
}
