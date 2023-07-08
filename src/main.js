import Phaser from './lib/phaser.js'
import Game from './scenes/Game.js'
import GameOver from './scenes/GameOver.js'

console.dir(Phaser)

// Calculate the width based on the device's screen size
const width = window.innerWidth > 0 ? window.innerWidth : screen.width;

export default new Phaser.Game({
    type: Phaser.AUTO,
    width: width,
    height: 640,
    scene: [Game, GameOver],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 200
            },
            debug: false
        }
    }
})
