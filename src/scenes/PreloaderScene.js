export class PreloaderScene extends Phaser.Scene {
    constructor() {
        super('PreloaderScene');
    }

    preload() {
        // Loading text (uses system font since custom font isn't ready yet)
        const loadingText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Loading Assets...',
            { fontFamily: 'Arial', fontSize: '32px', color: '#ffffff' }
        ).setOrigin(0.5);

        // ── Load Font via CSS FontFace API ──
        this.fontLoaded = false;
        const font = new FontFace('Futile', 'url("./assets/Futile 14.ttf")');
        font.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            this.fontLoaded = true;
        }).catch((error) => {
            console.error('Failed to load Futile 14.ttf font:', error);
            this.fontLoaded = true; // Proceed even on failure
        });

        // ── Hashmon Sprites & Assets ──
        this.load.image('space_bg', './assets/space.png');
        this.load.image('garden_bg', './assets/Garden.png');
        this.load.image('coin', './assets/coin.png');
        this.load.image('water_rat', './assets/WaterRat.png');
        this.load.image('fire_dragon', './assets/FireDragon.png');

        // ── UI: Panels ──
        this.load.image('panel_dark', './assets/Elements-pngs/Panels/panel-dark - md.png');
        this.load.image('panel_dark_sm', './assets/Elements-pngs/Panels/panel-dark - sm.png');

        // ── UI: Buttons ──
        this.load.image('btn_normal', './assets/Elements-pngs/Buttons/button normal - dark.png');
        this.load.image('btn_hover', './assets/Elements-pngs/Buttons/button hovered/active - dark.png');
        this.load.image('btn_pressed', './assets/Elements-pngs/Buttons/button pressed - dark.png');

        // ── UI: Inventory Slots ──
        this.load.image('inv_normal', './assets/Elements-pngs/Inventory Items/inventory normal  - dark.png');
        this.load.image('inv_hover', './assets/Elements-pngs/Inventory Items/inventory hovered  - dark.png');
        this.load.image('inv_selected', './assets/Elements-pngs/Inventory Items/inventory selected  - dark.png');

        // ── UI: Dialog Boxes (for stat bars in Inventory) ──
        this.load.image('dialog_blue', './assets/Elements-pngs/Generic or Dialog Boxes/generic box - blue left - dark - long.png');

        // Wait for both Phaser loader AND font to be ready
        this.load.on('complete', () => {
            const checkFont = setInterval(() => {
                if (this.fontLoaded) {
                    clearInterval(checkFont);
                    this.scene.start('StartScene');
                }
            }, 50);
        });
    }
}
