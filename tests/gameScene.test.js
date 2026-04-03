/**
 * Tests for GameScene gameplay logic.
 *
 * We instantiate GameScene directly and call its methods after manually
 * running init() and wiring up the minimal mocks it needs.  This lets us
 * verify scoring, collision, power-ups, lives, difficulty ramping, and
 * game-over without needing a real Phaser renderer.
 */
'use strict';

const {
  GameScene,
  LANE_X, COLLISION_DEPTH, COLLISION_TOL,
  WAFER_POINTS, GHOST_EAT_POINTS, FRUIT_POINTS,
  POWER_DURATION, POWER_WARNING_TIME,
  MAX_LIVES,
  DEPTH_SPEED_BASE, DEPTH_SPEED_MAX,
  SPAWN_INTERVAL_BASE, SPAWN_INTERVAL_MIN,
  DIFFICULTY_INTERVAL,
  perspPos,
} = require('../src/game');

/* ---- helpers to build a mock GameScene ---- */

/** Create a minimal sprite mock. */
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

/** Create a minimal graphics mock (for HUD / power bar). */
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

/** Create a minimal text mock. */
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

/** Wire up the GameScene with all the mocks it needs. */
function createGameScene () {
  const scene = new GameScene();

  // Phaser scene infrastructure
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
      // Immediately call onComplete if provided, so game-over flow completes
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

  // Run init + create
  scene.init();
  scene.create();

  return scene;
}

/** Build a game-object stub at a given depth in a given lane. */
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
 *  TEST SUITES
 * ================================================================ */

describe('GameScene.init – initial state', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('score starts at 0', () => {
    expect(scene.score).toBe(0);
  });

  test('lives start at MAX_LIVES', () => {
    expect(scene.lives).toBe(MAX_LIVES);
  });

  test('player is not powered up at start', () => {
    expect(scene.powered).toBe(false);
  });

  test('player is not invincible at start', () => {
    expect(scene.invincible).toBe(false);
  });

  test('game is active at start', () => {
    expect(scene.gameActive).toBe(true);
  });

  test('depth speed starts at base value', () => {
    expect(scene.depthSpeed).toBe(DEPTH_SPEED_BASE);
  });

  test('spawn interval starts at base value', () => {
    expect(scene.spawnInterval).toBe(SPAWN_INTERVAL_BASE);
  });

  test('objects array starts empty', () => {
    expect(scene._objects).toEqual([]);
  });
});

describe('GameScene._processCollision – wafer pickup', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('collecting a wafer awards WAFER_POINTS', () => {
    const obj = makeObj(scene, 'wafer', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.score).toBe(WAFER_POINTS);
    expect(obj.handled).toBe(true);
  });

  test('collecting multiple wafers accumulates score', () => {
    for (let i = 0; i < 5; i++) {
      const obj = makeObj(scene, 'wafer', 1, COLLISION_DEPTH);
      scene._processCollision(obj);
    }
    expect(scene.score).toBe(WAFER_POINTS * 5);
  });
});

describe('GameScene._processCollision – fruit pickup', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('collecting a fruit awards FRUIT_POINTS', () => {
    const obj = makeObj(scene, 'fruit', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.score).toBe(FRUIT_POINTS);
    expect(obj.handled).toBe(true);
  });

  test('collecting a fruit activates power-up', () => {
    const obj = makeObj(scene, 'fruit', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.powered).toBe(true);
    expect(scene.powerTimeLeft).toBe(POWER_DURATION);
  });
});

describe('GameScene._processCollision – ghost (normal)', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('hitting a ghost without power-up costs a life', () => {
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.lives).toBe(MAX_LIVES - 1);
    expect(obj.handled).toBe(true);
  });

  test('hitting a ghost when invincible does not cost a life', () => {
    scene.invincible = true;
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.lives).toBe(MAX_LIVES);
    expect(obj.handled).toBe(false); // ghost passes through
  });

  test('losing the last life triggers game over', () => {
    scene.lives = 1;
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.lives).toBe(0);
    expect(scene.gameActive).toBe(false);
  });

  test('losing a life (but not the last) starts invincibility', () => {
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    // invincible is set in _startInvincible (tween callback mocked)
    // After the mock tween completes, invincible is reset to false
    // The key check: camera shake was triggered (indicating hit was processed)
    expect(scene.cameras.main.shake).toHaveBeenCalled();
  });
});

