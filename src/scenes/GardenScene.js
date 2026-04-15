import { playerProfile } from '../data/PlayerProfile.js';
import { SPECIES } from '../data/HashmonData.js';

export class GardenScene extends Phaser.Scene {
    constructor() {
        super('GardenScene');
    }

    create() {
        // ── Background ──
        const bg = this.add.image(0, 0, 'garden_bg').setOrigin(0);
        bg.displayWidth = this.sys.game.config.width;
        bg.displayHeight = this.sys.game.config.height;

        // ── UI Overlay ──
        this.add.image(10, 10, 'panel_dark').setOrigin(0).setDisplaySize(200, 60);
        this.add.image(30, 40, 'coin').setDisplaySize(30, 30);
        this.coinText = this.add.text(50, 25, `Coins: ${playerProfile.coins}`, {
            fontFamily: 'Futile',
            fontSize: '28px',
            color: '#ffd700'
        });

        const activePortable = playerProfile.getPortableActiveHashmon?.();
        if (activePortable) {
            this.add.text(220, 18, `Active: ${activePortable.tokenId} ${activePortable.identity.nickname}`, {
                fontFamily: 'Futile',
                fontSize: '18px',
                color: '#ffdd88'
            });
            this.add.text(220, 42, `Portable speed → Garden ${activePortable.adapters.garden.roamingSpeed}px/s | Mood ${activePortable.state.happiness}`, {
                fontFamily: 'Futile',
                fontSize: '14px',
                color: '#aaddff'
            });
        }

        // ── Exit Button ──
        const exitBtn = this.add.image(this.sys.game.config.width - 100, 40, 'btn_normal').setInteractive();
        exitBtn.setScale(1.5, 1);
        this.add.text(this.sys.game.config.width - 100, 40, 'Back', {
            fontFamily: 'Futile',
            fontSize: '20px',
            color: '#fff'
        }).setOrigin(0.5);

        exitBtn.on('pointerdown', () => exitBtn.setTexture('btn_pressed'));
        exitBtn.on('pointerup', () => {
            exitBtn.setTexture('btn_normal');
            this.scene.start('StartScene');
        });

        // ── Physics Group for Hashmon ──
        this.hashmonGroup = this.physics.add.group();

        // ── Spawn Hashmon ──
        if (playerProfile.ownedHashmon.length === 0) {
            this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 
                "You don't own any Hashmon yet.\nMint or buy one in the Web3 Hub!", {
                    fontFamily: 'Futile',
                    fontSize: '24px',
                    color: '#ffffff',
                    align: 'center'
            }).setOrigin(0.5);
        } else {
            playerProfile.ownedHashmon.forEach(nft => {
                const speciesData = SPECIES[nft.speciesKey];
                if (!speciesData) return;

                // Random starting position within screen bounds
                const startX = Phaser.Math.Between(100, this.sys.game.config.width - 100);
                const startY = Phaser.Math.Between(150, this.sys.game.config.height - 100);

                // Create Sprite
                const sprite = this.hashmonGroup.create(startX, startY, nft.customTextureKey || speciesData.textureKey);
                sprite.setScale(3); // make Hashmon bigger
                sprite.setInteractive();
                sprite.setCollideWorldBounds(true);
                sprite.setBounce(1);

                // Name label
                const isActive = playerProfile.getActiveHashmon?.()?.tokenId === nft.tokenId;
                const label = this.add.text(startX, startY - 40, `${isActive ? '★ ' : ''}${nft.nickname}`, {
                    fontFamily: 'Futile',
                    fontSize: '16px',
                    color: isActive ? '#ffdd88' : '#ffffff'
                }).setOrigin(0.5);

                // Semantic Mapping:
                // Normalized agility from the companion schema maps to roaming speed in the Garden.
                const portable = playerProfile.getPortableHashmon?.(nft.tokenId);
                const agility = portable?.stats?.normalized?.agility ?? speciesData.baseNormalizedStats.agility ?? 0.5;
                sprite.targetSpeed = 50 + (agility * 200);

                // Store reference
                sprite.nftData = nft;
                sprite.label = label;
                sprite.moveEvent = null;

                // Start moving
                this.scheduleRandomMovement(sprite);

                // Interaction Action (Click to feed/interact)
                sprite.on('pointerdown', () => this.interactWithHashmon(sprite));
            });
        }
    }

    update() {
        // Keep labels attached to sprites
        this.hashmonGroup.getChildren().forEach(sprite => {
            if (sprite.label) {
                sprite.label.setPosition(sprite.x, sprite.y - (sprite.displayHeight / 2) - 10);
            }
            if (sprite.body.velocity.x > 0) {
                sprite.setFlipX(true);
            } else if (sprite.body.velocity.x < 0) {
                sprite.setFlipX(false);
            }
        });
    }

    scheduleRandomMovement(sprite) {
        if (!sprite || !sprite.active) return;

        // Random duration to walk or stand still
        const duration = Phaser.Math.Between(1000, 3000);
        const action = Phaser.Math.Between(0, 3); // 0=Stop, 1-3=Move

        if (action === 0) {
            sprite.setVelocity(0, 0);
        } else {
            const angle = Phaser.Math.Between(0, 360);
            this.physics.velocityFromAngle(angle, sprite.targetSpeed, sprite.body.velocity);
        }

        sprite.moveEvent = this.time.delayedCall(duration, () => {
            this.scheduleRandomMovement(sprite);
        });
    }

    interactWithHashmon(sprite) {
        if (!sprite || !sprite.active) return;
        
        // Visual feedback
        sprite.setTint(0x00ff00);
        this.time.delayedCall(200, () => {
            if (sprite && sprite.active) sprite.clearTint();
        });
        
        // Stop briefly
        sprite.setVelocity(0, 0);
        
        // Delay the next movement by resetting the timer
        if (sprite.moveEvent) {
            sprite.moveEvent.destroy();
        }
        sprite.moveEvent = this.time.delayedCall(1500, () => {
            this.scheduleRandomMovement(sprite);
        });

        // Interaction Logic:
        // ERC-6551 Note: Because the Hashmon has its own Token Bound Account, 
        // interactions in the Garden (Game B) can accumulate state (e.g. happiness, stats, items) 
        // that belongs directly to the Hashmon NFT and can be read by Battle (Game A).

        const r = Math.random();
        
        // 40% chance to find a coin
        if (r < 0.4) {
            playerProfile.coins += 1;
            playerProfile.registerGardenInteraction?.(sprite.nftData?.tokenId, 'coin');
            this.coinText.setText(`Coins: ${playerProfile.coins}`);
            this.showFloatingText(sprite.x, sprite.y - 60, "+1 Coin!", '#ffd700');
        } 
        // 30% chance to increase a stat (Simulating ERC-6551 cross-game state saving)
        else if (r > 0.7) {
            playerProfile.registerGardenInteraction?.(sprite.nftData?.tokenId, 'exp');
            this.showFloatingText(sprite.x, sprite.y - 60, "Exp +10!", '#00ffff');
        } 
        // 30% chance just happy
        else {
            playerProfile.registerGardenInteraction?.(sprite.nftData?.tokenId, 'happy');
            this.showFloatingText(sprite.x, sprite.y - 60, "Happy!", '#ff66b2');
        }
    }

    showFloatingText(x, y, message, color) {
        const txt = this.add.text(x, y, message, {
            fontFamily: 'Futile',
            fontSize: '20px',
            color: color,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => txt.destroy()
        });
    }
}
