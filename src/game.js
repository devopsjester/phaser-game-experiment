// =============================================================
// PAC-DASH  –  A Pac-Man style endless dodge game
// Built with Phaser 3
// =============================================================
'use strict';

// ---- global constants ----
const GAME_W = 480;
const GAME_H = 640;
const PLAYER_Y = GAME_H - 90;

const GHOST_SPEED_BASE = 180;
const GHOST_SPEED_MAX  = 420;
const FRUIT_SPEED      = 160;

const POWER_DURATION     = 10000; // 10 s
const POWER_WARNING_TIME =  3000; // last 3 s – flash
const INVINCIBLE_DURATION =  2000;

const MAX_LIVES = 3;

const WAFER_POINTS     =  10;
const GHOST_EAT_POINTS = 200;
const FRUIT_POINTS     = 100;

const SPAWN_INTERVAL_BASE     = 1400; // ms between ghost spawns
const SPAWN_INTERVAL_MIN      =  500;
const DIFFICULTY_RAMP_INTERVAL = 8000;


// =============================================================
// SCENE: BOOT  –  creates every texture programmatically
// =============================================================
class BootScene extends Phaser.Scene {
  constructor () { super({ key: 'Boot' }); }

  create () {
    const g = this.make.graphics({ add: false });

    // ---- Pac-Man open (yellow wedge) ----
    this._pacman(g, 0xFFFF00, true);
    g.generateTexture('pacman_open', 48, 48);

    // ---- Pac-Man closed (full circle) ----
    g.clear();
    g.fillStyle(0xFFFF00);
    g.fillCircle(24, 24, 21);
    g.generateTexture('pacman_closed', 48, 48);

    // ---- Pac-Man powered (white with yellow aura) ----
    this._pacman(g, 0xFFFFFF, true);
    g.lineStyle(3, 0xFFFF00, 0.85);
    g.strokeCircle(24, 24, 24);
    g.generateTexture('pacman_power', 48, 48);

    // ---- Four classic ghost colours ----
    const GHOST_COLORS = {
      ghost_red:    0xFF0000,
      ghost_pink:   0xFFB8FF,
      ghost_cyan:   0x00FFFF,
      ghost_orange: 0xFFB852,
    };
    Object.entries(GHOST_COLORS).forEach(([key, col]) => {
      this._ghost(g, col);
      g.generateTexture(key, 48, 48);
    });

    // ---- Scared ghost (blue) ----
    this._scaredGhost(g, 0x0000DD, false);
    g.generateTexture('ghost_scared', 48, 48);

    // ---- Scared ghost flashing variant (light, red eyes) ----
    this._scaredGhost(g, 0xAAAAAA, true);
    g.generateTexture('ghost_scared_flash', 48, 48);

    // ---- Wafer (pac-dot pellet) ----
    g.clear();
    g.fillStyle(0xFFDEAD);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xFFFFFF, 0.55);
    g.fillCircle(5, 5, 3);
    g.generateTexture('wafer', 16, 16);

    // ---- Fruit (cherry) ----
    this._cherry(g);
    g.generateTexture('fruit', 36, 34);

    // ---- Life icon (tiny pac-man) ----
    g.clear();
    g.fillStyle(0xFFFF00);
    g.beginPath();
    g.moveTo(12, 12);
    g.arc(12, 12, 10, Phaser.Math.DegToRad(40), Phaser.Math.DegToRad(320));
    g.closePath();
    g.fillPath();
    g.generateTexture('life_icon', 24, 24);

    // ---- Background speed-line dot ----
    g.clear();
    g.fillStyle(0x0000AA, 0.45);
    g.fillRect(0, 0, 2, 14);
    g.generateTexture('speed_dot', 2, 14);

