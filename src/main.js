import { PreloaderScene } from './scenes/PreloaderScene.js';
import { StartScene } from './scenes/StartScene.js';
import { Web3Scene } from './scenes/Web3Scene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { InventoryScene } from './scenes/InventoryScene.js';

const config = {
    type: Phaser.AUTO,
    title: 'Hashmon',
    description: 'Web3 Monster Battling RPG',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#040218',
    pixelArt: true,
    scene: [
        PreloaderScene,
        StartScene,
        Web3Scene,
        BattleScene,
        InventoryScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);