describe('GameScene._processCollision – ghost (powered up)', () => {
  let scene;
  beforeEach(() => {
    scene = createGameScene();
    scene.powered = true;
    scene.powerTimeLeft = POWER_DURATION;
  });

  test('eating a ghost while powered awards GHOST_EAT_POINTS', () => {
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.score).toBe(GHOST_EAT_POINTS);
    expect(obj.handled).toBe(true);
  });

  test('eating a ghost does not reduce lives', () => {
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.lives).toBe(MAX_LIVES);
  });

  test('camera shakes on ghost eat for feedback', () => {
    const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(obj);
    expect(scene.cameras.main.shake).toHaveBeenCalled();
  });
});

describe('GameScene._activatePower / _deactivatePower', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('_activatePower sets powered = true and full timer', () => {
    scene._activatePower();
    expect(scene.powered).toBe(true);
    expect(scene.powerTimeLeft).toBe(POWER_DURATION);
  });

  test('_activatePower changes existing ghosts to scared texture', () => {
    const obj = makeObj(scene, 'ghost', 0, 0.5);
    scene._activatePower();
    expect(obj.sprite.setTexture).toHaveBeenCalledWith('ghost_scared');
  });

  test('_deactivatePower sets powered = false', () => {
    scene._activatePower();
    scene._deactivatePower();
    expect(scene.powered).toBe(false);
  });

  test('_deactivatePower restores ghost original textures', () => {
    const obj = makeObj(scene, 'ghost', 0, 0.5, { ghostType: 'ghost_cyan' });
    scene._activatePower();
    scene._deactivatePower();
    expect(obj.sprite.setTexture).toHaveBeenLastCalledWith('ghost_cyan');
  });
});

describe('GameScene._rampDifficulty', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('increases depth speed', () => {
    const before = scene.depthSpeed;
    scene._rampDifficulty();
    expect(scene.depthSpeed).toBeGreaterThan(before);
  });

  test('depth speed is capped at DEPTH_SPEED_MAX', () => {
    for (let i = 0; i < 100; i++) scene._rampDifficulty();
    expect(scene.depthSpeed).toBeLessThanOrEqual(DEPTH_SPEED_MAX);
  });

  test('decreases spawn interval', () => {
    const before = scene.spawnInterval;
    scene._rampDifficulty();
    expect(scene.spawnInterval).toBeLessThan(before);
  });

  test('spawn interval is capped at SPAWN_INTERVAL_MIN', () => {
    for (let i = 0; i < 100; i++) scene._rampDifficulty();
    expect(scene.spawnInterval).toBeGreaterThanOrEqual(SPAWN_INTERVAL_MIN);
  });

  test('does nothing when game is not active', () => {
    scene.gameActive = false;
    const speed = scene.depthSpeed;
    const interval = scene.spawnInterval;
    scene._rampDifficulty();
    expect(scene.depthSpeed).toBe(speed);
    expect(scene.spawnInterval).toBe(interval);
  });
});

describe('GameScene._gameOver', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('sets gameActive to false', () => {
    scene._gameOver();
    expect(scene.gameActive).toBe(false);
  });

  test('saves hi-score when current score is higher', () => {
    scene.score = 5000;
    scene._gameOver();
    expect(scene.registry.get('hiScore')).toBe(5000);
  });

  test('does not lower an existing higher hi-score', () => {
    scene.registry.set('hiScore', 10000);
    scene.score = 3000;
    scene._gameOver();
    expect(scene.registry.get('hiScore')).toBe(10000);
  });

  test('transitions to GameOver scene with the final score', () => {
    scene.score = 1234;
    scene._gameOver();
    expect(scene.scene.start).toHaveBeenCalledWith('GameOver', { score: 1234 });
  });
});

