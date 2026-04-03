/**
 * Tests for createSoundToggles helper - validates that the sound toggle
 * buttons in scenes properly interact with SoundManager.
 *
 * createSoundToggles is not exported directly, so we test it indirectly
 * through GameScene (which calls it in _createHUD).
 */
'use strict';

const {
  GameScene,
  MenuScene,
  GAME_W, GAME_H,
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

/** Text mock that records on() handler registrations and tracks setText/setColor calls. */
function createTrackingTextMock () {
  const texts = [];
  const textFactory = jest.fn((x, y, label, style) => {
    const t = {
      _label: label,
      _x: x,
      _y: y,
      _handlers: {},
      setText: jest.fn(function (v) { this._label = v; return this; }),
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn(function (event, cb) { this._handlers[event] = cb; return this; }),
      destroy: jest.fn(),
      text: label,
      texture: { key: 'pacman_open' },
      setTexture: jest.fn().mockReturnThis(),
    };
    texts.push(t);
    return t;
  });
  return { textFactory, texts };
}

function createGameSceneWithTracking () {
  const scene = new GameScene();
  const { textFactory, texts } = createTrackingTextMock();

  scene.scale = { width: 480, height: 640 };
  scene.add = {
    graphics: jest.fn(() => mockGraphics()),
    rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis() })),
    text: textFactory,
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

  return { scene, texts };
}

describe('Sound toggle buttons in GameScene', () => {
  test('SFX toggle button is created with correct initial label', () => {
    const { texts } = createGameSceneWithTracking();
    const sfxBtn = texts.find(t => t._label === 'SFX:ON' || t._label === 'SFX:OFF');
    expect(sfxBtn).toBeDefined();
  });

  test('Music toggle button is created with correct initial label', () => {
    const { texts } = createGameSceneWithTracking();
    const musBtn = texts.find(t => t._label === 'MUS:ON' || t._label === 'MUS:OFF');
    expect(musBtn).toBeDefined();
  });

  test('SFX toggle button handler calls SoundManager.toggleSfx', () => {
    jest.spyOn(SoundManager, 'toggleSfx').mockReturnValue(false);
    const { texts } = createGameSceneWithTracking();
    const sfxBtn = texts.find(t => t._label === 'SFX:ON' || t._label === 'SFX:OFF');

    // Invoke the pointerdown handler
    if (sfxBtn._handlers.pointerdown) {
      sfxBtn._handlers.pointerdown({ event: { stopPropagation: jest.fn() } });
    }
    expect(SoundManager.toggleSfx).toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  test('Music toggle button handler calls SoundManager.toggleMusic', () => {
    jest.spyOn(SoundManager, 'toggleMusic').mockReturnValue(false);
    const { texts } = createGameSceneWithTracking();
    const musBtn = texts.find(t => t._label === 'MUS:ON' || t._label === 'MUS:OFF');

    // Invoke the pointerdown handler
    if (musBtn._handlers.pointerdown) {
      musBtn._handlers.pointerdown({ event: { stopPropagation: jest.fn() } });
    }
    expect(SoundManager.toggleMusic).toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  test('SFX toggle updates button text on toggle', () => {
    jest.spyOn(SoundManager, 'toggleSfx').mockReturnValue(false);
    const { texts } = createGameSceneWithTracking();
    const sfxBtn = texts.find(t => t._label === 'SFX:ON' || t._label === 'SFX:OFF');

    if (sfxBtn._handlers.pointerdown) {
      sfxBtn._handlers.pointerdown({ event: { stopPropagation: jest.fn() } });
    }
    expect(sfxBtn.setText).toHaveBeenCalledWith('SFX:OFF');
    jest.restoreAllMocks();
  });

  test('Music toggle updates button text on toggle', () => {
    jest.spyOn(SoundManager, 'toggleMusic').mockReturnValue(true);
    const { texts } = createGameSceneWithTracking();
    const musBtn = texts.find(t => t._label === 'MUS:ON' || t._label === 'MUS:OFF');

    if (musBtn._handlers.pointerdown) {
      musBtn._handlers.pointerdown({ event: { stopPropagation: jest.fn() } });
    }
    expect(musBtn.setText).toHaveBeenCalledWith('MUS:ON');
    jest.restoreAllMocks();
  });

  test('SFX toggle handler handles missing event.stopPropagation gracefully', () => {
    jest.spyOn(SoundManager, 'toggleSfx').mockReturnValue(true);
    const { texts } = createGameSceneWithTracking();
    const sfxBtn = texts.find(t => t._label === 'SFX:ON' || t._label === 'SFX:OFF');

    // Call with no ptr argument to test the guard
    if (sfxBtn._handlers.pointerdown) {
      expect(() => sfxBtn._handlers.pointerdown(undefined)).not.toThrow();
    }
    jest.restoreAllMocks();
  });
});
