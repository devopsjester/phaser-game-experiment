/**
 * Advanced tests for GameOverScene – ghost animations, new record display,
 * and detailed create() behavior.
 */
'use strict';

const { GameOverScene, GAME_W, GAME_H } = require('../src/game');

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
    destroy: jest.fn(),
    text: '',
  };
}

function createGameOverScene (score, hiScore) {
  const scene = new GameOverScene();

  scene.scale = { width: GAME_W, height: GAME_H };
  scene.add = {
    graphics: jest.fn(() => ({
      lineStyle: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
    })),
    rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis() })),
    text: jest.fn(() => mockText()),
    image: jest.fn(() => ({
      x: 0, y: 0,
      setOrigin: jest.fn().mockReturnThis(),
    })),
  };
  scene.tweens = {
    add: jest.fn((cfg) => {
      // Store the config so we can test onRepeat
      scene._lastTweenCfg = cfg;
    }),
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

  scene.init({ score });
  return scene;
}

describe('GameOverScene – advanced create behavior', () => {
  test('displays GAME OVER text', () => {
    const scene = createGameOverScene(100);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('GAME  OVER');
  });

  test('displays final score formatted with leading zeros', () => {
    const scene = createGameOverScene(1234);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('001234');
  });

  test('displays hi-score from registry', () => {
    const scene = createGameOverScene(100, 5000);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('005000');
  });

  test('displays NEW RECORD text when score equals hi-score', () => {
    const scene = createGameOverScene(5000, 5000);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('*** NEW RECORD! ***');
  });

  test('displays NEW RECORD text when score exceeds hi-score', () => {
    const scene = createGameOverScene(6000, 5000);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('*** NEW RECORD! ***');
  });

  test('does not display NEW RECORD when score is lower than hi-score', () => {
    const scene = createGameOverScene(100, 5000);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).not.toContain('*** NEW RECORD! ***');
  });

  test('does not display NEW RECORD when score is 0', () => {
    const scene = createGameOverScene(0, 0);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).not.toContain('*** NEW RECORD! ***');
  });

  test('ghost images are added for animation', () => {
    const scene = createGameOverScene(100);
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

  test('ghost animation tween includes onRepeat callback', () => {
    const scene = createGameOverScene(100);
    scene.create();
    // tweens.add is called multiple times; at least one should have onRepeat
    const tweenCalls = scene.tweens.add.mock.calls;
    const hasOnRepeat = tweenCalls.some(c => c[0] && typeof c[0].onRepeat === 'function');
    expect(hasOnRepeat).toBe(true);
  });

  test('ghost animation onRepeat resets ghost position', () => {
    const scene = createGameOverScene(100);
    const ghost = { x: 200, y: 500 };
    scene.add.image.mockReturnValue(ghost);
    scene.create();

    // Find tweens with onRepeat
    const tweenCalls = scene.tweens.add.mock.calls;
    const repeatTween = tweenCalls.find(c => c[0] && typeof c[0].onRepeat === 'function');
    if (repeatTween) {
      repeatTween[0].onRepeat();
      expect(ghost.x).toBe(-30);
    }
  });

  test('displays CLICK TO CONTINUE text', () => {
    const scene = createGameOverScene(100);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('CLICK TO CONTINUE');
  });

  test('displays 1 PLAYER text', () => {
    const scene = createGameOverScene(100);
    scene.create();
    const textCalls = scene.add.text.mock.calls;
    const texts = textCalls.map(c => c[2]);
    expect(texts).toContain('1 PLAYER');
  });

  test('CRT scanline effect is applied', () => {
    const scene = createGameOverScene(100);
    scene.create();
    // Many rectangles are added for the scanline effect
    expect(scene.add.rectangle.mock.calls.length).toBeGreaterThan(1);
  });
});

describe('GameOverScene.init – edge cases', () => {
  test('handles undefined data gracefully', () => {
    const scene = new GameOverScene();
    scene.init({});
    expect(scene.finalScore).toBe(0);
  });

  test('handles large scores', () => {
    const scene = new GameOverScene();
    scene.init({ score: 999999 });
    expect(scene.finalScore).toBe(999999);
  });
});
