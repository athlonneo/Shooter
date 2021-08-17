const MAP_WIDTH = 2560;
const MAP_HEIGHT = 1440;
const MAP_BOUND_CORRECTION = 200;

const PLAYER_VELOCITY = 500;

const BULLET_VELOCITY = 1000;
const BULLET_DELAY = 200;
const BULLET_POOL = 20;
const BULLET_LIFESPAN = 1000;
const BULLET_DAMAGE = 1;

const ENEMY_VARIATION = 2;
const ENEMY_HEALTH = [4, 2];
const ENEMY_VELOCITY = [200, 400];
const ENEMY_SCORE = [1, 2];
const ENEMY_POOL = 10;
const ENEMY_SPAWN_DELAY = 1000;
const ENEMY_SPAWN_CORRECTION = 50;
const ENEMY_SPAWN_POINTS = [
  [-ENEMY_SPAWN_CORRECTION, -ENEMY_SPAWN_CORRECTION], [MAP_WIDTH+ENEMY_SPAWN_CORRECTION, -ENEMY_SPAWN_CORRECTION], [MAP_WIDTH/2,-ENEMY_SPAWN_CORRECTION],
  [-ENEMY_SPAWN_CORRECTION, MAP_HEIGHT+ENEMY_SPAWN_CORRECTION], [MAP_WIDTH+ENEMY_SPAWN_CORRECTION, MAP_HEIGHT+ENEMY_SPAWN_CORRECTION], [MAP_WIDTH/2, MAP_HEIGHT+ENEMY_SPAWN_CORRECTION],
  [-ENEMY_SPAWN_CORRECTION, MAP_HEIGHT/2], [MAP_WIDTH+ENEMY_SPAWN_CORRECTION, MAP_HEIGHT/2],
];

class PlayScene extends Phaser.Scene {

  constructor() {
    super('PlayScene');
  }

