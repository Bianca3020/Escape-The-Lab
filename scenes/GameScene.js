class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.currentLevel = (data && data.level) ? data.level : 1;
    this.hasKeycard   = false;
    this.isPaused     = false;
    this.isGameOver   = false;
    this.pauseOverlay = null;
    this.gridMatrix   = [];

    this.startTime   = 0;
    this.elapsedTime = 0;

    this.bestTimes = JSON.parse(
      localStorage.getItem('escapeLabBestTimes')
    ) || {};
  }

  preload() {
    const g = this.make.graphics({ x:0, y:0, add:false });

    g.clear();
    g.fillStyle(0x0a1a0a); g.fillRect(0,0,32,32);
    g.fillStyle(0x00ff88); g.fillRect(4,4,24,24);
    g.fillStyle(0x003311); g.fillRect(9,9,14,14);
    g.fillStyle(0x00ff88); g.fillRect(13,13,6,6);
    g.fillRect(14,0,4,6); g.fillRect(12,5,8,3);
    g.generateTexture('player', 32, 32);

    g.clear();
    g.fillStyle(0x1a0000); g.fillRect(0,0,32,32);
    g.fillStyle(0xcc1100); g.fillRect(4,4,24,24);
    g.fillStyle(0x550000); g.fillRect(8,4,16,11);
    g.fillStyle(0xff4400); g.fillRect(10,6,5,5); g.fillRect(17,6,5,5);
    g.fillStyle(0xff0000); g.fillRect(6,17,20,9);
    g.fillStyle(0xff6600); g.fillRect(9,27,4,5); g.fillRect(19,27,4,5);
    g.generateTexture('robot', 32, 32);

    g.clear();
    g.fillStyle(0x221100); g.fillRect(0,0,28,18);
    g.fillStyle(0xffcc00); g.fillRect(2,2,24,14);
    g.fillStyle(0x221100); g.fillRect(4,4,9,9);
    g.fillStyle(0xffee44); g.fillRect(5,5,7,7);
    g.fillStyle(0xffcc00); g.fillRect(15,5,8,2); g.fillRect(15,9,8,2); g.fillRect(15,13,5,2);
    g.generateTexture('keycard', 28, 18);

    g.clear();
    g.fillStyle(0x0a1525); g.fillRect(0,0,34,42);
    g.fillStyle(0x1a3a5a); g.fillRect(2,2,30,38);
    g.fillStyle(0x2a5a8a); g.fillRect(5,5,24,30);
    g.lineStyle(1, 0x3a7aaa, 1); g.strokeRect(5,5,24,30);
    g.fillStyle(0xff3300); g.fillCircle(17,39,4);
    g.generateTexture('door_locked', 34, 42);

    g.clear();
    g.fillStyle(0x001020); g.fillRect(0,0,34,42);
    g.fillStyle(0x002030); g.fillRect(2,2,30,38);
    g.lineStyle(2, 0x00ffcc, 1); g.strokeRect(5,5,24,30);
    g.lineStyle(1, 0x00aa88, 1); g.strokeRect(8,8,18,24);
    g.fillStyle(0x00ff88); g.fillCircle(17,39,4);
    g.generateTexture('door_open', 34, 42);

    g.clear();
    g.fillStyle(0x111e2e); g.fillRect(0,0,40,40);
    g.fillStyle(0x0a1520); g.fillRect(1,1,37,18);
    g.fillRect(3,21,34,17);
    g.lineStyle(1, 0x1e3048, 1); g.strokeRect(0,0,40,40);
    g.lineStyle(1, 0x253850, 0.5); g.strokeRect(1,1,37,18); g.strokeRect(3,21,34,17);
    g.generateTexture('wall', 40, 40);

    g.clear();
    g.fillStyle(0x040b12); g.fillRect(0,0,40,40);
    g.lineStyle(1, 0x0a1820, 1); g.strokeRect(0,0,40,40);
    g.fillStyle(0x060e18); g.fillRect(1,1,18,18); g.fillRect(21,21,18,18);
    g.generateTexture('floor', 40, 40);

    this.load.audio('dooropen', 'sfx/dooropen.mp3');
    this.load.audio('explode', 'sfx/explode.mp3');

    g.destroy();
  }

  create() {
    const lvl = LEVELS[this.currentLevel - 1];
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(400, 0,13,26);
    this.startTime = this.time.now;

    for (let x=0; x<W; x+=40)
      for (let y=0; y<H; y+=40)
        this.add.image(x+TILE/2, y+TILE/2, 'floor');

    this.wallGroup  = this.physics.add.staticGroup();
    this.robotGroup = this.physics.add.group();
    this.kcGroup    = this.physics.add.staticGroup();
    this.doorGroup  = this.physics.add.staticGroup();

    this.gridMatrix = Array(15).fill(null).map(() => Array(20).fill(0));
    lvl.walls.forEach(w => {
      if(w.y >= 0 && w.y < 15 && w.x >= 0 && w.x < 20) {
        this.gridMatrix[w.y][w.x] = 1;
      }
    });

    this.buildWalls(lvl.walls);
    this.buildKeycard(lvl.keycard);
    this.buildDoor(lvl.door);
    this.buildPlayer(lvl.playerStart);
    this.buildRobots(lvl.robots);
    this.buildHUD(lvl);
    this.buildInput();
    this.buildColliders();
  }

  buildWalls(walls) {
    walls.forEach(({x,y}) => {
      const w = this.wallGroup.create(x*TILE+TILE/2, y*TILE+TILE/2, 'wall');
      w.setImmovable(true).refreshBody();
    });
  }

  buildKeycard({x, y}) {
    this.kc = this.kcGroup.create(x*TILE+TILE/2, y*TILE+TILE/2, 'keycard');
    this.kc.refreshBody();
    this.tweens.add({ targets:this.kc, y:this.kc.y-7, duration:850, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });

    this.kcGlow = this.add.graphics();
    this.kcGlow.fillStyle(0xffcc00, 0.12);
    this.kcGlow.fillCircle(0, 0, 22);
    this.kcGlow.setPosition(x*TILE+TILE/2, y*TILE+TILE/2);
    this.tweens.add({ targets:this.kcGlow, scaleX:1.6, scaleY:1.6, alpha:0, duration:1100, yoyo:true, repeat:-1 });
  }

  buildDoor({x, y}) {
    this.door = this.doorGroup.create(x*TILE+TILE/2, y*TILE+TILE/2+4, 'door_locked');
    this.door.setSize(30, 40).refreshBody();

    this.doorGlow = this.add.graphics();
    this.doorGlow.fillStyle(0x0044ff, 0.08);
    this.doorGlow.fillRect(-20,-24,40,48);
    this.doorGlow.setPosition(x*TILE+TILE/2, y*TILE+TILE/2+4);
    this.tweens.add({ targets:this.doorGlow, alpha:0.03, duration:900, yoyo:true, repeat:-1 });
  }

  buildRobots(robots) {
    robots.forEach((robotData) => {
      let spawnX = robotData.x;
      let spawnY = robotData.y;

      if (robotData.dir === 'chaser') {
        const pos = this.getRandomEmptyTile(7);
        spawnX = pos.x;
        spawnY = pos.y;
      }

      const r = this.robotGroup.create(
        spawnX * TILE + TILE/2,
        spawnY * TILE + TILE/2,
        'robot'
      );

      r.setSize(24, 24);
      r.setCollideWorldBounds(true);
      r.body.setImmovable(false);
      r.patrolDir   = robotData.dir;
      r.patrolSpeed = robotData.speed;
      r.currentFacing = 1;
      r.moveDir = { x:0, y:0 };
      r.nextMoveTime = 0;

      const gl = this.add.graphics();
      gl.fillStyle(0xff1100, 0.13);
      gl.fillCircle(0, 0, 24);
      r.glowRef = gl;
    });
  }

  buildPlayer({x, y}) {
    this.player = this.physics.add.image(
      x*TILE+TILE/2,
      y*TILE+TILE/2,
      'player'
    );
    this.player.setSize(22, 22)
      .setCollideWorldBounds(true)
      .setDepth(10);
    this.playerTileX = x;
    this.playerTileY = y;
  }

  buildHUD(lvl) {
    const W = this.scale.width;
    const H = this.scale.height;
    const best = this.bestTimes[`level_${this.currentLevel}`];

    this.bestText = this.add.text(W/2, 48,
      best ? `BEST: ${best.toFixed(1)}s` : `BEST: --`,
      { fontSize:'10px', fontFamily:'monospace', color:'#ffaa00' }
    ).setOrigin(0.5,0).setDepth(21);

    const hg = this.add.graphics().setDepth(20);
    hg.fillStyle(0x000d1a, 0.88);
    hg.fillRect(0,0,W,38);
    hg.lineStyle(1, 0x00ffcc, 0.25);
    hg.strokeRect(0,37,W,1);

    this.add.text(10, 11, `LEVEL ${this.currentLevel}  |  ${lvl.title}`, {
      fontSize:'13px', fontFamily:'monospace', color:'#00ffcc'
    }).setDepth(21);

    this.hudObj = this.add.text(W/2, 11, `▶ ${lvl.hint}`, {
      fontSize:'12px', fontFamily:'monospace', color:'#006688'
    }).setOrigin(0.5,0).setDepth(21);

    this.timerText = this.add.text(W/2, H - 32, 'TIME: 0.0s', {
      fontSize:'13px', fontFamily:'monospace', color:'#00ffaa',
      backgroundColor:'#001a0d', padding:{x:8,y:4}
    }).setOrigin(0.5,0.5).setDepth(21);

    this.hudKC = this.add.text(W-10, 11, 'KEY: NOT FOUND', {
      fontSize:'12px', fontFamily:'monospace', color:'#554400'
    }).setOrigin(1,0).setDepth(21);

    const rb = this.add.text(W-8, H-8, '[R] RESTART', {
      fontSize:'11px', fontFamily:'monospace', color:'#336655',
      backgroundColor:'#001a0d', padding:{x:5,y:3}
    }).setOrigin(1,1).setDepth(21).setInteractive({ useHandCursor:true });
    rb.on('pointerover', ()=>rb.setColor('#00ff88'));
    rb.on('pointerout',  ()=>rb.setColor('#336655'));
    rb.on('pointerdown', ()=>this.restartLevel());

    const mb = this.add.text(8, H-8, '[ESC] MENU', {
      fontSize:'11px', fontFamily:'monospace', color:'#336655',
      backgroundColor:'#001a0d', padding:{x:5,y:3}
    }).setOrigin(0,1).setDepth(21).setInteractive({ useHandCursor:true });
    mb.on('pointerover', ()=>mb.setColor('#00ff88'));
    mb.on('pointerout',  ()=>mb.setColor('#336655'));
    mb.on('pointerdown', ()=>this.goMenu());
  }

  buildInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.input.keyboard.on('keydown-R',   () => this.restartLevel());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
  }

  buildColliders() {
    this.physics.add.collider(this.player, this.wallGroup);

    this.physics.add.collider(this.robotGroup, this.wallGroup, (robot) => {
      if (robot.patrolDir === 'horizontal') {
        robot.currentFacing = robot.body.touching.left ? 1 : -1;
        robot.setVelocity(robot.patrolSpeed * robot.currentFacing, 0);
      } else if (robot.patrolDir === 'vertical') {
        robot.currentFacing = robot.body.touching.up ? 1 : -1;
        robot.setVelocity(0, robot.patrolSpeed * robot.currentFacing);
      }
    });

    this.physics.add.overlap(this.player, this.kcGroup,    this.onPickupKC,  null, this);
    this.physics.add.overlap(this.player, this.doorGroup,  this.onEnterDoor, null, this);
    this.physics.add.overlap(this.player, this.robotGroup, this.onHitRobot,  null, this);
  }

  update() {
    if (this.isPaused || this.isGameOver) return;
    this.movePlayer();
    this.updateRobots();
    this.updateTimer();
  }

  movePlayer() {
    const spd = 160;
    const { cursors, wasd, player } = this;
    let vx = 0, vy = 0;
    if (cursors.left.isDown  || wasd.left.isDown)  vx = -spd;
    if (cursors.right.isDown || wasd.right.isDown) vx =  spd;
    if (cursors.up.isDown    || wasd.up.isDown)    vy = -spd;
    if (cursors.down.isDown  || wasd.down.isDown)  vy =  spd;
    if (vx && vy) { vx *= 0.707; vy *= 0.707; }
    player.setVelocity(vx, vy);
  }

  updateRobots() {
    this.robotGroup.getChildren().forEach(r => {
      if (r.patrolDir === 'horizontal') {
        if (r.body.blocked.left)  r.currentFacing = 1;
        if (r.body.blocked.right) r.currentFacing = -1;
        r.setVelocity(r.patrolSpeed * r.currentFacing, 0);
      }
      else if (r.patrolDir === 'vertical') {
        if (r.body.blocked.up)   r.currentFacing = 1;
        if (r.body.blocked.down) r.currentFacing = -1;
        r.setVelocity(0, r.patrolSpeed * r.currentFacing);
      }
      else if (r.patrolDir === 'chaser') {
        const dist = Phaser.Math.Distance.Between(r.x, r.y, this.player.x, this.player.y);
        const detectRadius = 240;

        if (dist <= detectRadius) {
          r.isChasing = true;
          if (this.time.now > r.nextMoveTime) {
            const rx = Math.floor(r.x / TILE);
            const ry = Math.floor(r.y / TILE);
            const px = Math.floor(this.player.x / TILE);
            const py = Math.floor(this.player.y / TILE);
            r.moveDir = this.calculateChaseAI(rx, ry, px, py, r.moveDir);
            r.nextMoveTime = this.time.now + 180;
          }
          if (
            r.body.blocked.left ||
            r.body.blocked.right ||
            r.body.blocked.up ||
            r.body.blocked.down
          ) {

            const dirs = [
              { x:1, y:0 },
              { x:-1, y:0 },
              { x:0, y:1 },
              { x:0, y:-1 }
            ];

            Phaser.Utils.Array.Shuffle(dirs);

            for (const d of dirs) {

              const nx = Math.floor(r.x / TILE) + d.x;
              const ny = Math.floor(r.y / TILE) + d.y;

              if (
                nx >= 0 &&
                nx < 20 &&
                ny >= 0 &&
                ny < 15 &&
                this.gridMatrix[ny][nx] === 0
              ) {
                r.moveDir = d;
                break;
              }
            }
          }
          r.setVelocity(r.moveDir.x * r.patrolSpeed, r.moveDir.y * r.patrolSpeed);
        }
        else {
          r.isChasing = false;
          if (this.time.now > r.nextMoveTime) {
            const dirs = [
              { x:1, y:0 }, { x:-1, y:0 },
              { x:0, y:1 }, { x:0, y:-1 }
            ];
            Phaser.Utils.Array.Shuffle(dirs);
            const rx = Math.floor(r.x / TILE);
            const ry = Math.floor(r.y / TILE);
            let picked = { x:0, y:0 };
            for (const d of dirs) {
              const nx = rx + d.x;
              const ny = ry + d.y;
              if (nx >= 0 && nx < 20 && ny >= 0 && ny < 15 && this.gridMatrix[ny][nx] === 0) {
                picked = d;
                break;
              }
            }
            r.moveDir = picked;
            r.nextMoveTime = this.time.now + Phaser.Math.Between(700, 1400);
          }
          r.setVelocity(r.moveDir.x * (r.patrolSpeed * 0.6), r.moveDir.y * (r.patrolSpeed * 0.6));
        }
      }

      if (r.glowRef) {
        r.glowRef.x = r.x;
        r.glowRef.y = r.y;
      }
    });
  }

  updateTimer() {
    this.elapsedTime = (this.time.now - this.startTime) / 1000;
    this.timerText.setText(`TIME: ${this.elapsedTime.toFixed(1)}s`);
  }

  calculateChaseAI(rx, ry, px, py, currentDir) {
    const directions = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    let bestDir = currentDir;
    let bestScore = Infinity;

    for (const d of directions) {
      const nx = rx + d.x;
      const ny = ry + d.y;
      if (nx < 0 || nx >= 20 || ny < 0 || ny >= 15) continue;
      if (this.gridMatrix[ny][nx] === 1) continue;
      const reverse = d.x === -currentDir.x && d.y === -currentDir.y;
      let score = Phaser.Math.Distance.Between(nx, ny, px, py);
      if (reverse) score += 2;
      if (score < bestScore) { bestScore = score; bestDir = d; }
    }
    return bestDir;
  }

  getRandomEmptyTile(minDistance = 6) {
    let tx, ty;
    const playerTileX = Math.floor(this.player.x / TILE);
    const playerTileY = Math.floor(this.player.y / TILE);

    for (let i = 0; i < 200; i++) {
      tx = Phaser.Math.Between(1, 18);
      ty = Phaser.Math.Between(1, 13);
      if (this.gridMatrix[ty][tx] === 1) continue;
      const dist = Phaser.Math.Distance.Between(tx, ty, playerTileX, playerTileY);
      if (dist < minDistance) continue;
      let occupied = false;
      this.robotGroup.getChildren().forEach(r => {
        const rx = Math.floor(r.x / TILE);
        const ry = Math.floor(r.y / TILE);
        if (rx === tx && ry === ty) occupied = true;
      });
      if (occupied) continue;
      return { x: tx, y: ty };
    }
    return { x: 10, y: 10 };
  }

  onPickupKC(player, kc) {
    this.hasKeycard = true;
    kc.destroy();
    if (this.kcGlow) this.kcGlow.destroy();
    this.door.setTexture('door_open');
    this.hudKC.setText('KEY: FOUND!').setColor('#ffcc00');
    this.hudObj.setText('▶ Reach the exit door!').setColor('#00ffcc');
    this.cameras.main.flash(280, 255,200,0, true);

    const t = this.add.text(player.x, player.y-20, '+ KEYCARD', {
      fontSize:'14px', fontFamily:'monospace', color:'#ffcc00'
    }).setDepth(30).setOrigin(0.5);
    this.tweens.add({ targets:t, y:t.y-50, alpha:0, duration:900, onComplete:()=>t.destroy() });
  }

  onEnterDoor() {
    if (!this.hasKeycard || this.isGameOver) return;
    this.sound.play('dooropen', { volume: 0.38 });
    this.isGameOver = true;

    const levelKey = `level_${this.currentLevel}`;
    const currentBest = this.bestTimes[levelKey];
    if (!currentBest || this.elapsedTime < currentBest) {
      this.bestTimes[levelKey] = this.elapsedTime;
      localStorage.setItem('escapeLabBestTimes', JSON.stringify(this.bestTimes));
    }

    this.player.setVelocity(0,0);
    this.robotGroup.getChildren().forEach(r => r.setVelocity(0,0));

    const W = this.scale.width;
    const H = this.scale.height;

    // ─── Overlay & Box ───────────────────────────────────────
    // Box: 420 wide, 320 tall → top = H/2 - 160, bottom = H/2 + 160
    const BOX_H = 320;
    const HALF  = BOX_H / 2; // 160

    this.add.rectangle(W/2, H/2, W, H, 0x000814, 0.82).setDepth(100);
    this.add.rectangle(W/2, H/2, 420, BOX_H, 0x001827)
      .setStrokeStyle(3, 0x00ffcc)
      .setDepth(101);

    // ─── Title  (top area of box) ─────────────────────────────
    this.add.text(W/2, H/2 - HALF + 32, `LEVEL ${this.currentLevel} COMPLETE`, {
      fontSize:'28px', fontFamily:'monospace', color:'#00ffcc'
    }).setOrigin(0.5).setDepth(102);

    // ─── Time ────────────────────────────────────────────────
    this.add.text(W/2, H/2 - HALF + 88, `TIME : ${this.elapsedTime.toFixed(1)}s`, {
      fontSize:'22px', fontFamily:'monospace', color:'#00ffaa'
    }).setOrigin(0.5).setDepth(102);

    // ─── Best ────────────────────────────────────────────────
    this.add.text(W/2, H/2 - HALF + 128, `BEST : ${this.bestTimes[levelKey].toFixed(1)}s`, {
      fontSize:'16px', fontFamily:'monospace', color:'#ffcc00'
    }).setOrigin(0.5).setDepth(102);

    // ─── NEXT LEVEL button ────────────────────────────────────
    const nextY = H/2 - HALF + 192;
    const nextBtn = this.add.rectangle(W/2, nextY, 190, 42, 0x003322)
      .setStrokeStyle(2, 0x00ffcc)
      .setInteractive({ useHandCursor:true })
      .setDepth(102);
    const nextTxt = this.add.text(W/2, nextY,
      this.currentLevel >= LEVELS.length ? 'FINISH GAME' : 'NEXT LEVEL',
      { fontSize:'17px', fontFamily:'monospace', color:'#00ffcc' }
    ).setOrigin(0.5).setDepth(103);

    // ─── REPLAY button ────────────────────────────────────────
    const btnY2 = H/2 - HALF + 252;
    const replayBtn = this.add.rectangle(W/2 - 105, btnY2, 155, 38, 0x002233)
      .setStrokeStyle(2, 0x00ccff)
      .setInteractive({ useHandCursor:true })
      .setDepth(102);
    const replayTxt = this.add.text(W/2 - 105, btnY2, 'REPLAY', {
      fontSize:'15px', fontFamily:'monospace', color:'#00ccff'
    }).setOrigin(0.5).setDepth(103);

    // ─── PREVIOUS LEVEL button ────────────────────────────────
    let prevBtn, prevTxt;
    if (this.currentLevel > 1) {
      prevBtn = this.add.rectangle(W/2 + 105, btnY2, 155, 38, 0x332200)
        .setStrokeStyle(2, 0xffcc00)
        .setInteractive({ useHandCursor:true })
        .setDepth(102);
      prevTxt = this.add.text(W/2 + 105, btnY2, 'PREVIOUS', {
        fontSize:'15px', fontFamily:'monospace', color:'#ffcc00'
      }).setOrigin(0.5).setDepth(103);
    }

    // ─── Hover effects ────────────────────────────────────────
    nextBtn.on('pointerover', () => { nextBtn.setFillStyle(0x00ffcc); nextTxt.setColor('#001018'); });
    nextBtn.on('pointerout',  () => { nextBtn.setFillStyle(0x003322); nextTxt.setColor('#00ffcc'); });

    replayBtn.on('pointerover', () => { replayBtn.setFillStyle(0x00ccff); replayTxt.setColor('#001018'); });
    replayBtn.on('pointerout',  () => { replayBtn.setFillStyle(0x002233); replayTxt.setColor('#00ccff'); });

    if (prevBtn) {
      prevBtn.on('pointerover', () => { prevBtn.setFillStyle(0xffcc00); prevTxt.setColor('#001018'); });
      prevBtn.on('pointerout',  () => { prevBtn.setFillStyle(0x332200); prevTxt.setColor('#ffcc00'); });
    }

    // ─── Click events ─────────────────────────────────────────
    nextBtn.on('pointerdown', () => {
      if (this.currentLevel >= LEVELS.length) {
        this.scene.start('GameOverScene', { victory:true });
      } else {
        this.scene.restart({ level: this.currentLevel + 1 });
      }
    });

    replayBtn.on('pointerdown', () => {
      this.scene.restart({ level: this.currentLevel });
    });

    if (prevBtn) {
      prevBtn.on('pointerdown', () => {
        this.scene.restart({ level: this.currentLevel - 1 });
      });
    }
  }

  onHitRobot(player) {
    if (this.isGameOver) return;
    this.sound.play('explode', { volume: 0.38 });
    this.isGameOver = true;
    this.cameras.main.shake(380, 0.018);
    this.cameras.main.flash(280, 255,0,0, true);
    player.setVisible(false).setVelocity(0,0);
    this.spawnDeathFx(player.x, player.y);
    this.time.delayedCall(750, () => {
      this.cameras.main.fadeOut(500, 0,0,0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOverScene', { victory:false, level:this.currentLevel });
      });
    });
  }

  spawnDeathFx(x, y) {
    const cols = [0xff2200,0xff8800,0xffcc00,0xff4400];
    for (let i=0; i<10; i++) {
      const p = this.add.rectangle(x, y, 5, 5, Phaser.Utils.Array.GetRandom(cols));
      const a = (i/10)*Math.PI*2;
      this.tweens.add({
        targets:p, x:x+Math.cos(a)*45, y:y+Math.sin(a)*45,
        alpha:0, scaleX:0, scaleY:0, duration:580,
        ease:'Cubic.easeOut', onComplete:()=>p.destroy()
      });
    }
  }

  restartLevel() {
    this.cameras.main.fadeOut(280, 0,13,26);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.restart({ level:this.currentLevel }));
  }

  goMenu() {
    this.cameras.main.fadeOut(350, 0,13,26);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      const W=this.scale.width, H=this.scale.height;
      this.pauseOverlay = this.add.container(0,0).setDepth(50);
      const items = [
        this.add.rectangle(W/2,H/2,W,H,0x000d1a,0.82),
        this.add.text(W/2,H/2-45,'PAUSED',{fontSize:'42px',fontFamily:'monospace',color:'#00ffcc'}).setOrigin(0.5),
        this.add.text(W/2,H/2+10,'Press ESC to resume',{fontSize:'16px',fontFamily:'monospace',color:'#006688'}).setOrigin(0.5),
        this.add.text(W/2,H/2+45,'[ R ] Restart level',{fontSize:'14px',fontFamily:'monospace',color:'#004455'}).setOrigin(0.5),
      ];
      this.pauseOverlay.add(items);
      this.robotGroup.getChildren().forEach(r => r.body.enable = false);
      this.player.body.enable = false;
    } else {
      if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
      this.robotGroup.getChildren().forEach(r => r.body.enable = true);
      this.player.body.enable = true;
    }
  }
}