    g.destroy();
    this.scene.start('Menu');
  }

  // helpers
  _pacman (g, color, open) {
    g.clear();
    g.fillStyle(color);
    if (open) {
      g.beginPath();
      g.moveTo(24, 24);
      g.arc(24, 24, 21, Phaser.Math.DegToRad(30), Phaser.Math.DegToRad(330));
      g.closePath();
      g.fillPath();
    } else {
      g.fillCircle(24, 24, 21);
    }
  }

  _ghost (g, color) {
    g.clear();
    // Head / body
    g.fillStyle(color);
    g.fillCircle(24, 18, 18);
    g.fillRect(6, 18, 36, 22);
    // Three rectangular legs (gaps = black bg shows through)
    g.fillRect(6,  40, 10, 6);
    g.fillRect(20, 40, 10, 6);
    g.fillRect(34, 40, 10, 6);
    // White eyes
    g.fillStyle(0xFFFFFF);
    g.fillCircle(16, 15, 7);
    g.fillCircle(32, 15, 7);
    // Blue pupils
    g.fillStyle(0x0000CC);
    g.fillCircle(17, 16, 4);
    g.fillCircle(33, 16, 4);
  }

  _scaredGhost (g, bodyColor, isFlashing) {
    g.clear();
    g.fillStyle(bodyColor);
    g.fillCircle(24, 18, 18);
    g.fillRect(6, 18, 36, 22);
    g.fillRect(6,  40, 10, 6);
    g.fillRect(20, 40, 10, 6);
    g.fillRect(34, 40, 10, 6);
    // Scared eyes (white dots)
    g.fillStyle(0xFFFFFF);
    g.fillCircle(14, 14, 5);
    g.fillCircle(34, 14, 5);
    // Zigzag mouth
    const mColor = isFlashing ? 0xFF2200 : 0xFFFFFF;
    g.fillStyle(mColor);
    g.fillTriangle( 8, 31, 12, 26, 16, 31);
    g.fillTriangle(16, 31, 20, 26, 24, 31);
    g.fillTriangle(24, 31, 28, 26, 32, 31);
    g.fillTriangle(32, 31, 36, 26, 40, 31);
  }

  _cherry (g) {
    g.clear();
    // Stems
    g.lineStyle(2, 0x005500);
    g.beginPath(); g.moveTo(14, 14); g.lineTo(18, 5); g.strokePath();
    g.beginPath(); g.moveTo(22, 14); g.lineTo(18, 5); g.strokePath();
    // Leaf
    g.fillStyle(0x00AA00);
    g.fillEllipse(18, 4, 12, 7);
    // Cherries
    g.fillStyle(0xCC0000);
    g.fillCircle(12, 22, 10);
    g.fillCircle(24, 22, 10);
    // Highlights
    g.fillStyle(0xFF5555, 0.75);
    g.fillCircle(8, 18, 4);
    g.fillCircle(20, 18, 4);
  }
}


// =============================================================
// SCENE: MENU
// =============================================================
class MenuScene extends Phaser.Scene {
  constructor () { super({ key: 'Menu' }); }

  create () {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);
    // CRT scanlines
    for (let y = 0; y < H; y += 4)
      this.add.rectangle(0, y, W, 2, 0x000033, 0.12).setOrigin(0);

    // Blue border (double)
    const bdr = this.add.graphics();
    bdr.lineStyle(5, 0x0000FF, 0.8); bdr.strokeRect(7, 7, W - 14, H - 14);
    bdr.lineStyle(2, 0x4444FF, 0.4); bdr.strokeRect(13, 13, W - 26, H - 26);

    // Title shadow + title
    this.add.text(W / 2 + 3, 83, 'PAC-DASH', {
      fontSize: '34px', fontFamily: '"Press Start 2P", monospace', color: '#AA6600',
    }).setOrigin(0.5);
    this.add.text(W / 2, 80, 'PAC-DASH', {
      fontSize: '34px', fontFamily: '"Press Start 2P", monospace', color: '#FFFF00',
    }).setOrigin(0.5);

    // Animated pac-man crossing the screen
    const pac = this.add.image(50, 152, 'pacman_open');
    this.tweens.add({
      targets: pac, x: W - 50, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });
    this.time.addEvent({
      delay: 200,
      callback: () => pac.setTexture(pac.texture.key === 'pacman_open' ? 'pacman_closed' : 'pacman_open'),
      loop: true,
    });

    // Ghost row (bobbing)
    ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'].forEach((k, i) => {
      const gh = this.add.image(70 + i * 115, 200, k);
      this.tweens.add({
        targets: gh, y: 212, duration: 550 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    });

    // Hi-score
    const hi = this.registry.get('hiScore') || 0;
    this.add.text(W / 2, 252, `HI-SCORE  ${String(hi).padStart(6, '0')}`, {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#FF69B4',
    }).setOrigin(0.5);

    // Instructions
    const lines = [
      { t: 'MOVE MOUSE TO DODGE',         c: '#FFFFFF' },
      { t: 'WAFERS    +10 PTS EACH',       c: '#FFDEAD' },
      { t: 'GRAB FRUIT FOR POWER-UP',      c: '#FF69B4' },
      { t: 'EAT GHOSTS  +200 PTS EACH',    c: '#00FFFF' },
      { t: '3 LIVES   GOOD LUCK!',         c: '#FFFF00' },
    ];
    lines.forEach((l, i) =>
      this.add.text(W / 2, 308 + i * 33, l.t, {
        fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: l.c,
      }).setOrigin(0.5)
    );

