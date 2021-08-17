class PreloadScene extends Phaser.Scene {

  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image ('background', 'assets/background.png');
    this.load.image ('player', 'assets/player.png');
    this.load.image ('bullet', 'assets/beam.png');
    this.load.image ('enemy0', 'assets/enemy0.png');
    this.load.image ('enemy1', 'assets/enemy1.png');
    this.load.image ('retry', 'assets/reload.png');
    this.load.image ('home', 'assets/home.png');
    this.load.image ('sound', 'assets/sound.png');

    this.load.audio('laser', ['assets/laser.wav']);
    this.load.audio('explosion', ['assets/explosion.wav']);
    this.load.audio('bgm', ['assets/bgm.ogg']);
  }

  create() {
    this.music = this.sound.add('bgm'); 
    this.music.play({volume:0.5, loop: true});

    this.scene.start('HomeScene');
  }
}