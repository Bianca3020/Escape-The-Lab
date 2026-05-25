class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(500, 0, 13, 26);
    this.createBg(W, H);

    this.add.text(W/2, H*0.26, 'ESCAPE THE LAB', {
      fontSize: '50px', fontFamily: 'monospace', color: '#00ffcc',
      stroke: '#003322', strokeThickness: 6,
      shadow: { offsetX:0, offsetY:0, color:'#00ffcc', blur:20, fill:true }
    }).setOrigin(0.5);

    this.add.text(W/2, H*0.39, '"Find the keycard and escape"', {
      fontSize: '16px', fontFamily: 'monospace', color: '#006688'
    }).setOrigin(0.5);

    this.makeStartBtn(W/2, H*0.60);

    ['[ WASD ] or [ ARROW KEYS ] — MOVE',
      '[ R ] RESTART   [ ESC ] PAUSE'
    ].forEach((t, i) => {
      this.add.text(W/2, H*0.78 + i*22, t, {
        fontSize:'13px', fontFamily:'monospace', color:'#004466'
      }).setOrigin(0.5);
    });

    const arrow = this.add.text(W/2, H*0.70, '▼', {
      fontSize:'14px', fontFamily:'monospace', color:'#00ffcc'
    }).setOrigin(0.5);
    this.tweens.add({ targets: arrow, alpha:0, duration:800, yoyo:true, repeat:-1 });

    const sl = this.add.rectangle(W/2, 0, W, 2, 0x00ffcc, 0.05);
    this.tweens.add({ targets:sl, y:H, duration:3000, repeat:-1, ease:'Linear' });
  }

  createBg(W, H) {
    this.add.rectangle(W/2, H/2, W, H, 0x000d1a);
    const g = this.add.graphics();
    g.lineStyle(1, 0x001a2e, 0.5);
    for (let x=0; x<W; x+=40) { g.moveTo(x,0); g.lineTo(x,H); }
    for (let y=0; y<H; y+=40) { g.moveTo(0,y); g.lineTo(W,y); }
    g.strokePath();

    [[20,20,1,1],[W-20,20,-1,1],[20,H-20,1,-1],[W-20,H-20,-1,-1]].forEach(([x,y,dx,dy])=>{
      g.lineStyle(2, 0x00ffcc, 0.8);
      g.moveTo(x, y+dy*20); g.lineTo(x,y); g.lineTo(x+dx*20,y);
      g.strokePath();
    });
    g.lineStyle(2, 0x00ffcc, 0.25);
    g.strokeRect(10, 10, W-20, H-20);
  }

  makeStartBtn(x, y) {
    const bg     = this.add.rectangle(x, y, 230, 52, 0x003322).setInteractive({ useHandCursor:true });
    const border = this.add.rectangle(x, y, 230, 52).setStrokeStyle(2, 0x00ffcc);
    const label  = this.add.text(x, y, '▶  START GAME', {
      fontSize:'18px', fontFamily:'monospace', color:'#00ffcc'
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x00ffcc); label.setColor('#000d1a');
      this.tweens.add({ targets:[bg,border,label], scaleX:1.05, scaleY:1.05, duration:100 });
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x003322); label.setColor('#00ffcc');
      this.tweens.add({ targets:[bg,border,label], scaleX:1, scaleY:1, duration:100 });
    });
    bg.on('pointerdown', () => {
      this.cameras.main.fadeOut(450, 0,13,26);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene', { level:1 }));
    });

    this.tweens.add({ targets:border, alpha:0.3, duration:1000, yoyo:true, repeat:-1 });
  }
}