    // INSERT COIN
    const coin = this.add.text(W / 2, H - 88, '** INSERT COIN **', {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#FFFF00',
    }).setOrigin(0.5);
    this.tweens.add({ targets: coin, alpha: 0, duration: 620, yoyo: true, repeat: -1 });

    // Click to start
    const start = this.add.text(W / 2, H - 52, 'CLICK TO START', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.15, duration: 420, yoyo: true, repeat: -1 });

    this.input.once('pointerdown', () => this.scene.start('Game'));
  }
}


// =============================================================
// SCENE: GAME  –  main gameplay
// =============================================================
class GameScene extends Phaser.Scene {
  constructor () { super({ key: 'Game' }); }

  init () {
    this.score          = 0;
    this.lives          = MAX_LIVES;
    this.powered        = false;
    this.powerTimeLeft  = 0;
    this.invincible     = false;
    this.gameActive     = true;
    this.ghostSpeed     = GHOST_SPEED_BASE;
    this.spawnInterval  = SPAWN_INTERVAL_BASE;
    this.elapsed        = 0;
    this.mouthOpen      = true;
    this.mouthTimer     = 0;
  }

  create () {
    const W = this.scale.width;
    const H = this.scale.height;

    // ---- background ----
    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);
    for (let y = 0; y < H; y += 4)
      this.add.rectangle(0, y, W, 2, 0x000033, 0.10).setOrigin(0);

