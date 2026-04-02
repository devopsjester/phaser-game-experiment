/**
 * Tests for game constants – validate relationships and invariants
 * that the gameplay logic depends on.
 */
'use strict';

const {
  GAME_W, GAME_H,
  VP_X, VP_Y, PLAYER_Y,
  ROAD_L, ROAD_R, LANE_X,
  DEPTH_SPEED_BASE, DEPTH_SPEED_MAX,
  COLLISION_DEPTH, COLLISION_TOL,
  POWER_DURATION, POWER_WARNING_TIME,
  MAX_LIVES,
  WAFER_POINTS, GHOST_EAT_POINTS, FRUIT_POINTS,
  SPAWN_INTERVAL_BASE, SPAWN_INTERVAL_MIN,
  DIFFICULTY_INTERVAL,
} = require('../src/game');

describe('canvas & viewport constants', () => {
  test('canvas dimensions are positive integers', () => {
    expect(GAME_W).toBeGreaterThan(0);
    expect(GAME_H).toBeGreaterThan(0);
    expect(Number.isInteger(GAME_W)).toBe(true);
    expect(Number.isInteger(GAME_H)).toBe(true);
  });

  test('vanishing point is horizontally centred', () => {
    expect(VP_X).toBe(GAME_W / 2);
  });

  test('horizon (VP_Y) is above the player (PLAYER_Y)', () => {
    expect(VP_Y).toBeLessThan(PLAYER_Y);
  });

  test('PLAYER_Y is within the canvas', () => {
    expect(PLAYER_Y).toBeGreaterThan(0);
    expect(PLAYER_Y).toBeLessThan(GAME_H);
  });
});

describe('road & lane constants', () => {
  test('road edges are within the canvas', () => {
    expect(ROAD_L).toBeGreaterThanOrEqual(0);
    expect(ROAD_R).toBeLessThanOrEqual(GAME_W);
  });

  test('there are exactly 3 lanes', () => {
    expect(LANE_X).toHaveLength(3);
  });

  test('lanes are within the road boundaries', () => {
    LANE_X.forEach((lx) => {
      expect(lx).toBeGreaterThan(ROAD_L);
      expect(lx).toBeLessThan(ROAD_R);
    });
  });

  test('lanes are ordered left-to-right and spaced apart', () => {
    expect(LANE_X[0]).toBeLessThan(LANE_X[1]);
    expect(LANE_X[1]).toBeLessThan(LANE_X[2]);
    // Spacing between adjacent lanes should be roughly equal (symmetric road)
    const gap1 = LANE_X[1] - LANE_X[0];
    const gap2 = LANE_X[2] - LANE_X[1];
    expect(gap1).toBeCloseTo(gap2, 0);
  });

  test('centre lane is at the horizontal midpoint of the road', () => {
    const roadMid = (ROAD_L + ROAD_R) / 2;
    expect(LANE_X[1]).toBeCloseTo(roadMid, 5);
  });
});

describe('depth & collision constants', () => {
  test('depth speed base is less than max', () => {
    expect(DEPTH_SPEED_BASE).toBeLessThan(DEPTH_SPEED_MAX);
  });

  test('both depth speeds are positive', () => {
    expect(DEPTH_SPEED_BASE).toBeGreaterThan(0);
    expect(DEPTH_SPEED_MAX).toBeGreaterThan(0);
  });

  test('collision fires near the player (depth close to 1)', () => {
    expect(COLLISION_DEPTH).toBeGreaterThan(0.5);
    expect(COLLISION_DEPTH).toBeLessThanOrEqual(1);
  });

  test('collision tolerance is positive', () => {
    expect(COLLISION_TOL).toBeGreaterThan(0);
  });
});

describe('gameplay constants', () => {
  test('power-up warning fires before the power-up expires', () => {
    expect(POWER_WARNING_TIME).toBeLessThan(POWER_DURATION);
    expect(POWER_WARNING_TIME).toBeGreaterThan(0);
  });

  test('player starts with a positive number of lives', () => {
    expect(MAX_LIVES).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_LIVES)).toBe(true);
  });

  test('scoring values are positive', () => {
    expect(WAFER_POINTS).toBeGreaterThan(0);
    expect(GHOST_EAT_POINTS).toBeGreaterThan(0);
    expect(FRUIT_POINTS).toBeGreaterThan(0);
  });

  test('ghost eating is worth more than wafers (risk/reward)', () => {
    expect(GHOST_EAT_POINTS).toBeGreaterThan(WAFER_POINTS);
  });

  test('spawn interval minimum is less than base', () => {
    expect(SPAWN_INTERVAL_MIN).toBeLessThan(SPAWN_INTERVAL_BASE);
    expect(SPAWN_INTERVAL_MIN).toBeGreaterThan(0);
  });

  test('difficulty ramp interval is positive', () => {
    expect(DIFFICULTY_INTERVAL).toBeGreaterThan(0);
  });
});
