import Phaser from '../lib/phaser.js'

export default class GameOver extends Phaser.Scene {
    constructor() {
        super('game-over')
    }

    create() {
        const width = this.scale.width
        const height = this.scale.height

        this.add.text(width * 0.5, height * 0.5, 'Game Over', {
            fontSize: 48
        })
        .setOrigin(0.5)

        const restartGame = () => {
            this.scene.start('game')
        }

        // Handle touch input
        this.input.on('pointerdown', () => {
            restartGame()
        })

        // Handle space key for PC
        this.input.keyboard.once('keydown-SPACE', () => {
            restartGame()
        })
    }
}