    // Scrolling speed-line dots
    this._bgDots = [];
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row < 8; row++) {
        const x = 38 + col * Math.round((W - 76) / 5);
        const y = row * 92;
        const dot = this.add.image(x, y, 'speed_dot').setAlpha(0.35);
        this._bgDots.push(dot);
      }
    }

    // Maze border
    this._borderGfx = this.add.graphics();
    this._drawBorder();

    // ---- physics groups ----
    this.ghosts = this.physics.add.group();
    this.wafers = this.physics.add.group();
    this.fruits = this.physics.add.group();

    // ---- player ----
    this.player = this.physics.add.sprite(W / 2, PLAYER_Y, 'pacman_open');
    this.player.body.setAllowGravity(false);
    this.player.setDepth(10);

    // ---- HUD ----
    this._createHUD();

    // ---- power bar (initially hidden) ----
    const bY = 50;
    this._pBarBg  = this.add.graphics().setDepth(20).setVisible(false);
    this._pBarFg  = this.add.graphics().setDepth(21).setVisible(false);
    this._pLabel  = this.add.text(W / 2, bY - 13, 'POWER-UP!', {
      fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color: '#00FF00',
    }).setOrigin(0.5).setDepth(22).setVisible(false);

    // ---- overlaps ----
    this.physics.add.overlap(this.player, this.ghosts, this._hitGhost, null, this);
    this.physics.add.overlap(this.player, this.wafers, this._hitWafer,  null, this);
    this.physics.add.overlap(this.player, this.fruits, this._hitFruit,  null, this);

    // ---- spawn timers ----
    this._ghostTimer = this.time.addEvent({
      delay: this.spawnInterval, callback: this._spawnGhost, callbackScope: this, loop: true,
    });
    this._waferTimer = this.time.addEvent({
      delay: 700, callback: this._spawnWafers, callbackScope: this, loop: true,
    });
    this._fruitTimer = this.time.addEvent({
      delay: 18000, callback: this._spawnFruit, callbackScope: this, loop: true, startAt: 15000,
    });
    this._diffTimer = this.time.addEvent({
      delay: DIFFICULTY_RAMP_INTERVAL, callback: this._rampDifficulty, callbackScope: this, loop: true,
    });

    // Passive score (+5 per second)
    this.time.addEvent({
      delay: 1000,
      callback: () => { if (this.gameActive) { this.score += 5; this._updateHUD(); } },
      loop: true,
    });

    // ---- mouse / touch tracking ----
    this.input.on('pointermove', (ptr) => {
      if (this.gameActive)
        this.player.x = Phaser.Math.Clamp(ptr.x, 30, W - 30);
    });
  }

  // ---- border drawing ----
  _drawBorder () {
    const W = this.scale.width;
    const H = this.scale.height;
    this._borderGfx.clear();
    this._borderGfx.lineStyle(6, 0x0000FF, 0.25);
    this._borderGfx.strokeRect(4, 35, W - 8, H - 39);
    this._borderGfx.lineStyle(3, 0x0000FF, 0.90);
    this._borderGfx.strokeRect(8, 39, W - 16, H - 47);
    this._borderGfx.fillStyle(0x4444FF);
    [[8, 39], [W - 8, 39], [8, H - 8], [W - 8, H - 8]].forEach(
      ([x, y]) => this._borderGfx.fillCircle(x, y, 5)
    );
  }

  // ---- HUD ----
  _createHUD () {
    const W = this.scale.width;
    this.add.rectangle(0, 0, W, 36, 0x000000).setOrigin(0).setDepth(15);
    this.add.graphics().setDepth(16)
      .lineStyle(1, 0x333333)
      .lineBetween(0, 36, W, 36);

    this._scoreTxt = this.add.text(10, 10, 'SCORE 000000', {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setDepth(17);

    this._hiTxt = this.add.text(W / 2, 10, 'BEST  000000', {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#FFD700',
    }).setOrigin(0.5, 0).setDepth(17);

    this._lifeBox = this.add.container(W - 10, 10).setDepth(17);
    this._lifeIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const icon = this.add.image(-(i * 26), 8, 'life_icon');
      this._lifeBox.add(icon);
      this._lifeIcons.push(icon);
    }
    this._updateHUD();
  }

  _updateHUD () {
    const hi = Math.max(this.score, this.registry.get('hiScore') || 0);
    this._scoreTxt.setText('SCORE ' + String(this.score).padStart(6, '0'));
    this._hiTxt   .setText('BEST  ' + String(hi).padStart(6, '0'));
    this._lifeIcons.forEach((ic, i) => ic.setAlpha(i < this.lives ? 1 : 0.15));
  }

  // ---- spawners ----
  _spawnGhost () {
    if (!this.gameActive) return;
    const W = this.scale.width;
    const x = Phaser.Math.Between(40, W - 40);
    const types = ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'];
    const type  = Phaser.Utils.Array.GetRandom(types);
    const ghost = this.ghosts.create(x, -28, this.powered ? 'ghost_scared' : type);
    ghost.ghostType = type;
    ghost.body.setAllowGravity(false);
    ghost.setVelocityY(this.ghostSpeed);
    ghost.setDepth(5);
  }

  _spawnWafers () {
    if (!this.gameActive) return;
    const W     = this.scale.width;
    const count = Phaser.Math.Between(3, 6);
    const cx    = Phaser.Math.Between(50, W - 50);
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Clamp(cx + (i - Math.floor(count / 2)) * 28, 28, W - 28);
      const w = this.wafers.create(x, -8, 'wafer');
      w.body.setAllowGravity(false);
      w.setVelocityY(this.ghostSpeed * 0.75);
      w.setDepth(4);
    }
  }

  _spawnFruit () {
    if (!this.gameActive) return;
    const W = this.scale.width;
    const x = Phaser.Math.Between(50, W - 50);
    const f = this.fruits.create(x, -22, 'fruit');
    f.body.setAllowGravity(false);
    f.setVelocityY(FRUIT_SPEED);
    f.setDepth(6);
    this.tweens.add({
      targets: f, scaleX: 1.18, scaleY: 1.18, duration: 380, yoyo: true, repeat: -1,
    });
  }

  // ---- collision handlers ----
  _hitGhost (player, ghost) {
    if (!ghost.active || !player.active) return;
    if (this.powered) {
      ghost.setActive(false).setVisible(false);
      this.score += GHOST_EAT_POINTS;
      this._updateHUD();
      this._float(ghost.x, ghost.y, `+${GHOST_EAT_POINTS}`, '#00FF00');
      ghost.destroy();
      this.cameras.main.shake(80, 0.01);
    } else if (!this.invincible) {
      this.lives = Math.max(0, this.lives - 1);
      this._updateHUD();
      this.cameras.main.shake(220, 0.025);
      this.cameras.main.flash(220, 255, 0, 0, false);
      if (this.lives <= 0) {
        this._gameOver();
      } else {
        this._startInvincible();
      }
    }
  }

  _hitWafer (player, wafer) {
    if (!wafer.active) return;
    wafer.setActive(false).setVisible(false);
    this.score += WAFER_POINTS;
    this._updateHUD();
    this._float(wafer.x, wafer.y, `+${WAFER_POINTS}`, '#FFDEAD');
    wafer.destroy();
  }

  _hitFruit (player, fruit) {
    if (!fruit.active) return;
    fruit.setActive(false).setVisible(false);
    this.score += FRUIT_POINTS;
    this._updateHUD();
    this._float(fruit.x, fruit.y, 'POWER UP!', '#FF69B4');
    fruit.destroy();
    this._activatePower();
  }

  // ---- power-up ----
  _activatePower () {
    this.powered       = true;
    this.powerTimeLeft = POWER_DURATION;
    this.ghosts.getChildren().forEach(g => { if (g.active) g.setTexture('ghost_scared'); });
    this._pBarBg .setVisible(true);
    this._pBarFg .setVisible(true);
    this._pLabel .setVisible(true);
  }

  _deactivatePower () {
    this.powered = false;
    this.ghosts.getChildren().forEach(g => {
      if (g.active) g.setTexture(g.ghostType || 'ghost_red');
    });
    this._pBarBg.setVisible(false);
    this._pBarFg.setVisible(false);
    this._pLabel.setVisible(false);
  }

  _drawPowerBar () {
    const W    = this.scale.width;
    const bW   = 280;
    const bH   = 10;
    const bX   = (W - bW) / 2;
    const bY   = 47;
    const ratio = Phaser.Math.Clamp(this.powerTimeLeft / POWER_DURATION, 0, 1);
    const warn  = this.powerTimeLeft < POWER_WARNING_TIME;
    const col   = warn ? 0xFF4400 : 0x00EE00;

    this._pBarBg.clear();
    this._pBarBg.fillStyle(0x333333);
    this._pBarBg.fillRect(bX, bY, bW, bH);

    this._pBarFg.clear();
    this._pBarFg.fillStyle(col);
    this._pBarFg.fillRect(bX, bY, Math.round(bW * ratio), bH);

    this._pLabel.setColor(warn ? '#FF4400' : '#00FF00');
  }

  // ---- invincibility (after taking damage) ----
  _startInvincible () {
    this.invincible = true;
    this.tweens.add({
      targets: this.player, alpha: 0.2, duration: 140, yoyo: true, repeat: 7,
      onComplete: () => { this.player.setAlpha(1); this.invincible = false; },
    });
  }

  // ---- difficulty ramp ----
  _rampDifficulty () {
    if (!this.gameActive) return;
    this.ghostSpeed    = Math.min(this.ghostSpeed + 25, GHOST_SPEED_MAX);
    this.spawnInterval = Math.max(this.spawnInterval - 120, SPAWN_INTERVAL_MIN);
    this._ghostTimer.reset({
      delay: this.spawnInterval, callback: this._spawnGhost, callbackScope: this, loop: true,
    });
  }

  // ---- floating score text ----
  _float (x, y, msg, color) {
    const t = this.add.text(x, y, msg, {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace',
      color, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: t, y: y - 55, alpha: 0, duration: 900, ease: 'Cubic.Out',
      onComplete: () => t.destroy(),
    });
  }

  // ---- game over ----
  _gameOver () {
    this.gameActive = false;
    [this._ghostTimer, this._waferTimer, this._fruitTimer, this._diffTimer]
      .forEach(ev => ev.remove(false));

    const hi = this.registry.get('hiScore') || 0;
    if (this.score > hi) this.registry.set('hiScore', this.score);

    // Death shrink animation
    this.player.setTexture('pacman_closed');
    this.tweens.add({
      targets: this.player, scaleX: 0, scaleY: 0, duration: 700, ease: 'Back.In',
      onComplete: () =>
        this.time.delayedCall(500, () =>
          this.scene.start('GameOver', { score: this.score })
        ),
    });
  }

  // ---- update loop ----
  update (_time, delta) {
    if (!this.gameActive) return;

    this.elapsed += delta;

    // Pac-Man mouth animation
    this.mouthTimer += delta;
    if (this.mouthTimer > 180) {
      this.mouthTimer = 0;
      this.mouthOpen  = !this.mouthOpen;
      if (!this.powered)
        this.player.setTexture(this.mouthOpen ? 'pacman_open' : 'pacman_closed');
      else
        this.player.setTexture('pacman_power');
    }

    // Power-up countdown
    if (this.powered) {
      this.powerTimeLeft -= delta;
      this._drawPowerBar();

      if (this.powerTimeLeft < POWER_WARNING_TIME) {
        const flash = Math.floor(this.elapsed / 200) % 2 === 0;
        this.ghosts.getChildren().forEach(g => {
          if (g.active) g.setTexture(flash ? 'ghost_scared' : 'ghost_scared_flash');
        });
      }

      if (this.powerTimeLeft <= 0) this._deactivatePower();
    }

    // Scroll background dots (speed lines)
    const dotSpeed = this.ghostSpeed * 0.45 * (delta / 1000);
    const H = this.scale.height;
    this._bgDots.forEach(dot => {
      dot.y += dotSpeed;
      if (dot.y > H + 14) dot.y = -14;
    });

    // Ghost horizontal sine-wave wobble
    this.ghosts.getChildren().forEach((g, i) => {
      if (g.active)
        g.x += Math.sin(this.elapsed * 0.002 + i * 1.3) * 0.65;
    });

    // Remove off-screen objects
    [this.ghosts, this.wafers, this.fruits].forEach(grp => {
      grp.getChildren().slice().forEach(obj => {
        if (obj.active && obj.y > H + 50) obj.destroy();
      });
    });
  }
}


