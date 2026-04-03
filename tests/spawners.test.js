/**
 * Tests for GameScene spawner methods – _spawnGhost, _spawnWaferRow, _spawnFruit.
 */
'use strict';

const {
  GameScene,
  LANE_X, COLLISION_DEPTH,
  perspPos,
} = require('../src/game');

/* ---- helpers ---- */

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
    image: jest.fn((x, y, key) => {
      const s = mockSprite(x, y);
      s._textureKey = key;
      return s;
    }),
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

describe('GameScene._spawnGhost', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('adds a ghost object to _objects', () => {
    const before = scene._objects.length;
    scene._spawnGhost();
    expect(scene._objects.length).toBe(before + 1);
    const obj = scene._objects[scene._objects.length - 1];
    expect(obj.type).toBe('ghost');
  });

  test('ghost starts at depth 0', () => {
    scene._spawnGhost();
    const obj = scene._objects[scene._objects.length - 1];
    expect(obj.depth).toBe(0);
  });

  test('ghost is in a valid lane (0, 1, or 2)', () => {
    scene._spawnGhost();
    const obj = scene._objects[scene._objects.length - 1];
    expect([0, 1, 2]).toContain(obj.lane);
  });

  test('ghost has a valid ghostType', () => {
    const validTypes = ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'];
    scene._spawnGhost();
    const obj = scene._objects[scene._objects.length - 1];
    expect(validTypes).toContain(obj.ghostType);
  });

  test('ghost is not passed or handled initially', () => {
    scene._spawnGhost();
    const obj = scene._objects[scene._objects.length - 1];
    expect(obj.passed).toBe(false);
    expect(obj.handled).toBe(false);
  });

  test('ghost gets scared texture when powered', () => {
    scene.powered = true;
    scene._spawnGhost();
    const obj = scene._objects[scene._objects.length - 1];
    expect(obj.sprite._textureKey).toBe('ghost_scared');
  });

  test('ghost gets normal texture when not powered', () => {
    scene.powered = false;
    scene._spawnGhost();
    const obj = scene._objects[scene._objects.length - 1];
    const validTypes = ['ghost_red', 'ghost_pink', 'ghost_cyan', 'ghost_orange'];
    expect(validTypes).toContain(obj.sprite._textureKey);
  });

  test('does nothing when game is not active', () => {
    scene.gameActive = false;
    const before = scene._objects.length;
    scene._spawnGhost();
    expect(scene._objects.length).toBe(before);
  });
});

describe('GameScene._spawnWaferRow', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('spawns wafer objects using delayed calls', () => {
    scene._spawnWaferRow();
    // delayedCall is invoked immediately in our mock, so wafers are added
    const wafers = scene._objects.filter(o => o.type === 'wafer');
    expect(wafers.length).toBeGreaterThanOrEqual(3);
    expect(wafers.length).toBeLessThanOrEqual(5);
  });

  test('all wafers in a row are in the same lane', () => {
    scene._spawnWaferRow();
    const wafers = scene._objects.filter(o => o.type === 'wafer');
    if (wafers.length > 1) {
      const lane = wafers[0].lane;
      wafers.forEach(w => expect(w.lane).toBe(lane));
    }
  });

  test('wafers start at depth 0', () => {
    scene._spawnWaferRow();
    const wafers = scene._objects.filter(o => o.type === 'wafer');
    wafers.forEach(w => expect(w.depth).toBe(0));
  });

  test('does nothing when game is not active', () => {
    scene.gameActive = false;
    const before = scene._objects.length;
    scene._spawnWaferRow();
    expect(scene._objects.length).toBe(before);
  });
});

describe('GameScene._spawnFruit', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('adds a fruit object to _objects', () => {
    const before = scene._objects.length;
    scene._spawnFruit();
    expect(scene._objects.length).toBe(before + 1);
    const obj = scene._objects[scene._objects.length - 1];
    expect(obj.type).toBe('fruit');
  });

  test('fruit starts at depth 0', () => {
    scene._spawnFruit();
    const obj = scene._objects[scene._objects.length - 1];
    expect(obj.depth).toBe(0);
  });

  test('fruit is in a valid lane', () => {
    scene._spawnFruit();
    const obj = scene._objects[scene._objects.length - 1];
    expect([0, 1, 2]).toContain(obj.lane);
  });

  test('does nothing when game is not active', () => {
    scene.gameActive = false;
    const before = scene._objects.length;
    scene._spawnFruit();
    expect(scene._objects.length).toBe(before);
  });
});
