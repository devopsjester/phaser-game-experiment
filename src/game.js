// =============================================================
// PAC-DASH  –  Pac-Man Subway-Surfers style dodge game
// POV: third-person behind, environment rushes toward player
// Built with Phaser 3
// =============================================================
'use strict';

// ---- canvas dimensions ----
const GAME_W = 480;
const GAME_H = 640;

// ---- perspective constants ----
const VP_X    = GAME_W / 2;   // vanishing point X (centre)
const VP_Y    = 158;           // horizon Y
const PLAYER_Y = GAME_H - 95; // player's fixed Y on screen

// Road edges at player level (bottom of screen)
const ROAD_L = GAME_W * 0.03;
const ROAD_R = GAME_W * 0.97;

// Lane centres at player level  (3 lanes)
const LANE_X = [
  ROAD_L + (ROAD_R - ROAD_L) / 6,       // left
  ROAD_L + (ROAD_R - ROAD_L) / 2,       // centre
  ROAD_L + (ROAD_R - ROAD_L) * 5 / 6,  // right
];

// ---- depth system ----
// depth 0 = at horizon (tiny), depth 1 = at player plane (full size)
const DEPTH_SPEED_BASE = 0.40; // depth units per second
const DEPTH_SPEED_MAX  = 0.92;
const COLLISION_DEPTH  = 0.88; // depth at which collision fires
const COLLISION_TOL    = 58;   // pixel X tolerance for a hit

// ---- gameplay constants ----
const POWER_DURATION      = 10000; // ms
const POWER_WARNING_TIME  =  3000;
const MAX_LIVES           = 3;
const WAFER_POINTS        = 10;
const GHOST_EAT_POINTS    = 200;
const FRUIT_POINTS        = 100;
const SPAWN_INTERVAL_BASE = 1400; // ms between ghost spawns
const SPAWN_INTERVAL_MIN  =  500;
const DIFFICULTY_INTERVAL =  8000;

// ---- perspective helper ----
function perspPos (laneX, depth) {
  return {
    x     : VP_X + (laneX - VP_X) * depth,
    y     : VP_Y + (PLAYER_Y - VP_Y) * depth,
    scale : 0.12 + 0.88 * depth,
  };
}

// =============================================================
// SCENE: BOOT  --  creates every texture programmatically
// =============================================================
class BootScene extends Phaser.Scene {
  constructor () { super({ key: 'Boot' }); }

  create () {
    const g = this.make.graphics({ add: false });

    // Pac-Man front-facing (for menu animations)
    this._pacFront(g, 0xFFFF00, true);
    g.generateTexture('pacman_open', 48, 48);
    g.clear();
    g.fillStyle(0xFFFF00);
    g.fillCircle(24, 24, 21);
    g.generateTexture('pacman_closed', 48, 48);

    // Pac-Man back view (gameplay -- we see his back)
    g.clear();
    g.fillStyle(0xFFFF00);
    g.fillCircle(24, 24, 22);
    g.fillStyle(0xBB8800, 0.30);
    g.fillCircle(24, 21, 11);
    g.generateTexture('pacman_back', 48, 48);

    // Pac-Man back powered (white + yellow aura)
    g.clear();
    g.fillStyle(0xFFFFFF);
    g.fillCircle(24, 24, 22);
    g.lineStyle(3, 0xFFFF00, 0.90);
    g.strokeCircle(24, 24, 25);
    g.generateTexture('pacman_back_power', 48, 48);

    // Four classic ghost colours
    const GHOST_PALETTE = {
      ghost_red:    0xFF0000,
      ghost_pink:   0xFFB8FF,
      ghost_cyan:   0x00FFFF,
      ghost_orange: 0xFFB852,
    };
    Object.entries(GHOST_PALETTE).forEach(([k, c]) => {
      this._ghost(g, c);
      g.generateTexture(k, 48, 48);
    });

    // Scared ghost (blue)
    this._scaredGhost(g, 0x0000DD, false);
    g.generateTexture('ghost_scared', 48, 48);

    // Scared ghost -- flashing variant
    this._scaredGhost(g, 0xAAAAAA, true);
    g.generateTexture('ghost_scared_flash', 48, 48);

    // Wafer (pac-dot pellet)
    g.clear();
    g.fillStyle(0xFFDEAD);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xFFFFFF, 0.55);
    g.fillCircle(5, 5, 3);
    g.generateTexture('wafer', 16, 16);