// =============================================================
// SCENE: GAME OVER
// =============================================================
class GameOverScene extends Phaser.Scene {
  constructor () { super({ key: 'GameOver' }); }

  init (data) { this.finalScore = data.score || 0; }

  create () {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);
    for (let y = 0; y < H; y += 4)
      this.add.rectangle(0, y, W, 2, 0x110000, 0.25).setOrigin(0);

    // Red border
    const bdr = this.add.graphics();
    bdr.lineStyle(6, 0xFF0000, 0.45); bdr.strokeRect(4, 4, W - 8, H - 8);
    bdr.lineStyle(3, 0xFF0000, 0.90); bdr.strokeRect(10, 10, W - 20, H - 20);

    // GAME OVER text (shadow + main)
    this.add.text(W / 2 + 3, 123, 'GAME  OVER', {
      fontSize: '30px', fontFamily: '"Press Start 2P", monospace', color: '#880000',
    }).setOrigin(0.5);
    const goTxt = this.add.text(W / 2, 120, 'GAME  OVER', {
      fontSize: '30px', fontFamily: '"Press Start 2P", monospace', color: '#FF0000',
    }).setOrigin(0.5);
    this.tweens.add({ targets: goTxt, alpha: 0.25, duration: 360, yoyo: true, repeat: -1 });

