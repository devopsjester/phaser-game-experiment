/**
 * Tests for the GameOverScene – validates initialisation and scene transitions.
 */
'use strict';

const { GameOverScene } = require('../src/game');

/** Wire up a minimal GameOverScene with mocks. */
function createGameOverScene (score) {
  const scene = new GameOverScene();

  scene.scale = { width: 480, height: 640 };
  scene.add = {
    graphics: jest.fn(() => ({
      lineStyle: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
    })),
    rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis() })),
    text: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
    })),
    image: jest.fn(() => ({
      x: 0, y: 0,
      setOrigin: jest.fn().mockReturnThis(),
    })),
  };
  scene.tweens = {
    add: jest.fn(),
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

  scene.init({ score });
  return scene;
}

describe('GameOverScene.init', () => {
  test('stores the final score from data', () => {
    const scene = createGameOverScene(4200);
    expect(scene.finalScore).toBe(4200);
  });

  test('defaults to 0 when no score is provided', () => {
    const scene = new GameOverScene();
    scene.init({});
    expect(scene.finalScore).toBe(0);
  });
});

describe('GameOverScene.create', () => {
  test('registers a pointerdown handler for scene restart', () => {
    const scene = createGameOverScene(100);
    scene.create();
    expect(scene.input.once).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
      scene,
    );
  });

  test('pointerdown navigates back to Menu scene', () => {
    const scene = createGameOverScene(100);
    scene.create();
    // Extract and invoke the registered callback
    const [, handler, ctx] = scene.input.once.mock.calls[0];
    handler.call(ctx);
    expect(scene.scene.start).toHaveBeenCalledWith('Menu');
  });
});
