import { appearance } from "./data.js";

// x+ is vehicle forward; positive z rotation folds the +x hood toward x-.
// Reversing progress retraces tilt -> slide, so the cover never slides while tilted.
export function batteryMotion(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const slideEnd = 0.35;
  return {
    slide: appearance.hoodSlideDistance * Math.min(p / slideEnd, 1),
    angle:
      ((appearance.hoodFoldAngle * Math.PI) / 180) *
      Math.max((p - slideEnd) / (1 - slideEnd), 0),
    phase:
      p === 0
        ? "closed"
        : p === 1
          ? "open"
          : p <= slideEnd
            ? "sliding"
            : "folding",
  };
}
