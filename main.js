const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000d1a',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity:{ y:0 }, debug:false }
  },
  scene: [MenuScene, GameScene, GameOverScene]
};

window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  setTimeout(() => {
    const el = document.getElementById('loading');
    if (el) { el.style.opacity='0'; setTimeout(()=>el.remove(), 600); }
  }, 1400);
});