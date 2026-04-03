/**
 * Tests for SoundManager integration – verifies that game events
 * trigger the correct sound methods and that toggles work.
 */
'use strict';

const {
  GameScene,
  LANE_X, COLLISION_DEPTH,
  WAFER_POINTS, GHOST_EAT_POINTS, FRUIT_POINTS,
  POWER_DURATION,
  MAX_LIVES,
  perspPos,
} = require('../src/game');

/* ---- helpers (same pattern as gameScene.test.js) ---- */

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
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn(function () { this.active = false; }),
  };
}

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

function createGameScene () {
  const scene = new GameScene();

  scene.scale = { width: 480, height: 640 };
  scene.add = {
    graphics: jest.fn(() => mockGraphics()),
    rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis() })),
    text: jest.fn(() => mockText()),
    image: jest.fn((x, y) => mockSprite(x, y)),
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
    addEvent: jest.fn(() => ({ remove: jest.fn(), reset: jest.fn() })),
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

  return scene;
}

function makeObj (scene, type, lane, depth, opts) {
  const pp = perspPos(LANE_X[lane], depth);
  const sprite = mockSprite(pp.x, pp.y);
  const obj = {
    type,
    lane,
    depth,
    sprite,
    passed: false,
    handled: false,
    ...(type === 'ghost' ? { ghostType: (opts && opts.ghostType) || 'ghost_red' } : {}),
  };
  scene._objects.push(obj);
  return obj;
}

/* ================================================================
 *  SOUND INTEGRATION TESTS
 * ================================================================ */

describe('SoundManager – game integration', () => {
  beforeEach(() => {
    // Reset spies on the global SoundManager mock
    jest.spyOn(SoundManager, 'playWaka');
    jest.spyOn(SoundManager, 'playEatGhost');
    jest.spyOn(SoundManager, 'playPowerUp');
    jest.spyOn(SoundManager, 'playDeath');
    jest.spyOn(SoundManager, 'playGameOver');
    jest.spyOn(SoundManager, 'playFruit');
    jest.spyOn(SoundManager, 'startMusic');
    jest.spyOn(SoundManager, 'stopMusic');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('collecting a wafer plays waka sound', () => {
    const scene = createGameScene();
    const obj = makeObj(scene, 'wafer', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(SoundManager.playWaka).toHaveBeenCalled();
  });

  test('eating a ghost while powered plays eat ghost sound', () => {
    const scene = createGameScene();
    scene.powered = true;
    scene.powerTimeLeft = POWER_DURATION;
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(SoundManager.playEatGhost).toHaveBeenCalled();
  });

  test('collecting a fruit plays fruit sound', () => {
    const scene = createGameScene();
    const obj = makeObj(scene, 'fruit', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(SoundManager.playFruit).toHaveBeenCalled();
  });

  test('activating power-up plays power-up sound', () => {
    const scene = createGameScene();
    scene._activatePower();
    expect(SoundManager.playPowerUp).toHaveBeenCalled();
  });

  test('hitting a ghost without power plays death sound', () => {
    const scene = createGameScene();
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(SoundManager.playDeath).toHaveBeenCalled();
  });

  test('game over plays game over sound and stops music', () => {
    const scene = createGameScene();
    scene._gameOver();
    expect(SoundManager.playGameOver).toHaveBeenCalled();
    expect(SoundManager.stopMusic).toHaveBeenCalled();
  });

  test('GameScene.create starts background music', () => {
    createGameScene();
    expect(SoundManager.startMusic).toHaveBeenCalled();
  });
});

describe('SoundManager – API surface', () => {
  test('SoundManager exposes toggle methods', () => {
    expect(typeof SoundManager.toggleSfx).toBe('function');
    expect(typeof SoundManager.toggleMusic).toBe('function');
  });

  test('SoundManager exposes state query methods', () => {
    expect(typeof SoundManager.isSfxOn).toBe('function');
    expect(typeof SoundManager.isMusicOn).toBe('function');
  });

  test('SoundManager exposes init and destroy', () => {
    expect(typeof SoundManager.init).toBe('function');
    expect(typeof SoundManager.destroy).toBe('function');
  });
});
