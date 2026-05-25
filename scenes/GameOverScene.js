class GameOverScene extends Phaser.Scene {
  constructor() { super({ key:'GameOverScene' }); }

  init(data) {
    this.victory   = data && data.victory;
    this.lastLevel = (data && data.level) ? data.level : 1;
  }

  create() {
    const W=this.scale.width, H=this.scale.height;
    this.cameras.main.fadeIn(600, 0,0,0);
    this.victory ? this.showVictory(W,H) : this.showGameOver(W,H);
  }

  showGameOver(W, H) {
    this.add.rectangle(W/2,H/2,W,H,0x0a0000);
    const g = this.add.graphics();
    g.lineStyle(1, 0x330000, 0.45);
    for (let x=0;x<W;x+=40){ g.moveTo(x,0); g.lineTo(x,H); }
    for (let y=0;y<H;y+=40){ g.moveTo(0,y); g.lineTo(W,y); }
    g.strokePath();
    g.lineStyle(2, 0xff2200, 0.4); g.strokeRect(10,10,W-20,H-20);

    const title = this.add.text(W/2,H*0.28,'GAME OVER',{
      fontSize:'62px', fontFamily:'monospace', color:'#ff2200',
      stroke:'#330000', strokeThickness:8,
      shadow:{offsetX:0,offsetY:0,color:'#ff2200',blur:28,fill:true}
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:title, alpha:1, duration:480, ease:'Back.easeOut' });

    const sub = this.add.text(W/2,H*0.43,`Caught by a robot on Level ${this.lastLevel}`,{
      fontSize:'16px', fontFamily:'monospace', color:'#883300'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:sub, alpha:1, duration:480, delay:300 });

    this.time.delayedCall(600, () => {
      this.makeBtn(W/2, H*0.60, 'RETRY LEVEL',  0x1a0000, 0xff2200, () => {
        this.cameras.main.fadeOut(380);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('GameScene', { level:this.lastLevel }));
      });
      this.makeBtn(W/2, H*0.73, 'BACK TO MENU', 0x110000, 0x882200, () => {
        this.cameras.main.fadeOut(380);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
      });
      this.add.text(W/2,H*0.88,'[ R ] quick restart',{
        fontSize:'12px',fontFamily:'monospace',color:'#440000'
      }).setOrigin(0.5);
      this.input.keyboard.once('keydown-R', () =>
        this.scene.start('GameScene', { level:this.lastLevel }));
    });
  }

  showVictory(W, H) {
    this.add.rectangle(W/2,H/2,W,H,0x001508);
    const g = this.add.graphics();
    g.lineStyle(1, 0x003322, 0.45);
    for (let x=0;x<W;x+=40){ g.moveTo(x,0); g.lineTo(x,H); }
    for (let y=0;y<H;y+=40){ g.moveTo(0,y); g.lineTo(W,y); }
    g.strokePath();
    g.lineStyle(2, 0x00ffcc, 0.5); g.strokeRect(10,10,W-20,H-20);

    this.spawnConfetti(W, H);

    const title = this.add.text(W/2,H*0.26,'YOU ESCAPED!',{
      fontSize:'56px', fontFamily:'monospace', color:'#00ffcc',
      stroke:'#003322', strokeThickness:8,
      shadow:{offsetX:0,offsetY:0,color:'#00ffcc',blur:28,fill:true}
    }).setOrigin(0.5).setAlpha(0).setScale(0.4);
    this.tweens.add({ targets:title, alpha:1, scaleX:1, scaleY:1, duration:680, ease:'Back.easeOut' });

    const sub = this.add.text(W/2,H*0.41,'The lab is behind you. You are free.',{
      fontSize:'17px', fontFamily:'monospace', color:'#006644'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:sub, alpha:1, duration:580, delay:420 });

    const badge = this.add.text(W/2,H*0.51,'✓  ALL 5 LEVELS COMPLETED',{
      fontSize:'14px', fontFamily:'monospace', color:'#004433',
      backgroundColor:'#001a0d', padding:{x:14,y:7}
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:badge, alpha:1, duration:580, delay:750 });

    this.time.delayedCall(950, () => {
      this.makeBtn(W/2, H*0.65, 'PLAY AGAIN', 0x001a0d, 0x00ffcc, () => {
        this.cameras.main.fadeOut(380,0,13,26);
        this.cameras.main.once('camerafadeoutcomplete', () =>
          this.scene.start('GameScene', { level:1 }));
      });
      this.makeBtn(W/2, H*0.78, 'MAIN MENU', 0x001208, 0x006644, () => {
        this.cameras.main.fadeOut(380,0,13,26);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
      });
    });
  }

  makeBtn(x, y, label, bgCol, borderCol, cb) {
    const hex = '#' + borderCol.toString(16).padStart(6,'0');
    const bg  = this.add.rectangle(x,y,238,50,bgCol).setInteractive({ useHandCursor:true });
    const bd  = this.add.rectangle(x,y,238,50).setStrokeStyle(2, borderCol);
    const tx  = this.add.text(x,y,label,{ fontSize:'18px', fontFamily:'monospace', color:hex }).setOrigin(0.5);
    bg.on('pointerover', () => {
      bg.setFillStyle(borderCol); tx.setColor('#001a0d');
      this.tweens.add({ targets:[bg,bd,tx], scaleX:1.06, scaleY:1.06, duration:80 });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(bgCol); tx.setColor(hex);
      this.tweens.add({ targets:[bg,bd,tx], scaleX:1, scaleY:1, duration:80 });
    });
    bg.on('pointerdown', cb);
  }

  spawnConfetti(W, H) {
    const cols = [0x00ffcc,0x00ff88,0xffcc00,0x00aaff,0xff88cc,0x88ffaa];
    for (let i=0; i<35; i++) {
      const x = Phaser.Math.Between(20, W-20);
      const dot = this.add.rectangle(x, -10, 5+Math.random()*5, 5+Math.random()*5,
        Phaser.Utils.Array.GetRandom(cols));
      this.tweens.add({
        targets:dot, y:H+10, x:x+Phaser.Math.Between(-70,70),
        rotation:Phaser.Math.Between(0,7),
        duration:Phaser.Math.Between(2200,4200),
        delay:Phaser.Math.Between(0,1800),
        repeat:-1, ease:'Linear'
      });
    }
  }
}