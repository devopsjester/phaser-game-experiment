/**
 * Tests targeting remaining uncovered lines and branches.
 *
 * Line 172: _pacFront with open=false (BootScene helper)
 * Line 257: MenuScene pac-man animation callback
 * Line 371: GameScene passive score callback
 * Various uncovered branches
 */
'use strict';

const {
  BootScene, MenuScene, GameScene,
  GAME_W, GAME_H, LANE_X, COLLISION_DEPTH, perspPos,
  MAX_LIVES, POWER_DURATION, POWER_WARNING_TIME,
} = require('../src/game');

/* ---- shared helpers ---- */

function mockGraphics () {
  return {
    clear: jest.fn().mockReturnThis(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    fillTriangle: jest.fn().mockReturnThis(),
    fillCircle: jest.fn().mockReturnThis(),
    fillEllipse: jest.fn().mockReturnThis(),
    fillPath: jest.fn().mockReturnThis(),
    lineStyle: jest.fn().mockReturnThis(),
    lineBetween: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    beginPath: jest.fn().mockReturnThis(),
    closePath: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    arc: jest.fn().mockReturnThis(),
    strokePath: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    strokeCircle: jest.fn().mockReturnThis(),
    generateTexture: jest.fn().mockReturnThis(),
    destroy: jest.fn().mockReturnThis(),
  };
}

function mockSprite (x, y) {
  return {
    x, y,
    active: true,
    setTexture: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setPosition: jest.fn(function (nx, ny) { this.x = nx; this.y = ny; return this; }),
    setAlpha: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    destroy: jest.fn(function () { this.active = false; }),
  };
}

function mockText () {
  return {
    setText: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    text: '',
  };
}

/* ================================================================
 *  BootScene._pacFront with open=false (Line 172)
 * ================================================================ */

describe('BootScene._pacFront – closed mouth branch', () => {
  test('_pacFront with open=false draws a filled circle (no arc)', () => {
    const scene = new BootScene();
    const g = mockGraphics();
    scene._pacFront(g, 0xFFFF00, false);
    expect(g.fillCircle).toHaveBeenCalledWith(24, 24, 21);
    expect(g.beginPath).not.toHaveBeenCalled();
  });

  test('_pacFront with open=true draws an arc (open mouth)', () => {
    const scene = new BootScene();
    const g = mockGraphics();
    scene._pacFront(g, 0xFFFF00, true);
    expect(g.beginPath).toHaveBeenCalled();
    expect(g.arc).toHaveBeenCalled();
    expect(g.fillPath).toHaveBeenCalled();
  });
});

/* ================================================================
 *  MenuScene pac-man animation callback (Line 257)
 * ================================================================ */

describe('MenuScene – pac-man texture toggle callback', () => {
  test('time event callback toggles pacman texture', () => {
    const scene = new MenuScene();
    scene.scale = { width: GAME_W, height: GAME_H };

    const pacImage = {
      x: 50, y: 152,
      setOrigin: jest.fn().mockReturnThis(),
      setTexture: jest.fn(function (k) { this.texture = { key: k }; return this; }),
      texture: { key: 'pacman_open' },
    };

    scene.add = {
      rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis() })),
      graphics: jest.fn(() => ({
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
      })),
      text: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      })),
      image: jest.fn((x, y, key) => {
        if (key === 'pacman_open') return pacImage;
        return {
          x, y,
          setOrigin: jest.fn().mockReturnThis(),
          texture: { key },
        };
      }),
    };
    scene.tweens = { add: jest.fn() };

    // Capture the time.addEvent callbacks
    const timeEventCallbacks = [];
    scene.time = {
      addEvent: jest.fn((cfg) => {
        timeEventCallbacks.push(cfg.callback);
        return { remove: jest.fn() };
      }),
    };
    scene.input = { once: jest.fn() };
    scene.registry = {
      _store: {},
      get (k) { return this._store[k]; },
      set (k, v) { this._store[k] = v; },
    };
    scene.scene = { start: jest.fn() };

    scene.create();

    // The first time event callback is the pac-man texture toggle
    expect(timeEventCallbacks.length).toBeGreaterThan(0);
    const toggleCallback = timeEventCallbacks[0];

    // Call the callback – should toggle from pacman_open to pacman_closed
    toggleCallback();
    expect(pacImage.texture.key).toBe('pacman_closed');

    // Call again – should toggle back
    toggleCallback();
    expect(pacImage.texture.key).toBe('pacman_open');
  });
});

/* ================================================================
 *  GameScene passive score callback (Line 371)
 * ================================================================ */

