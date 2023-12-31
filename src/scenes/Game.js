import Phaser from '../lib/phaser.js'

// import the Carrot class here
import Carrot from '../game/Carrot.js'

export default class Game extends Phaser.Scene
{

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms

    /** @type {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots

    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    // registers the number of carrots collected
    carrotsCollected = 0

    constructor()
    {
        super('game')
    }

    init()
    {
        this.carrotsCollected = 0
    }

    preload()
    {
        // loads the background image
        this.load.image('background', 'assets/bg_layer1.png')
        // loads the platform image
        this.load.image('platform', 'assets/ground_grass.png')
        // loads the player character image
        this.load.image('bunny-stand', 'assets/bunny1_stand.png')
        // loads the player character jumpimg image
        this.load.image('bunny-jump', 'assets/bunny1_jump.png')
        // loads the jump sound
        this.load.audio('jump', 'assets/sfx/phaseJump1.ogg')
        // loads the keyboard cursors
        this.cursors = this.input.keyboard.createCursorKeys()
        // loads the carrot image
        this.load.image('carrot', 'assets/carrot.png')
    }

    create()
    {
        // creates the background
        this.add.image(240, 320, 'background')
            .setScrollFactor(1, 0)

        // makes the platforms part of a static group
        this.platforms = this.physics.add.staticGroup()

        const numPlatforms = 5;
        const platformSpacingY = 155; // Desired vertical spacing between platforms

        for (let j = 0; j < 1; ++j) {
            const startY = j * (numPlatforms * platformSpacingY);

            for (let i = 0; i < numPlatforms; ++i) {
                const x = Phaser.Math.Between(80, 400);
                const y = startY + platformSpacingY * i;

                /** @type {Phaser.Physics.Arcade.Sprite} */
                const platform = this.platforms.create(x, y, 'platform');
                platform.scale = 0.5;

                /** @type {Phaser.Physics.Arcade.StaticBody} */
                const body = platform.body;
                body.updateFromGameObject();
            }
        }

        // creates the player
        this.player = this.physics.add.sprite(240, 320, 'bunny-stand')
            .setScale(0.5)

        const originalWidth = this.textures.getFrame('bunny-stand').width;
        const originalHeight = this.textures.getFrame('bunny-stand').height;
        const scaledWidth = originalWidth * this.player.scaleX;
        const scaledHeight = originalHeight * this.player.scaleY + 100;
        
        this.player.body.setSize(scaledWidth, scaledHeight);

        // makes the player collides with the platforms
        this.physics.add.collider(this.platforms, this.player)
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        // makes the camera follow the player
        this.cameras.main.startFollow(this.player)
        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width * 1.5)

        // creates the carrots group
        this.carrots = this.physics.add.group({
            classType: Carrot
        })
        // made it 800 so the first carrot spawns off screen
        this.carrots.get(240, 800, 'carrot')

        // makes the carrots collide with the platforms
        this.physics.add.collider(this.platforms, this.carrots)

        // adds an overlap to make the carrots collectable
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot, // called on overlap
            undefined,
            this
        )
        
        // creates the carrot counter
        const style = { color: '#000', fontSize: 24 }
        this.carrotsCollectedText = this.add.text(240, 10, 'Cenouras: 0'
            , style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0)

        // Listen for pointer down event on the left side of the screen
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < this.scale.width / 2) {
                this.player.setVelocityX(-200);
            }
        });

        // Listen for pointer down event on the right side of the screen
        this.input.on('pointerdown', (pointer) => {
            if (pointer.x >= this.scale.width / 2) {
                this.player.setVelocityX(200);
            }
        });

        // Listen for pointer up event
        this.input.on('pointerup', () => {
            this.player.setVelocityX(0);
        });

    }

    update(t, dt)
    {
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child
        
            const scrollY = this.cameras.main.scrollY
            if (platform.y >= scrollY + 700)
            {
                platform.y = scrollY - Phaser.Math.Between(50, 100)
                platform.body.updateFromGameObject()

                // create a carrot above the platform being reused
                this.addCarrotAbove(platform)
            }
        })

        const touchingDown = this.player.body.touching.down

        if (touchingDown)
        {
            this.player.setVelocityY(-350)
            // switch to jump texture
            this.player.setTexture('bunny-jump')
            // play jump sound
            this.sound.play('jump')
        }

        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny-stand')
        {
            // switch back to jump when falling
            this.player.setTexture('bunny-stand')
        }

        // Left and right input logic
        if (this.cursors.left.isDown || (this.input.pointer1.isDown && this.input.pointer1.x < this.scale.width / 2)) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown || (this.input.pointer1.isDown && this.input.pointer1.x >= this.scale.width / 2)) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        this.horizontalWrap(this.player)

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200)
        {
            this.scene.start('game-over')
        }
    }

    /**
    * @param {Phaser.GameObjects.Sprite} sprite
    */
    horizontalWrap(sprite)
    {
        const halfWidth = sprite.displayWidth * 0.5
        const gameWidth = this.scale.width
        if (sprite.x < -halfWidth)
        {
        sprite.x = gameWidth + halfWidth
        }
        else if (sprite.x > gameWidth + halfWidth)
        {
        sprite.x = -halfWidth
        }
    }

    /**
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    addCarrotAbove(sprite)
    {
        const y = sprite.y - sprite.displayHeight

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        // set active and visible
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        carrot.body.setSize(carrot.width, carrot.height)

        // make sure body is enabed in the physics world
        this.physics.world.enable(carrot)

        return carrot
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Carrot} carrot
    */
    handleCollectCarrot(player, carrot)
    {
        // hide from display
        this.carrots.killAndHide(carrot)

        // disable from physics world
        this.physics.world.disableBody(carrot.body)

        // increments by 1 when a carrot is collected
        this.carrotsCollected++
        console.log(this.carrotsCollected)

        // create new text value and set it
        const value = `Cenouras: ${this.carrotsCollected}`
        this.carrotsCollectedText.setText(value)
    }

    findBottomMostPlatform()
    {
        const platforms = this.platforms.getChildren()
        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; ++i)
        {
            const platform = platforms[i]

            // discard any platforms that are above current
            if (platform.y < bottomPlatform.y)
            {
            continue
            }

            bottomPlatform = platform
        }

        return bottomPlatform
    }

}