  create() {
    this.laserSound = this.sound.add("laser", {volume: 0.5});
    this.explosionSound = this.sound.add("explosion", {volume: 0.5});

    this.tileSprite = this.add.tileSprite(MAP_WIDTH/2, MAP_HEIGHT/2, MAP_WIDTH, MAP_HEIGHT, 'background');

    this.player = this.physics.add.sprite(MAP_WIDTH/2, MAP_HEIGHT/2, 'player').setOrigin(0.5);;
    this.player.setAngle(-90);
    this.player.setCollideWorldBounds(true);
    this.physics.world.enableBody(this.player);
    this.player.body.setSize(this.player.body.width*0.6, this.player.body.height*0.6, 0.5);
    
    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.physics.world.setBounds(MAP_BOUND_CORRECTION, MAP_BOUND_CORRECTION, MAP_WIDTH-MAP_BOUND_CORRECTION*2, MAP_HEIGHT-MAP_BOUND_CORRECTION*2);
    this.camera.startFollow(this.player, true, 0.05, 0.05);

    this.bound = this.add.rectangle(MAP_WIDTH/2, MAP_HEIGHT/2, MAP_WIDTH-MAP_BOUND_CORRECTION*2, MAP_HEIGHT-MAP_BOUND_CORRECTION*2);
    this.bound.setStrokeStyle(2, 0xffffff);
    this.tweens.add({
      targets: this.bound,
      alpha: 0,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    var Bullet = new Phaser.Class({Extends: Phaser.GameObjects.Sprite,
      initialize:
      function Bullet (scene)
      {
        this.lifespan = BULLET_LIFESPAN;

        Phaser.GameObjects.Sprite.call(this, scene, scene.player.x, scene.player.y, 'bullet');
        this.setAngle(scene.angle);

        scene.physics.world.enableBody(this);
        scene.physics.velocityFromAngle(scene.angle, BULLET_VELOCITY, this.body.velocity);
      },

      update: 
      function (time, delta)
      {
          this.lifespan -= delta;
          if (this.lifespan <= 0)
          {
            this.destroy();
          }
      }
    });

    this.lastFired = 0;
    this.bullets = this.add.group({
      classType: Bullet,
      maxSize: BULLET_POOL,
      runChildUpdate: true
    });

    var Enemy = new Phaser.Class({Extends: Phaser.GameObjects.Sprite,
      initialize:
      function Enemy (scene)
      {
        this.scene = scene;
        this.variant = Math.floor(Math.random()*ENEMY_VARIATION);
        this.health = ENEMY_HEALTH[this.variant];
        this.spawn = ENEMY_SPAWN_POINTS[Math.floor(Math.random()*ENEMY_SPAWN_POINTS.length)];

        Phaser.GameObjects.Sprite.call(this, scene, this.spawn[0], this.spawn[1], 'enemy'+this.variant);
        this.setTint(0xff0000);

        scene.physics.world.enableBody(this);
        this.body.setSize(this.body.width*0.7, this.body.height*0.7, 0.5);
      },

      damage:
      function(){
        this.setTint(0xffff00);
        this.scene.time.addEvent({
            delay: 50,
            callback: function(){ this.setTint(0xff0000); },
            callbackScope: this,
        });

        this.health -= BULLET_DAMAGE;
        if(this.health <= 0){
          this.scene.explosionSound.play();
          this.scene.score += ENEMY_SCORE[this.variant];
          this.scene.scoreText.setText(this.scene.score);
          this.destroy();
        }
      },

      update: 
      function (time, delta)
      {
        if(!this.scene.gameOver){
          this.scene.physics.moveToObject(this, this.scene.player, ENEMY_VELOCITY[this.variant]);
        }else{
          this.body.setVelocity(0);
        }
      }
    });

    this.lastSpawn = 0;
    this.enemies = this.add.group({
      classType: Enemy,
      maxSize: ENEMY_POOL,
      runChildUpdate: true
    });

    this.physics.add.overlap(this.player, this.enemies, this.playerDamage, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.enemyDamage, null, this);
    this.physics.add.collider(this.enemies, this.enemies);

    this.cursors = this.input.keyboard.addKeys({ 'up': Phaser.Input.Keyboard.KeyCodes.W, 'down': Phaser.Input.Keyboard.KeyCodes.S, 'left': Phaser.Input.Keyboard.KeyCodes.A,  'right': Phaser.Input.Keyboard.KeyCodes.D});
    
    this.worldPointerX = MAP_WIDTH/2;
    this.worldPointerY = 0;
    this.input.on('pointermove', function (pointer) {
      this.worldPointerX = pointer.x + this.camera.worldView.x;
      this.worldPointerY = pointer.y + this.camera.worldView.y;
    }, this);
    
    this.mouseDown = false;
    this.input.on('pointerdown', this.mouseHold, this);
    this.input.on('pointerup', this.mouseRelease, this);
    
    this.gameOver = false;

    this.score = 0;
    this.scoreText = this.add.text(config.width/2, config.height*0.1, String(this.score), {fill: "#ffffff", font: "500 70px Courier"}).setOrigin(0.5, 0);
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(1);
    this.scoreText.visible = false;

    this.retryButton = this.add.image(config.width/2, config.height*1/3, "retry").setInteractive();
    this.retryButton.setScrollFactor(0);
    this.retryButton.setDepth(1);
    this.retryButton.visible = false;
    this.retryButton.on('pointerup', () => {
      this.scene.start('PlayScene');
    })

    this.homeButton = this.add.image(config.width/2, config.height*2/3, "home").setInteractive();
    this.homeButton.setScrollFactor(0);
    this.homeButton.setDepth(1);
    this.homeButton.visible = false;
    this.homeButton.on('pointerup', () => {
      this.scene.start('HomeScene');
    })
  }

  mouseHold(){
    this.mouseDown = true;
  }

  mouseRelease(){
    this.mouseDown = false;
  }

  shootBullet(){
    return this.bullets.get();
  }

  playerDamage(player, enemy){
    if(!this.gameOver){
      this.tweens.add({
        targets: this.player,
        alpha: 0,
        duration: 1000,
        repeat: 0,
        onComplete:() => {
          this.explosionSound.play();
          this.retryButton.visible = true;
          this.homeButton.visible = true;
        },
        callbackScope: this,
      });
    }
    this.gameOver = true; 
  }

  enemyDamage(bullet, enemy){
    bullet.destroy();
    enemy.damage();
  }

  update(time, delta) {
    if(!this.scoreText.visible){
      this.scoreText.visible = true;
    }

    if(!this.gameOver){
      this.angle = Phaser.Math.RAD_TO_DEG * Phaser.Math.Angle.Between(this.player.x, this.player.y, this.worldPointerX, this.worldPointerY);
      this.player.setAngle(this.angle);
  
      this.player.setVelocity(0);
      if (this.cursors.left.isDown)
      {
          this.player.setVelocityX(-PLAYER_VELOCITY);
      }
      else if (this.cursors.right.isDown)
      {
          this.player.setVelocityX(PLAYER_VELOCITY);
      }
      
      if (this.cursors.up.isDown)
      {
          this.player.setVelocityY(-PLAYER_VELOCITY);
      }
      else if (this.cursors.down.isDown)
      {
          this.player.setVelocityY(PLAYER_VELOCITY);
      }
  
      if(this.mouseDown&& time > this.lastFired){
        if(this.shootBullet()){             
          this.lastFired = time + BULLET_DELAY;
          this.laserSound.play();
        }
      }
  
      if(time > this.lastSpawn){
        this.enemies.get();
        this.lastSpawn = time + ENEMY_SPAWN_DELAY;
      }
    }
    else{
      this.player.setVelocity(0);
    }
  }
}