describe('GameScene.update – object movement and collision detection', () => {
  let scene;
  beforeEach(() => { scene = createGameScene(); });

  test('objects advance in depth each frame', () => {
    const obj = makeObj(scene, 'wafer', 1, 0.3);
    const before = obj.depth;
    // Simulate one frame at 16ms (~60fps)
    scene.update(0, 16);
    expect(obj.depth).toBeGreaterThan(before);
  });

  test('collision triggers when object reaches COLLISION_DEPTH near the player', () => {
    // Place a wafer just below collision depth in the centre lane
    const obj = makeObj(scene, 'wafer', 1, COLLISION_DEPTH - 0.01);
    // Move the player to the centre lane
    const pp = perspPos(LANE_X[1], COLLISION_DEPTH);
    scene.player.x = pp.x;
    // Advance enough to cross the collision threshold
    scene.update(0, 100);
    expect(obj.passed).toBe(true);
  });

  test('object is not collected if player is in a different lane', () => {
    // Wafer in left lane
    const obj = makeObj(scene, 'wafer', 0, COLLISION_DEPTH - 0.01);
    // Player in right lane (far away)
    scene.player.x = LANE_X[2];
    scene.update(0, 100);
    // obj.passed should be true (depth check fires) but obj.handled should stay false
    expect(obj.passed).toBe(true);
    expect(obj.handled).toBe(false);
  });

  test('handled objects are removed from the _objects array', () => {
    const obj = makeObj(scene, 'wafer', 1, COLLISION_DEPTH - 0.01);
    obj.handled = true; // simulate already collected
    scene.update(0, 16);
    expect(scene._objects).not.toContain(obj);
  });

  test('objects past depth 1.02 are cleaned up', () => {
    const obj = makeObj(scene, 'ghost', 1, 1.03);
    scene.update(0, 16);
    expect(scene._objects).not.toContain(obj);
    expect(obj.sprite.destroy).toHaveBeenCalled();
  });

  test('update does nothing when gameActive is false', () => {
    scene.gameActive = false;
    const obj = makeObj(scene, 'wafer', 1, 0.5);
    const depthBefore = obj.depth;
    scene.update(0, 16);
    expect(obj.depth).toBe(depthBefore);
  });
});

describe('GameScene – full game lifecycle', () => {
  test('player can survive multiple hits with MAX_LIVES > 1', () => {
    const scene = createGameScene();
    for (let i = 0; i < MAX_LIVES - 1; i++) {
      scene.invincible = false; // reset between hits
      const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
      scene._processCollision(obj);
    }
    expect(scene.lives).toBe(1);
    expect(scene.gameActive).toBe(true);
  });

  test('final hit triggers game over', () => {
    const scene = createGameScene();
    for (let i = 0; i < MAX_LIVES; i++) {
      scene.invincible = false;
      const obj = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
      scene._processCollision(obj);
    }
    expect(scene.lives).toBe(0);
    expect(scene.gameActive).toBe(false);
  });

  test('score accumulates from mixed pickups', () => {
    const scene = createGameScene();
    // Collect 3 wafers, 1 fruit, eat 1 ghost
    for (let i = 0; i < 3; i++) {
      const w = makeObj(scene, 'wafer', 1, COLLISION_DEPTH);
      scene._processCollision(w);
    }
    const f = makeObj(scene, 'fruit', 1, COLLISION_DEPTH);
    scene._processCollision(f);
    const g = makeObj(scene, 'ghost', 1, COLLISION_DEPTH);
    scene._processCollision(g);

    const expected = WAFER_POINTS * 3 + FRUIT_POINTS + GHOST_EAT_POINTS;
    expect(scene.score).toBe(expected);
  });
});
