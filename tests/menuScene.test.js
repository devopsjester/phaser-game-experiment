/**
 * Tests for MenuScene – validates scene creation, hi-score display,
 * sound toggle integration, and scene transition on click.
 */
'use strict';

const { MenuScene, GAME_W, GAME_H } = require('../src/game');

/** Create a minimal text mock that tracks on() registrations. */
function mockText () {
  return {
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    text: '',
    texture: { key: 'pacman_open' },
    setTexture: jest.fn(function (k) { this.texture = { key: k }; return this; }),
  };
}

/** Wire up a minimal MenuScene with mocks. */
function createMenuScene (hiScore) {
  const scene = new MenuScene();

  scene.scale = { width: GAME_W, height: GAME_H };
  scene.add = {
    rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis() })),
    graphics: jest.fn(() => ({
      lineStyle: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
    })),
    text: jest.fn(() => mockText()),
    image: jest.fn(() => ({
      x: 0, y: 0,
      setOrigin: jest.fn().mockReturnThis(),
      setTexture: jest.fn().mockReturnThis(),
      texture: { key: 'pacman_open' },
    })),
  };
  scene.tweens = {
    add: jest.fn(),
  };
  scene.time = {
    addEvent: jest.fn(() => ({ remove: jest.fn() })),
  };
  scene.input = {
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

  if (hiScore !== undefined) {
    scene.registry.set('hiScore', hiScore);
  }

  return scene;
}

describe('MenuScene', () => {
  test('constructor sets key to "Menu"', () => {
    const scene = new MenuScene();
    expect(scene.key).toBe('Menu');
  });

  test('create adds text elements for the game title', () => {
    const scene = createMenuScene();
    scene.create();
    // Should have called add.text multiple times for title, instructions, etc.
    expect(scene.add.text).toHaveBeenCalled();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]); // third arg is the text string
    expect(texts).toContain('PAC-DASH');
  });

  test('create displays hi-score from registry', () => {
    const scene = createMenuScene(5000);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const hiScoreTexts = textCalls.filter(c =>
      typeof c[2] === 'string' && c[2].includes('HI-SCORE')
    );
    expect(hiScoreTexts.length).toBeGreaterThan(0);
    expect(hiScoreTexts[0][2]).toContain('005000');
  });

  test('create displays 0 when no hi-score exists', () => {
    const scene = createMenuScene();
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const hiScoreTexts = textCalls.filter(c =>
      typeof c[2] === 'string' && c[2].includes('HI-SCORE')
    );
    expect(hiScoreTexts.length).toBeGreaterThan(0);
    expect(hiScoreTexts[0][2]).toContain('000000');
  });

  test('create registers a pointerdown handler', () => {
    const scene = createMenuScene();
    scene.create();
    expect(scene.input.once).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
    );
  });

  test('pointerdown initializes SoundManager and starts Game scene', () => {
    const scene = createMenuScene();
    jest.spyOn(SoundManager, 'init');
    scene.create();

    // Extract and invoke the registered callback
    const [, handler] = scene.input.once.mock.calls[0];
    handler.call(scene);

    expect(SoundManager.init).toHaveBeenCalled();
    expect(scene.scene.start).toHaveBeenCalledWith('Game');
    jest.restoreAllMocks();
  });

  test('create adds pac-man animation tween', () => {
    const scene = createMenuScene();
    scene.create();
    expect(scene.tweens.add).toHaveBeenCalled();
  });

  test('create adds ghost images', () => {
    const scene = createMenuScene();
    scene.create();
    const imageCalls = scene.add.image.mock.calls;
    const ghostTextures = imageCalls.map(c => c[2]).filter(t =>
      t && t.startsWith('ghost_')
    );
    expect(ghostTextures).toContain('ghost_red');
    expect(ghostTextures).toContain('ghost_pink');
    expect(ghostTextures).toContain('ghost_cyan');
    expect(ghostTextures).toContain('ghost_orange');
  });

  test('create sets up instruction text lines', () => {
    const scene = createMenuScene();
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('MOVE MOUSE SIDEWAYS');
    expect(texts).toContain('CLICK TO START');
  });

  test('create adds CRT scanline effect (rectangles)', () => {
    const scene = createMenuScene();
    scene.create();
    // Many rectangles are added for the scanline effect + background
    expect(scene.add.rectangle.mock.calls.length).toBeGreaterThan(1);
  });

  test('create adds blinking coin insert text', () => {
    const scene = createMenuScene();
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('** INSERT COIN **');
  });
});