    // Score
    this.add.text(W / 2, 210, 'SCORE', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#AAAAAA',
    }).setOrigin(0.5);
    this.add.text(W / 2, 240, String(this.finalScore).padStart(6, '0'), {
      fontSize: '26px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setOrigin(0.5);

    // Hi-score
    const hi = this.registry.get('hiScore') || 0;
    this.add.text(W / 2, 292, 'BEST', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#AAAAAA',
    }).setOrigin(0.5);
    this.add.text(W / 2, 320, String(hi).padStart(6, '0'), {
      fontSize: '22px', fontFamily: '"Press Start 2P", monospace', color: '#FFD700',
    }).setOrigin(0.5);

    // New record?
    if (this.finalScore > 0 && this.finalScore >= hi) {
      const nr = this.add.text(W / 2, 360, '*** NEW RECORD! ***', {
        fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#FF69B4',
      }).setOrigin(0.5);
      this.tweens.add({ targets: nr, scaleX: 1.12, scaleY: 1.12, duration: 260, yoyo: true, repeat: -1 });
    }

    // Ghost parade (marching across)
    ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'].forEach((k, i) => {
      const gh = this.add.image(-30, H - 58, k);
      this.tweens.add({
        targets: gh, x: W + 30,
        duration: 2800 + i * 350,
        delay: i * 550,
        repeat: -1,
        onRepeat: () => { gh.x = -30; gh.y = H - 58 + Phaser.Math.Between(-8, 8); },
      });
    });

    // Click to continue
    const cont = this.add.text(W / 2, H - 95, 'CLICK TO CONTINUE', {
      fontSize: '13px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setOrigin(0.5);
    this.tweens.add({ targets: cont, alpha: 0.1, duration: 450, yoyo: true, repeat: -1 });

    this.add.text(W / 2, H - 55, '1 PLAYER', {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => this.scene.start('Menu'));
  }
}


// =============================================================
// PHASER GAME CONFIGURATION
// =============================================================
const config = {
  type: Phaser.AUTO,
  width:  GAME_W,
  height: GAME_H,
  backgroundColor: '#000000',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
};

window.addEventListener('load', () => { new Phaser.Game(config); });