    // Fruit (cherry)
    this._cherry(g);
    g.generateTexture('fruit', 36, 34);

    // Life icon (small Pac-Man wedge)
    g.clear();
    g.fillStyle(0xFFFF00);
    g.beginPath();
    g.moveTo(12, 12);
    g.arc(12, 12, 10, Phaser.Math.DegToRad(40), Phaser.Math.DegToRad(320));
    g.closePath();
    g.fillPath();
    g.generateTexture('life_icon', 24, 24);

    g.destroy();
    this.scene.start('Menu');
  }

  _pacFront (g, color, open) {
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
    g.fillStyle(color);
    g.fillCircle(24, 18, 18);
    g.fillRect(6, 18, 36, 22);
    // Three rectangular legs (gaps appear black against the dark background)
    g.fillRect(6,  40, 10, 6);
    g.fillRect(20, 40, 10, 6);
    g.fillRect(34, 40, 10, 6);
    g.fillStyle(0xFFFFFF);
    g.fillCircle(16, 15, 7);
    g.fillCircle(32, 15, 7);
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
    g.fillStyle(0xFFFFFF);
    g.fillCircle(14, 14, 5);
    g.fillCircle(34, 14, 5);
    g.fillStyle(isFlashing ? 0xFF2200 : 0xFFFFFF);
    g.fillTriangle( 8, 31, 12, 26, 16, 31);
    g.fillTriangle(16, 31, 20, 26, 24, 31);
    g.fillTriangle(24, 31, 28, 26, 32, 31);
    g.fillTriangle(32, 31, 36, 26, 40, 31);
  }

  _cherry (g) {
    g.clear();
    g.lineStyle(2, 0x005500);
    g.beginPath(); g.moveTo(14, 14); g.lineTo(18, 5); g.strokePath();
    g.beginPath(); g.moveTo(22, 14); g.lineTo(18, 5); g.strokePath();
    g.fillStyle(0x00AA00);
    g.fillEllipse(18, 4, 12, 7);
    g.fillStyle(0xCC0000);
    g.fillCircle(12, 22, 10);
    g.fillCircle(24, 22, 10);
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

    this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0);
    for (let y = 0; y < H; y += 4)
      this.add.rectangle(0, y, W, 2, 0x000033, 0.12).setOrigin(0);

    const bdr = this.add.graphics();
    bdr.lineStyle(5, 0x0000FF, 0.80); bdr.strokeRect(7, 7, W - 14, H - 14);
    bdr.lineStyle(2, 0x4444FF, 0.40); bdr.strokeRect(13, 13, W - 26, H - 26);

    this.add.text(W / 2 + 3, 83, 'PAC-DASH', {
      fontSize: '34px', fontFamily: '"Press Start 2P", monospace', color: '#AA6600',
    }).setOrigin(0.5);
    this.add.text(W / 2, 80, 'PAC-DASH', {
      fontSize: '34px', fontFamily: '"Press Start 2P", monospace', color: '#FFFF00',
    }).setOrigin(0.5);

    const pac = this.add.image(50, 152, 'pacman_open');
    this.tweens.add({ targets: pac, x: W - 50, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.time.addEvent({
      delay: 200,
      callback: () => pac.setTexture(pac.texture.key === 'pacman_open' ? 'pacman_closed' : 'pacman_open'),
      loop: true,
    });

    ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'].forEach((k, i) => {
      const gh = this.add.image(70 + i * 115, 200, k);
      this.tweens.add({ targets: gh, y: 213, duration: 550 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });

    const hi = this.registry.get('hiScore') || 0;
    this.add.text(W / 2, 252, 'HI-SCORE  ' + String(hi).padStart(6, '0'), {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#FF69B4',
    }).setOrigin(0.5);

    const lines = [
      { t: 'MOVE MOUSE SIDEWAYS',      c: '#FFFFFF' },
      { t: 'WAFERS     +10 PTS',        c: '#FFDEAD' },
      { t: 'GRAB FRUIT FOR POWER-UP',   c: '#FF69B4' },
      { t: 'EAT GHOSTS  +200 PTS',      c: '#00FFFF' },
      { t: '3 LIVES    GOOD LUCK!',     c: '#FFFF00' },
    ];
    lines.forEach((l, i) =>
      this.add.text(W / 2, 306 + i * 33, l.t, {
        fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: l.c,
      }).setOrigin(0.5)
    );

    const coin = this.add.text(W / 2, H - 88, '** INSERT COIN **', {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#FFFF00',
    }).setOrigin(0.5);
    this.tweens.add({ targets: coin, alpha: 0, duration: 620, yoyo: true, repeat: -1 });

    const start = this.add.text(W / 2, H - 52, 'CLICK TO START', {
      fontSize: '14px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.15, duration: 420, yoyo: true, repeat: -1 });

    this.input.once('pointerdown', () => this.scene.start('Game'));
  }
}


// =============================================================
// SCENE: GAME  --  main gameplay
// =============================================================
class GameScene extends Phaser.Scene {
  constructor () { super({ key: 'Game' }); }

  init () {
    this.score         = 0;
    this.lives         = MAX_LIVES;
    this.powered       = false;
    this.powerTimeLeft = 0;
    this.invincible    = false;
    this.gameActive    = true;
    this.depthSpeed    = DEPTH_SPEED_BASE;
    this.spawnInterval = SPAWN_INTERVAL_BASE;
    this.elapsed       = 0;
    this.gridPhase     = 0;
    this._objects      = [];
  }

  create () {
    const W = this.scale.width;
    const H = this.scale.height;

    // Static background (road + sky)
    this._bgGfx = this.add.graphics().setDepth(-50);
    this._drawStaticBg();

    // Animated grid (redrawn every frame)
    this._gridGfx = this.add.graphics().setDepth(-40);

    // Player: Pac-Man viewed from behind
    this.player = this.add.image(W / 2, PLAYER_Y, 'pacman_back');
    this.player.setDepth(100).setScale(1.45);

    this._createHUD();

    // Power-up bar (hidden until activated)
    this._pBarBg = this.add.graphics().setDepth(200).setVisible(false);
    this._pBarFg = this.add.graphics().setDepth(201).setVisible(false);
    this._pLabel = this.add.text(W / 2, 49, 'POWER-UP!', {
      fontSize: '8px', fontFamily: '"Press Start 2P", monospace', color: '#00FF00',
    }).setOrigin(0.5).setDepth(202).setVisible(false);

    // Spawn timers
    this._ghostTimer = this.time.addEvent({
      delay: this.spawnInterval,
      callback: this._spawnGhost, callbackScope: this, loop: true,
    });
    this._waferTimer = this.time.addEvent({
      delay: 900,
      callback: this._spawnWaferRow, callbackScope: this, loop: true,
    });
    this._fruitTimer = this.time.addEvent({
      delay: 18000,
      callback: this._spawnFruit, callbackScope: this, loop: true,
      startAt: 15000,
    });
    this._diffTimer = this.time.addEvent({
      delay: DIFFICULTY_INTERVAL,
      callback: this._rampDifficulty, callbackScope: this, loop: true,
    });

    // Passive score: +5 pts every second survived
    this.time.addEvent({
      delay: 1000,
      callback: () => { if (this.gameActive) { this.score += 5; this._updateHUD(); } },
      loop: true,
    });

    // Mouse tracking: player moves sideways only
    this.input.on('pointermove', (ptr) => {
      if (!this.gameActive) return;
      const margin = (ROAD_R - ROAD_L) * 0.06;
      this.player.x = Phaser.Math.Clamp(ptr.x, ROAD_L + margin, ROAD_R - margin);
    });
  }

  // ---- static background ----

  _drawStaticBg () {
    const W = this.scale.width;
    const H = this.scale.height;
    const g = this._bgGfx;
    g.clear();

    // Sky
    g.fillStyle(0x000011);
    g.fillRect(0, 0, W, VP_Y);

    // Stars (deterministic positions)
    g.fillStyle(0xFFFFFF, 0.85);
    [[42,30],[120,55],[200,20],[310,80],[380,45],
     [60,100],[170,120],[260,90],[330,130],[430,70],
     [90,140],[220,10],[350,60],[460,100],[15,85]].forEach(function(s) {
      g.fillRect(s[0], s[1], 1, 1);
    });

    // Road surface (dark trapezoid converging to vanishing point)
    g.fillStyle(0x04040F);
    g.fillTriangle(VP_X, VP_Y, ROAD_R, H, ROAD_L, H);

    // Side gutters
    g.fillStyle(0x070710);
    g.fillRect(0, VP_Y, W, H - VP_Y);
    // Re-draw road on top
    g.fillStyle(0x04040F);
    g.fillTriangle(VP_X, VP_Y, ROAD_R, H, ROAD_L, H);

    // Horizon glow
    g.lineStyle(2, 0x0033BB, 0.80);
    g.beginPath(); g.moveTo(0, VP_Y); g.lineTo(W, VP_Y); g.strokePath();

    // Road outer edges (neon blue)
    g.lineStyle(3, 0x3366FF, 0.95);
    g.beginPath(); g.moveTo(VP_X, VP_Y); g.lineTo(ROAD_L, H); g.strokePath();
    g.beginPath(); g.moveTo(VP_X, VP_Y); g.lineTo(ROAD_R, H); g.strokePath();
  }

  // ---- animated grid (called every frame) ----

  _drawGrid () {
    const H = this.scale.height;
    const g = this._gridGfx;
    g.clear();

    // Dashed lane dividers
    const div1 = (LANE_X[0] + LANE_X[1]) / 2;
    const div2 = (LANE_X[1] + LANE_X[2]) / 2;
    for (let d = 0.05; d < 1.0; d += 0.11) {
      const alpha = Math.min(0.60, d * 0.85);
      const d2 = d + 0.055;
      const y1 = VP_Y + (H - VP_Y) * d;
      const y2 = VP_Y + (H - VP_Y) * d2;
      g.lineStyle(1, 0x2244BB, alpha);
      g.beginPath();
      g.moveTo(VP_X + (div1 - VP_X) * d,  y1);
      g.lineTo(VP_X + (div1 - VP_X) * d2, y2);
      g.strokePath();
      g.beginPath();
      g.moveTo(VP_X + (div2 - VP_X) * d,  y1);
      g.lineTo(VP_X + (div2 - VP_X) * d2, y2);
      g.strokePath();
    }

    // Scrolling horizontal grid lines
    const N = 12;
    for (let i = 0; i < N; i++) {
      const d = (i / N + this.gridPhase) % 1.0;
      if (d < 0.04) continue;
      const alpha = Math.min(0.55, d * 1.1) * 0.60;
      const y  = VP_Y + (H - VP_Y) * d;
      const lx = VP_X + (ROAD_L - VP_X) * d;
      const rx = VP_X + (ROAD_R - VP_X) * d;
      g.lineStyle(1, 0x1144CC, alpha);
      g.beginPath(); g.moveTo(lx, y); g.lineTo(rx, y); g.strokePath();
    }
  }

  // ---- HUD ----

  _createHUD () {
    const W = this.scale.width;
    this.add.rectangle(0, 0, W, 36, 0x000000).setOrigin(0).setDepth(190);
    this.add.graphics().setDepth(191)
      .lineStyle(1, 0x333333)
      .lineBetween(0, 36, W, 36);

    this._scoreTxt = this.add.text(10, 10, 'SCORE 000000', {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setDepth(195);

    this._hiTxt = this.add.text(W / 2, 10, 'BEST  000000', {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#FFD700',
    }).setOrigin(0.5, 0).setDepth(195);

    this._lifeBox = this.add.container(W - 10, 10).setDepth(195);
    this._lifeIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const ic = this.add.image(-(i * 26), 8, 'life_icon');
      this._lifeBox.add(ic);
      this._lifeIcons.push(ic);
    }
    this._updateHUD();
  }

  _updateHUD () {
    const hi = Math.max(this.score, this.registry.get('hiScore') || 0);
    this._scoreTxt.setText('SCORE ' + String(this.score).padStart(6, '0'));
    this._hiTxt   .setText('BEST  ' + String(hi).padStart(6, '0'));
    this._lifeIcons.forEach(function(ic, i) { ic.setAlpha(i < this.lives ? 1 : 0.15); }, this);
  }

  // ---- spawners ----

  _spawnGhost () {
    if (!this.gameActive) return;
    const lane      = Phaser.Math.Between(0, 2);
    const types     = ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'];
    const ghostType = Phaser.Utils.Array.GetRandom(types);
    const texKey    = this.powered ? 'ghost_scared' : ghostType;
    const p         = perspPos(LANE_X[lane], 0);
    const sprite    = this.add.image(p.x, p.y, texKey).setScale(0.12).setDepth(1);
    this._objects.push({ type: 'ghost', lane: lane, depth: 0, ghostType: ghostType,
                         sprite: sprite, passed: false, handled: false });
  }

  // Wafers spawn as a row in one lane -- like Pac-Man dots on the road
  _spawnWaferRow () {
    if (!this.gameActive) return;
    const lane  = Phaser.Math.Between(0, 2);
    const count = Phaser.Math.Between(3, 5);
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 230, function() {
        if (!this.gameActive) return;
        const p      = perspPos(LANE_X[lane], 0);
        const sprite = this.add.image(p.x, p.y, 'wafer').setScale(0.12).setDepth(1);
        this._objects.push({ type: 'wafer', lane: lane, depth: 0,
                             sprite: sprite, passed: false, handled: false });
      }, [], this);
    }
  }

  _spawnFruit () {
    if (!this.gameActive) return;
    const lane   = Phaser.Math.Between(0, 2);
    const p      = perspPos(LANE_X[lane], 0);
    const sprite = this.add.image(p.x, p.y, 'fruit').setScale(0.12).setDepth(1);
    this._objects.push({ type: 'fruit', lane: lane, depth: 0,
                         sprite: sprite, passed: false, handled: false });
  }

  // ---- power-up ----

  _activatePower () {
    this.powered       = true;
    this.powerTimeLeft = POWER_DURATION;
    this._objects.filter(function(o) { return o.type === 'ghost' && !o.handled; })
      .forEach(function(o) { o.sprite.setTexture('ghost_scared'); });
    this._pBarBg.setVisible(true);
    this._pBarFg.setVisible(true);
    this._pLabel.setVisible(true);
  }

  _deactivatePower () {
    this.powered = false;
    this._objects.filter(function(o) { return o.type === 'ghost' && !o.handled; })
      .forEach(function(o) { o.sprite.setTexture(o.ghostType || 'ghost_red'); });
    this._pBarBg.setVisible(false);
    this._pBarFg.setVisible(false);
    this._pLabel.setVisible(false);
  }

  _drawPowerBar () {
    const W     = this.scale.width;
    const bW    = 280;
    const bH    = 10;
    const bX    = (W - bW) / 2;
    const bY    = 48;
    const ratio = Phaser.Math.Clamp(this.powerTimeLeft / POWER_DURATION, 0, 1);
    const warn  = this.powerTimeLeft < POWER_WARNING_TIME;
    this._pBarBg.clear();
    this._pBarBg.fillStyle(0x333333);
    this._pBarBg.fillRect(bX, bY, bW, bH);
    this._pBarFg.clear();
    this._pBarFg.fillStyle(warn ? 0xFF4400 : 0x00EE00);
    this._pBarFg.fillRect(bX, bY, Math.round(bW * ratio), bH);
    this._pLabel.setColor(warn ? '#FF4400' : '#00FF00');
  }

  // ---- invincibility after a hit ----

  _startInvincible () {
    this.invincible = true;
    this.tweens.add({
      targets: this.player, alpha: 0.20, duration: 130, yoyo: true, repeat: 7,
      onComplete: function() { this.player.setAlpha(1); this.invincible = false; },
      callbackScope: this,
    });
  }

  // ---- difficulty ramp ----

  _rampDifficulty () {
    if (!this.gameActive) return;
    this.depthSpeed    = Math.min(this.depthSpeed + 0.045, DEPTH_SPEED_MAX);
    this.spawnInterval = Math.max(this.spawnInterval - 120, SPAWN_INTERVAL_MIN);
    this._ghostTimer.reset({
      delay: this.spawnInterval,
      callback: this._spawnGhost, callbackScope: this, loop: true,
    });
  }

  // ---- floating score text ----

  _float (x, y, msg, color) {
    const t = this.add.text(x, y, msg, {
      fontSize: '11px', fontFamily: '"Press Start 2P", monospace',
      color: color, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({
      targets: t, y: y - 55, alpha: 0, duration: 900, ease: 'Cubic.Out',
      onComplete: function() { t.destroy(); },
    });
  }

  // ---- game over ----

  _gameOver () {
    this.gameActive = false;
    [this._ghostTimer, this._waferTimer, this._fruitTimer, this._diffTimer]
      .forEach(function(ev) { ev.remove(false); });
    const hi = this.registry.get('hiScore') || 0;
    if (this.score > hi) this.registry.set('hiScore', this.score);

    this.tweens.add({
      targets: this.player, scaleX: 0, scaleY: 0, duration: 700, ease: 'Back.In',
      onComplete: function() {
        this.time.delayedCall(500, function() {
          this.scene.start('GameOver', { score: this.score });
        }, [], this);
      },
      callbackScope: this,
    });
  }

  // ---- collision handler ----

  _processCollision (obj) {
    if (obj.type === 'ghost') {
      if (this.powered) {
        this.score += GHOST_EAT_POINTS;
        this._updateHUD();
        this._float(obj.sprite.x, obj.sprite.y, '+' + GHOST_EAT_POINTS, '#00FF00');
        this.cameras.main.shake(90, 0.012);
        obj.handled = true;
      } else if (!this.invincible) {
        this.lives = Math.max(0, this.lives - 1);
        this._updateHUD();
        this.cameras.main.shake(230, 0.025);
        this.cameras.main.flash(230, 255, 0, 0, false);
        obj.handled = true;
        if (this.lives <= 0) this._gameOver();
        else this._startInvincible();
      }
      // If invincible: ghost passes through (handled stays false)
    } else if (obj.type === 'wafer') {
      this.score += WAFER_POINTS;
      this._updateHUD();
      this._float(obj.sprite.x, obj.sprite.y, '+' + WAFER_POINTS, '#FFDEAD');
      obj.handled = true;
    } else if (obj.type === 'fruit') {
      this.score += FRUIT_POINTS;
      this._updateHUD();
      this._float(obj.sprite.x, obj.sprite.y, 'POWER UP!', '#FF69B4');
      this._activatePower();
      obj.handled = true;
    }
  }

  // ---- main update loop ----

  update (_time, delta) {
    if (!this.gameActive) return;
    this.elapsed += delta;

    // Advance grid animation speed
    this.gridPhase = (this.gridPhase + this.depthSpeed * (delta / 1000) * 0.48) % 1.0;
    this._drawGrid();

    // Player texture + subtle vertical bob
    this.player.setTexture(this.powered ? 'pacman_back_power' : 'pacman_back');
    this.player.y = PLAYER_Y + Math.sin(this.elapsed * 0.004) * 3;

    // Power-up countdown
    if (this.powered) {
      this.powerTimeLeft -= delta;
      this._drawPowerBar();
      if (this.powerTimeLeft < POWER_WARNING_TIME) {
        const flash = Math.floor(this.elapsed / 200) % 2 === 0;
        this._objects.filter(function(o) { return o.type === 'ghost' && !o.handled; })
          .forEach(function(o) {
            o.sprite.setTexture(flash ? 'ghost_scared' : 'ghost_scared_flash');
          });
      }
      if (this.powerTimeLeft <= 0) this._deactivatePower();
    }

    // Update every in-flight object
    var self = this;
    this._objects.forEach(function(obj) {
      if (obj.handled) return;

      obj.depth += self.depthSpeed * (delta / 1000);

      // Ghosts wobble left-right (amplitude grows as they near)
      var laneX = LANE_X[obj.lane];
      if (obj.type === 'ghost') {
        laneX += Math.sin(self.elapsed * 0.002 + obj.lane * 2.1) * 12 * obj.depth;
      }

      var pp = perspPos(laneX, obj.depth);

      // Fruit pulses in size
      if (obj.type === 'fruit') {
        var pulse = 1 + Math.sin(self.elapsed * 0.006) * 0.10;
        obj.sprite.setPosition(pp.x, pp.y);
        obj.sprite.setScale(pp.scale * pulse);
      } else {
        obj.sprite.setPosition(pp.x, pp.y);
        obj.sprite.setScale(pp.scale);
      }
      obj.sprite.setDepth(Math.round(obj.depth * 85) + 10);

      // Collision check: fires once per object
      if (!obj.passed && obj.depth >= COLLISION_DEPTH) {
        obj.passed = true;
        if (Math.abs(self.player.x - obj.sprite.x) < COLLISION_TOL) {
          self._processCollision(obj);
        }
      }
    });

    // Remove objects that are handled or have passed the player plane
    this._objects = this._objects.filter(function(obj) {
      if (obj.handled || obj.depth > 1.02) {
        if (obj.sprite && obj.sprite.active) obj.sprite.destroy();
        return false;
      }
      return true;
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

    const bdr = this.add.graphics();
    bdr.lineStyle(6, 0xFF0000, 0.45); bdr.strokeRect(4, 4, W - 8, H - 8);
    bdr.lineStyle(3, 0xFF0000, 0.90); bdr.strokeRect(10, 10, W - 20, H - 20);

    this.add.text(W / 2 + 3, 123, 'GAME  OVER', {
      fontSize: '30px', fontFamily: '"Press Start 2P", monospace', color: '#880000',
    }).setOrigin(0.5);
    const goTxt = this.add.text(W / 2, 120, 'GAME  OVER', {
      fontSize: '30px', fontFamily: '"Press Start 2P", monospace', color: '#FF0000',
    }).setOrigin(0.5);
    this.tweens.add({ targets: goTxt, alpha: 0.25, duration: 360, yoyo: true, repeat: -1 });

    this.add.text(W / 2, 210, 'SCORE', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#AAAAAA',
    }).setOrigin(0.5);
    this.add.text(W / 2, 240, String(this.finalScore).padStart(6, '0'), {
      fontSize: '26px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setOrigin(0.5);

    const hi = this.registry.get('hiScore') || 0;
    this.add.text(W / 2, 292, 'BEST', {
      fontSize: '12px', fontFamily: '"Press Start 2P", monospace', color: '#AAAAAA',
    }).setOrigin(0.5);
    this.add.text(W / 2, 320, String(hi).padStart(6, '0'), {
      fontSize: '22px', fontFamily: '"Press Start 2P", monospace', color: '#FFD700',
    }).setOrigin(0.5);

    if (this.finalScore > 0 && this.finalScore >= hi) {
      const nr = this.add.text(W / 2, 360, '*** NEW RECORD! ***', {
        fontSize: '11px', fontFamily: '"Press Start 2P", monospace', color: '#FF69B4',
      }).setOrigin(0.5);
      this.tweens.add({ targets: nr, scaleX: 1.12, scaleY: 1.12, duration: 260, yoyo: true, repeat: -1 });
    }

    ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'].forEach(function(k, i) {
      const gh = this.add.image(-30, H - 58, k);
      this.tweens.add({
        targets: gh, x: W + 30,
        duration: 2800 + i * 350, delay: i * 550, repeat: -1,
        onRepeat: function() { gh.x = -30; gh.y = H - 58 + Phaser.Math.Between(-8, 8); },
      });
    }, this);

    const cont = this.add.text(W / 2, H - 95, 'CLICK TO CONTINUE', {
      fontSize: '13px', fontFamily: '"Press Start 2P", monospace', color: '#FFFFFF',
    }).setOrigin(0.5);
    this.tweens.add({ targets: cont, alpha: 0.1, duration: 450, yoyo: true, repeat: -1 });

    this.add.text(W / 2, H - 55, '1 PLAYER', {
      fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#666666',
    }).setOrigin(0.5);

    this.input.once('pointerdown', function() { this.scene.start('Menu'); }, this);
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
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
};

window.addEventListener('load', function() { new Phaser.Game(config); });