describe('GameScene – passive score callback', () => {
  function createGameSceneWithTimerCapture () {
    const scene = new GameScene();
    const timerCallbacks = [];

    scene.scale = { width: 480, height: 640 };
    scene.add = {
      graphics: jest.fn(() => mockGraphics()),
      rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis() })),
      text: jest.fn(() => mockText()),
      image: jest.fn((x, y, _key) => mockSprite(x, y)),
      container: jest.fn(() => ({
        setDepth: jest.fn().mockReturnThis(),
        add: jest.fn(),
      })),
    };
    scene.make = {
      graphics: jest.fn(() => mockGraphics()),
    };
    scene.cameras = {
      main: { shake: jest.fn(), flash: jest.fn() },
    };
    scene.tweens = {
      add: jest.fn((cfg) => {
        if (cfg && cfg.onComplete) cfg.onComplete.call(cfg.callbackScope || scene);
      }),
    };
    scene.time = {
      addEvent: jest.fn((cfg) => {
        timerCallbacks.push({ delay: cfg.delay, callback: cfg.callback, scope: cfg.callbackScope });
        return { remove: jest.fn(), reset: jest.fn() };
      }),
      delayedCall: jest.fn((_delay, cb, _args, scope) => { cb.call(scope || scene); }),
    };
    scene.input = {
      on: jest.fn(),
      once: jest.fn(),
    };
    scene.registry = {
      _store: {},
      get (k) { return this._store[k]; },
      set (k, v) { this._store[k] = v; },
    };
    scene.scene = {
      start: jest.fn(),
    };

    scene.init();
    scene.create();

    return { scene, timerCallbacks };
  }

  test('passive score callback adds 5 points when game is active', () => {
    const { scene, timerCallbacks } = createGameSceneWithTimerCapture();
    // Find the 1000ms passive score timer
    const passiveTimer = timerCallbacks.find(t => t.delay === 1000);
    expect(passiveTimer).toBeDefined();

    const scoreBefore = scene.score;
    // The callback is an arrow function bound to the scene's scope
    passiveTimer.callback.call(passiveTimer.scope || scene);
    expect(scene.score).toBe(scoreBefore + 5);
  });

  test('passive score callback does not add points when game is inactive', () => {
    const { scene, timerCallbacks } = createGameSceneWithTimerCapture();
    scene.gameActive = false;
    const passiveTimer = timerCallbacks.find(t => t.delay === 1000);

    const scoreBefore = scene.score;
    passiveTimer.callback.call(passiveTimer.scope || scene);
    expect(scene.score).toBe(scoreBefore);
  });
});

/* ================================================================
 *  Additional branch coverage tests
 * ================================================================ */

describe('GameScene._processCollision – branch coverage', () => {
  function createGameScene () {
    const scene = new GameScene();
    scene.scale = { width: 480, height: 640 };
    scene.add = {
      graphics: jest.fn(() => mockGraphics()),
      rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis() })),
      text: jest.fn(() => mockText()),
      image: jest.fn((x, y, _key) => mockSprite(x, y)),
      container: jest.fn(() => ({
        setDepth: jest.fn().mockReturnThis(),
        add: jest.fn(),
      })),
    };
    scene.make = { graphics: jest.fn(() => mockGraphics()) };
    scene.cameras = { main: { shake: jest.fn(), flash: jest.fn() } };
    scene.tweens = {
      add: jest.fn((cfg) => {
        if (cfg && cfg.onComplete) cfg.onComplete.call(cfg.callbackScope || scene);
      }),
    };
    scene.time = {
      addEvent: jest.fn(() => ({ remove: jest.fn(), reset: jest.fn() })),
      delayedCall: jest.fn((_delay, cb, _args, scope) => { cb.call(scope || scene); }),
    };
    scene.input = { on: jest.fn(), once: jest.fn() };
    scene.registry = {
      _store: {},
      get (k) { return this._store[k]; },
      set (k, v) { this._store[k] = v; },
    };
    scene.scene = { start: jest.fn() };
    scene.init();
    scene.create();
    return scene;
  }

  function makeObj (scene, type, lane, depth, opts) {
    const pp = perspPos(LANE_X[lane], depth);
    const sprite = mockSprite(pp.x, pp.y);
    const obj = {
      type, lane, depth, sprite,
      passed: false, handled: false,
      ...(type === 'ghost' ? { ghostType: (opts && opts.ghostType) || 'ghost_red' } : {}),
    };
    scene._objects.push(obj);
    return obj;
  }

  test('ghost hit with exactly 0 lives remaining triggers gameOver', () => {
    const scene = createGameScene();
    scene.lives = 1;
    scene.powered = false;
    scene.invincible = false;
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.lives).toBe(0);
    expect(scene.gameActive).toBe(false);
  });

  test('ghost hit with multiple lives remaining starts invincibility', () => {
    const scene = createGameScene();
    scene.lives = 3;
    scene.powered = false;
    scene.invincible = false;
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.lives).toBe(2);
    expect(scene.cameras.main.flash).toHaveBeenCalled();
  });
});

describe('GameScene._deactivatePower – ghost without ghostType', () => {
  function createGameScene () {
    const scene = new GameScene();
    scene.scale = { width: 480, height: 640 };
    scene.add = {
      graphics: jest.fn(() => mockGraphics()),
      rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis() })),
      text: jest.fn(() => mockText()),
      image: jest.fn((x, y, _key) => mockSprite(x, y)),
      container: jest.fn(() => ({
        setDepth: jest.fn().mockReturnThis(),
        add: jest.fn(),
      })),
    };
    scene.make = { graphics: jest.fn(() => mockGraphics()) };
    scene.cameras = { main: { shake: jest.fn(), flash: jest.fn() } };
    scene.tweens = {
      add: jest.fn((cfg) => {
        if (cfg && cfg.onComplete) cfg.onComplete.call(cfg.callbackScope || scene);
      }),
    };
    scene.time = {
      addEvent: jest.fn(() => ({ remove: jest.fn(), reset: jest.fn() })),
      delayedCall: jest.fn((_delay, cb, _args, scope) => { cb.call(scope || scene); }),
    };
    scene.input = { on: jest.fn(), once: jest.fn() };
    scene.registry = {
      _store: {},
      get (k) { return this._store[k]; },
      set (k, v) { this._store[k] = v; },
    };
    scene.scene = { start: jest.fn() };
    scene.init();
    scene.create();
    return scene;
  }

  test('_deactivatePower falls back to ghost_red when ghostType is missing', () => {
    const scene = createGameScene();
    const sprite = mockSprite(100, 200);
    // Ghost object without ghostType
    scene._objects.push({
      type: 'ghost', lane: 1, depth: 0.5, sprite,
      passed: false, handled: false,
    });
    scene._activatePower();
    scene._deactivatePower();
    expect(sprite.setTexture).toHaveBeenLastCalledWith('ghost_red');
  });
});
