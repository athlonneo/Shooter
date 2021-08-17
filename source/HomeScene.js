class HomeScene extends Phaser.Scene {

  constructor() {
    super('HomeScene');
  }

  create() {  
    this.scene.launch('PlayScene');
    this.scene.pause('PlayScene');
    this.scene.moveAbove('PlayScene');
    this.title = this.add.text(config.width*0.5, config.height*0.1, String('SHOOTER'), {fill: "#ffffff", font: "500 70px Courier"}).setOrigin(0.5, 0).setDepth(1);

    this.soundButton = this.add.image(config.width*0.9, config.height*0.1, "sound").setInteractive().setDepth(1);
    this.soundButton.on('pointerup', () => {
      if(this.sound.mute){
        this.soundButton.setTint(0xffffff);
        this.sound.mute = false;
      }
      else{
        this.soundButton.setTint(0x000000);
        this.sound.mute = true;
      }
    })

    this.dummy = this.add.rectangle(MAP_WIDTH/2, MAP_HEIGHT/2, MAP_WIDTH-MAP_BOUND_CORRECTION*2, MAP_HEIGHT-MAP_BOUND_CORRECTION*2).setInteractive();
    this.dummy.on('pointerup', () => {
      this.scene.resume('PlayScene');
      this.scene.stop();
    })
  }
}