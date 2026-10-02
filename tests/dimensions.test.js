import test from "node:test";
import assert from "node:assert/strict";
import {
  dimensions as d,
  axlePositions,
  validateDimensions,
} from "../src/data.js";

test("supplied dimensions satisfy the bumper/axle contract", () => {
  assert.doesNotThrow(() => validateDimensions(d));
  const { front, rear } = axlePositions();
  assert.equal(front - rear, 410);
  assert.equal(d.length / 2 - front, 190);
  assert.equal(d.length / 2 - rear, 600);
  assert.equal(rear + d.length / 2, 340);
  assert.ok(Math.abs(Math.PI * d.wheelDiameter - d.wheelCircumference) < 0.1);
});
test("contradictory measurements fail instead of silently changing geometry", () => {
  assert.throws(() => validateDimensions({ ...d, wheelbase: 420 }), /일치/);
  assert.throws(
    () => validateDimensions({ ...d, frontBumperToRearAxle: 610 }),
    /일치/,
  );
  assert.throws(
    () => validateDimensions({ ...d, wheelCircumference: 280 }),
    /일치/,
  );
  for (const value of [NaN, Infinity, 0, -1])
    assert.throws(
      () => validateDimensions({ ...d, width: value }),
      /양의 유한수/,
    );
});
