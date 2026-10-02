import test from "node:test";
import assert from "node:assert/strict";
import { batteryMotion } from "../src/battery-motion.js";

test("raised roof cover slides forward before it folds backwards", () => {
  const closed = batteryMotion(0);
  assert.equal(closed.slide, 0);
  assert.equal(closed.angle, 0);
  const sliding = batteryMotion(0.2);
  assert.ok(sliding.slide > 0);
  assert.equal(sliding.angle, 0, "No hinge rotation during the forward slide");
  const transition = batteryMotion(0.35);
  const folding = batteryMotion(0.7);
  const opened = batteryMotion(1);
  assert.equal(
    folding.slide,
    transition.slide,
    "Slide completes before the tilt",
  );
  assert.ok(
    folding.angle > 0,
    "Positive z rotation of a +x shell tilts toward the rear",
  );
  assert.ok(
    opened.angle > Math.PI / 2,
    "The opened hood folds past vertical toward the rear",
  );
  assert.equal(opened.slide, transition.slide);
  assert.equal(batteryMotion(-1).slide, 0);
  assert.deepEqual(batteryMotion(2), opened);
});

test("closing follows the same path in reverse without hysteresis", () => {
  const samples = [0, 0.2, 0.35, 0.5, 0.8, 1];
  const opening = samples.map(batteryMotion);
  const closing = [...samples].reverse().map(batteryMotion).reverse();
  assert.deepEqual(opening, closing);
});
