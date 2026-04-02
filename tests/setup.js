/**
 * Jest setup – provides a minimal Phaser 3 mock so that game.js can be
 * required in a Node / Jest environment without a real browser or canvas.
 *
 * Only the surface area actually touched by game.js is stubbed.
 */
'use strict';

/* ---- tiny helpers ---- */
const noop = () => {};
const identity = (v) => v;
const chainable = () => new Proxy({}, { get: () => chainable });

/** Returns an object whose every method/property returns itself (for fluent APIs). */
function fluentStub () {
  const handler = {
    get (_target, _prop) {
      if (_prop === 'then') return undefined;          // prevent Promise detection
      return (..._args) => new Proxy({}, handler);      // methods return new stubs
    },
  };
  return new Proxy({}, handler);
}

/* ---- Phaser mock ---- */
const Phaser = {
  AUTO: 0,
  Scene: class Scene {
    constructor (cfg) { this.key = cfg && cfg.key; }
  },
  Math: {
    Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    DegToRad: (deg) => (deg * Math.PI) / 180,
  },
  Utils: {
    Array: {
      GetRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],
    },
  },
  Game: class Game { constructor () {} },
};

global.Phaser = Phaser;

/* ---- Stub `window` for the load-event listener at EOF of game.js ---- */
if (typeof window === 'undefined') {
  global.window = { addEventListener: noop };
}

/* ---- SoundManager mock (loaded before game.js) ---- */
global.SoundManager = {
  init: noop,
  playWaka: noop,
  playEatGhost: noop,
  playPowerUp: noop,
  playDeath: noop,
  playGameOver: noop,
  playFruit: noop,
  startMusic: noop,
  stopMusic: noop,
  isSfxOn: () => true,
  isMusicOn: () => true,
  toggleSfx: () => true,
  toggleMusic: () => true,
  destroy: noop,
};
