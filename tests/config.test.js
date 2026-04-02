/**
 * Tests for the Phaser game configuration object.
 */
'use strict';

const {
  config,
  GAME_W, GAME_H,
  BootScene, MenuScene, GameScene, GameOverScene,
} = require('../src/game');

describe('Phaser config', () => {
  test('config uses the correct canvas dimensions', () => {
    expect(config.width).toBe(GAME_W);
    expect(config.height).toBe(GAME_H);
  });

  test('config specifies a black background', () => {
    expect(config.backgroundColor).toBe('#000000');
  });

  test('config targets the game-container element', () => {
    expect(config.parent).toBe('game-container');
  });

  test('scenes are registered in the correct order', () => {
    expect(config.scene).toHaveLength(4);
    expect(config.scene[0]).toBe(BootScene);
    expect(config.scene[1]).toBe(MenuScene);
    expect(config.scene[2]).toBe(GameScene);
    expect(config.scene[3]).toBe(GameOverScene);
  });

  test('config uses Phaser.AUTO renderer', () => {
    expect(config.type).toBe(Phaser.AUTO);
  });
});
