/**
 * Tests for BootScene – validates texture generation and scene transition.
 */
'use strict';

const { BootScene } = require('../src/game');

/** Wire up a minimal BootScene with mocks. */
function createBootScene () {
  const scene = new BootScene();

  const graphicsMock = {
    clear: jest.fn().mockReturnThis(),
    fillStyle: jest.fn().mockReturnThis(),
    fillCircle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    fillTriangle: jest.fn().mockReturnThis(),
    fillEllipse: jest.fn().mockReturnThis(),
    fillPath: jest.fn().mockReturnThis(),
    lineStyle: jest.fn().mockReturnThis(),
    lineBetween: jest.fn().mockReturnThis(),
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

  scene.make = {
    graphics: jest.fn(() => graphicsMock),
  };
  scene.scene = {
    start: jest.fn(),
  };

  scene._graphicsMock = graphicsMock;
  return scene;
}

describe('BootScene', () => {
  test('constructor sets key to "Boot"', () => {
    const scene = new BootScene();
    expect(scene.key).toBe('Boot');
  });

  test('create generates all expected textures', () => {
    const scene = createBootScene();
    scene.create();

    const genCalls = scene._graphicsMock.generateTexture.mock.calls;
    const textureNames = genCalls.map(c => c[0]);

    // Player textures
    expect(textureNames).toContain('pacman_open');
    expect(textureNames).toContain('pacman_closed');
    expect(textureNames).toContain('pacman_back');
    expect(textureNames).toContain('pacman_back_power');

    // Ghost textures
    expect(textureNames).toContain('ghost_red');
    expect(textureNames).toContain('ghost_pink');
    expect(textureNames).toContain('ghost_cyan');
    expect(textureNames).toContain('ghost_orange');
    expect(textureNames).toContain('ghost_scared');
    expect(textureNames).toContain('ghost_scared_flash');

    // Collectible textures
    expect(textureNames).toContain('wafer');
    expect(textureNames).toContain('fruit');

    // HUD texture
    expect(textureNames).toContain('life_icon');
  });

  test('create transitions to Menu scene', () => {
    const scene = createBootScene();
    scene.create();
    expect(scene.scene.start).toHaveBeenCalledWith('Menu');
  });

  test('create destroys the graphics object after texture generation', () => {
    const scene = createBootScene();
    scene.create();
    expect(scene._graphicsMock.destroy).toHaveBeenCalled();
  });

  test('pacman_open texture is 48x48', () => {
    const scene = createBootScene();
    scene.create();
    const genCalls = scene._graphicsMock.generateTexture.mock.calls;
    const pacOpen = genCalls.find(c => c[0] === 'pacman_open');
    expect(pacOpen[1]).toBe(48);
    expect(pacOpen[2]).toBe(48);
  });

  test('wafer texture is 16x16', () => {
    const scene = createBootScene();
    scene.create();
    const genCalls = scene._graphicsMock.generateTexture.mock.calls;
    const wafer = genCalls.find(c => c[0] === 'wafer');
    expect(wafer[1]).toBe(16);
    expect(wafer[2]).toBe(16);
  });

  test('fruit texture is 36x34', () => {
    const scene = createBootScene();
    scene.create();
    const genCalls = scene._graphicsMock.generateTexture.mock.calls;
    const fruit = genCalls.find(c => c[0] === 'fruit');
    expect(fruit[1]).toBe(36);
    expect(fruit[2]).toBe(34);
  });

  test('life_icon texture is 24x24', () => {
    const scene = createBootScene();
    scene.create();
    const genCalls = scene._graphicsMock.generateTexture.mock.calls;
    const lifeIcon = genCalls.find(c => c[0] === 'life_icon');
    expect(lifeIcon[1]).toBe(24);
    expect(lifeIcon[2]).toBe(24);
  });
});
