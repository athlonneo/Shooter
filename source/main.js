//Nicholas Aditya Halim 2017730018

const config = {
  type: Phaser.AUTO,
  width: 1080,
  height: 720,
  pixelArt: true,
  transparent: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scene: [PreloadScene,HomeScene,PlayScene]
};

this.game = new Phaser.Game(config);
