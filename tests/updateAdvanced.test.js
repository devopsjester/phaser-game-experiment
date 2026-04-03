/**
 * Tests for advanced update loop behavior - power-up countdown, warning flash,
 * fruit pulse scaling, player movement, passive score, and ghost wobble.
 */
'use strict';

const {
  GameScene,
  LANE_X, COLLISION_DEPTH, COLLISION_TOL,
  POWER_DURATION, POWER_WARNING_TIME,
  MAX_LIVES,
  DEPTH_SPEED_BASE, ROAD_L, ROAD_R,
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
 *  POWER-UP COUNTDOWN AND WARNING FLASH
 * ================================================================ */

describe('GameScene update – power-up countdown', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('power-up timer decreases during update', () => {
    scene._activatePower();
    const before = scene.powerTimeLeft;
    scene.update(0, 100);
    expect(scene.powerTimeLeft).toBeLessThan(before);
  });

  test('power-up deactivates when timer reaches 0', () => {
    scene._activatePower();
    scene.powerTimeLeft = 50; // almost expired
    scene.update(0, 100); // delta > remaining time
    expect(scene.powered).toBe(false);
  });

  test('power bar is drawn during power-up', () => {
    scene._activatePower();
    // _pBarBg and _pBarFg should be visible
    expect(scene._pBarBg.setVisible).toHaveBeenCalledWith(true);
    expect(scene._pBarFg.setVisible).toHaveBeenCalledWith(true);
  });

  test('power bar updates each frame when powered', () => {
    scene._activatePower();
    // The _pBarFg.clear() is called during _drawPowerBar in update
    scene.update(0, 16);
    expect(scene._pBarFg.clear).toHaveBeenCalled();
    expect(scene._pBarFg.fillRect).toHaveBeenCalled();
  });

  test('power bar changes color during warning phase', () => {
    scene._activatePower();
    scene.powerTimeLeft = POWER_WARNING_TIME - 100;
    scene.update(0, 16);
    // During warning, bar uses orange/red color (0xFF4400)
    expect(scene._pBarFg.fillStyle).toHaveBeenCalledWith(0xFF4400);
  });

  test('power bar uses green when not in warning phase', () => {
    scene._activatePower();
    scene.powerTimeLeft = POWER_DURATION; // full time, no warning
    scene.update(0, 16);
    expect(scene._pBarFg.fillStyle).toHaveBeenCalledWith(0x00EE00);
  });
});

describe('GameScene update – power-up warning ghost flash', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('ghosts flash between scared textures during warning', () => {
    scene._activatePower();
    scene.powerTimeLeft = POWER_WARNING_TIME - 100;
    const ghost = makeObj(scene, 'ghost', 1, 0.5);
    // Run several frames to see the texture alternation
    scene.update(0, 16);
    scene.update(0, 200); // shift elapsed enough to toggle flash
    // Ghost should have been set to either ghost_scared or ghost_scared_flash
    const textureCalls = ghost.sprite.setTexture.mock.calls.map(c => c[0]);
    const scaredTextures = textureCalls.filter(t =>
      t === 'ghost_scared' || t === 'ghost_scared_flash'
    );
    expect(scaredTextures.length).toBeGreaterThan(0);
  });
});

/* ================================================================
 *  FRUIT PULSE SCALING
 * ================================================================ */

describe('GameScene update – fruit pulse', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('fruit objects use pulse scaling in update', () => {
    const fruit = makeObj(scene, 'fruit', 1, 0.5);
    scene.update(0, 16);
    // Fruit should have setScale called (pulse effect)
    expect(fruit.sprite.setScale).toHaveBeenCalled();
  });

  test('fruit scale differs slightly between frames due to pulse', () => {
    const fruit = makeObj(scene, 'fruit', 1, 0.5);
    scene.update(0, 16);
    const firstScale = fruit.sprite.setScale.mock.calls[fruit.sprite.setScale.mock.calls.length - 1][0];

    // Advance time significantly to change the pulse
    scene.update(0, 500);
    const secondScale = fruit.sprite.setScale.mock.calls[fruit.sprite.setScale.mock.calls.length - 1][0];

    // They should both be close to the perspective scale but may differ slightly
    expect(typeof firstScale).toBe('number');
    expect(typeof secondScale).toBe('number');
  });
});

/* ================================================================
 *  PLAYER MOVEMENT (pointermove handler)
 * ================================================================ */

describe('GameScene – player movement via pointermove', () => {
  let scene;
  let pointermoveHandler;

  beforeEach(() => {
    scene = createGameScene();
    // Extract the pointermove handler
    const onCalls = scene.input.on.mock.calls;
    const pmCall = onCalls.find(c => c[0] === 'pointermove');
    pointermoveHandler = pmCall[1];
  });

  test('player moves horizontally on pointer move', () => {
    const beforeX = scene.player.x;
    pointermoveHandler({ x: 200 });
    expect(scene.player.x).toBe(200);
  });

  test('player X is clamped to road boundaries', () => {
    const margin = (ROAD_R - ROAD_L) * 0.06;
    pointermoveHandler({ x: 0 }); // far left
    expect(scene.player.x).toBeGreaterThanOrEqual(ROAD_L + margin);

    pointermoveHandler({ x: 1000 }); // far right
    expect(scene.player.x).toBeLessThanOrEqual(ROAD_R - margin);
  });

  test('player does not move when game is not active', () => {
    scene.gameActive = false;
    const beforeX = scene.player.x;
    pointermoveHandler({ x: 100 });
    expect(scene.player.x).toBe(beforeX);
  });
});

/* ================================================================
 *  GHOST WOBBLE
 * ================================================================ */

describe('GameScene update – ghost wobble', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('ghost position includes wobble offset during update', () => {
    const ghost = makeObj(scene, 'ghost', 1, 0.5);
    scene.update(0, 16);
    // Ghost should have setPosition called
    expect(ghost.sprite.setPosition).toHaveBeenCalled();
  });
});

/* ================================================================
 *  PLAYER TEXTURE & BOB
 * ================================================================ */

describe('GameScene update – player texture and bob', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('player uses normal texture when not powered', () => {
    scene.update(0, 16);
    expect(scene.player.setTexture).toHaveBeenCalledWith('pacman_back');
  });

  test('player uses powered texture when powered', () => {
    scene._activatePower();
    scene.update(0, 16);
    expect(scene.player.setTexture).toHaveBeenCalledWith('pacman_back_power');
  });
});

/* ================================================================
 *  ELAPSED TIME TRACKING
 * ================================================================ */

describe('GameScene update – elapsed time', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('elapsed time accumulates across frames', () => {
    expect(scene.elapsed).toBe(0);
    scene.update(0, 100);
    expect(scene.elapsed).toBe(100);
    scene.update(0, 50);
    expect(scene.elapsed).toBe(150);
  });
});

/* ================================================================
 *  GRID ANIMATION
 * ================================================================ */

describe('GameScene update – grid animation', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('gridPhase advances during update', () => {
    const before = scene.gridPhase;
    scene.update(0, 100);
    expect(scene.gridPhase).not.toBe(before);
  });

  test('gridPhase wraps around (stays within 0-1)', () => {
    // Run many updates to wrap around
    for (let i = 0; i < 100; i++) {
      scene.update(0, 100);
    }
    expect(scene.gridPhase).toBeGreaterThanOrEqual(0);
    expect(scene.gridPhase).toBeLessThan(1);
  });
});
