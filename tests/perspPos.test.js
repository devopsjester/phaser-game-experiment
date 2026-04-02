/**
 * Tests for the perspPos() perspective helper function.
 *
 * perspPos(laneX, depth) maps a lane X position and a depth (0 = horizon,
 * 1 = player plane) to screen coordinates {x, y, scale}.
 */
'use strict';

const {
  perspPos,
  VP_X, VP_Y, PLAYER_Y,
  GAME_W, GAME_H,
  LANE_X, ROAD_L, ROAD_R,
} = require('../src/game');

describe('perspPos – perspective projection helper', () => {
  test('at depth 0 (horizon) every lane collapses to the vanishing point', () => {
    LANE_X.forEach((lx) => {
      const p = perspPos(lx, 0);
      expect(p.x).toBeCloseTo(VP_X, 5);
      expect(p.y).toBeCloseTo(VP_Y, 5);
      expect(p.scale).toBeCloseTo(0.12, 5);
    });
  });

  test('at depth 1 (player plane) x equals the lane centre and y equals PLAYER_Y', () => {
    LANE_X.forEach((lx) => {
      const p = perspPos(lx, 1);
      expect(p.x).toBeCloseTo(lx, 5);
      expect(p.y).toBeCloseTo(PLAYER_Y, 5);
      expect(p.scale).toBeCloseTo(1.0, 5);
    });
  });

  test('at depth 0.5 values are halfway between horizon and player plane', () => {
    const lx = LANE_X[1]; // centre lane
    const p = perspPos(lx, 0.5);
    expect(p.x).toBeCloseTo(VP_X + (lx - VP_X) * 0.5, 5);
    expect(p.y).toBeCloseTo(VP_Y + (PLAYER_Y - VP_Y) * 0.5, 5);
    expect(p.scale).toBeCloseTo(0.12 + 0.88 * 0.5, 5);
  });

  test('scale increases linearly with depth', () => {
    const lx = LANE_X[0];
    const s1 = perspPos(lx, 0.25).scale;
    const s2 = perspPos(lx, 0.50).scale;
    const s3 = perspPos(lx, 0.75).scale;
    // The differences should be equal (linear)
    expect(s2 - s1).toBeCloseTo(s3 - s2, 5);
  });

  test('x spread increases with depth (objects appear wider near the player)', () => {
    const left  = LANE_X[0];
    const right = LANE_X[2];
    const spread025 = perspPos(right, 0.25).x - perspPos(left, 0.25).x;
    const spread075 = perspPos(right, 0.75).x - perspPos(left, 0.75).x;
    expect(spread075).toBeGreaterThan(spread025);
  });

  test('vanishing-point centre lane stays on screen centre at all depths', () => {
    // VP_X is defined as GAME_W / 2 and centre lane is the middle of the road
    for (let d = 0; d <= 1; d += 0.1) {
      const p = perspPos(VP_X, d);
      expect(p.x).toBeCloseTo(VP_X, 5);
    }
  });
});
