export class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    create() {
        // Background
        const bg = this.add.image(0, 0, 'space_bg').setOrigin(0);
        bg.displayWidth = this.sys.game.config.width;
        bg.displayHeight = this.sys.game.config.height;

        // Title
        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 180,
            'HASHMON',
            { fontFamily: 'Futile', fontSize: '100px', color: '#ffcc00', stroke: '#000000', strokeThickness: 6 }
        ).setOrigin(0.5);

        // Subtitle
        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 110,
            'Decentralized Monster Battles',
            { fontFamily: 'Futile', fontSize: '20px', color: '#aaaaaa' }
        ).setOrigin(0.5);

        // Start Local Demo Button
        this.createButton(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 20,
            'Start Local Demo',
            () => this.scene.start('BattleScene')
        );

        // My Hashmon (Inventory) Button
        this.createButton(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'My Hashmon',
            () => this.scene.start('InventoryScene')
        );

        // Connect Wallet Button
        this.createButton(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 180,
            'Connect Wallet',
            () => this.scene.start('Web3Scene')
        );
    }

    createButton(x, y, text, onClick) {
        const btn = this.add.image(x, y, 'btn_normal').setInteractive();
        btn.setScale(4, 2);

        const btnText = this.add.text(x, y, text, {
            fontFamily: 'Futile',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
            btn.setTexture('btn_hover');
            btnText.setColor('#ffff00');
        });

        btn.on('pointerout', () => {
            btn.setTexture('btn_normal');
            btnText.setColor('#ffffff');
        });

        btn.on('pointerdown', () => {
            btn.setTexture('btn_pressed');
        });

        btn.on('pointerup', () => {
            btn.setTexture('btn_hover');
            onClick();
        });
    }
}
