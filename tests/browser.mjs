import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const output = "docs/verification/screenshots";
await mkdir(output, { recursive: true });
const origin = process.env.VIEWER_URL || "http://127.0.0.1:5173";
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    !message.text().includes("fonts.googleapis")
  )
    errors.push(message.text());
});
try {
  await page.goto(origin);
  await page.locator('#canvas[data-ready="true"]').waitFor();
  assert.equal(await page.locator("#dimension-table tr").count(), 9);
  assert.equal(await page.locator(".photo-button").count(), 5);
  assert.equal(await page.locator(".sensor-row").count(), 4);
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
  for (const view of ["side", "front", "top", "perspective", "iso"]) {
    await page.locator(`[data-view="${view}"]`).click();
    assert.equal(
      await page.locator(`[data-view="${view}"]`).getAttribute("aria-pressed"),
      "true",
    );
    if (view === "side" || view === "top")
      await page
        .locator("#stage")
        .screenshot({ path: `${output}/${view}.png` });
  }
  await page.locator('[data-measure="axles"]').click();
  await page.locator('[data-view="side"]').click();
  assert.equal(
    await page.locator(".dimension-label.axle:not([hidden])").count(),
    5,
  );
  await page.locator("#stage").screenshot({ path: `${output}/axles.png` });
  await page.locator("#dimensions").uncheck();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".dimension-label:not(.sensor)")].every(
      (el) => el.hidden,
    ),
  );
  await page.locator("#sensors").uncheck();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".dimension-label.sensor")].every(
      (el) => el.hidden,
    ),
  );
  await page.locator('[data-view="iso"]').click();
  for (const [progress, name] of [
    [20, "battery-slide"],
    [75, "battery-fold"],
  ]) {
    await page.locator("#opening").evaluate((input, value) => {
      input.value = String(value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, progress);
    await page.waitForFunction(
      (value) =>
        document.querySelector("#canvas").dataset.batteryProgress ===
        String(value),
      progress,
    );
    await page.locator("#stage").screenshot({ path: `${output}/${name}.png` });
  }
  await page.locator("#opening").evaluate((input) => {
    input.value = "0";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(
    () => document.querySelector("#canvas").dataset.batteryPhase === "closed",
  );
  await page.locator("#battery-toggle").click();
  assert.equal(await page.locator("#opening").inputValue(), "100");
  await page.locator("#battery-remove").click();
  assert.equal(
    await page.locator("#battery-remove").getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("#battery-focus").click();
  await page.waitForFunction(
    () => document.querySelector("#canvas").dataset.packRemoved === "true",
  );
  await page.locator("#stage").screenshot({ path: `${output}/battery.png` });
  await page.locator("#battery-toggle").click();
  assert.equal(
    await page.locator("#battery-remove").getAttribute("aria-pressed"),
    "false",
  );
  await page.locator("#reset").click();
  await page.waitForFunction(
    () => document.querySelector("#canvas").dataset.batteryPhase === "closed",
  );
  assert.equal(await page.locator("#opening").inputValue(), "0");
  assert.ok(await page.locator("#dimensions").isChecked());
  assert.ok(await page.locator("#sensors").isChecked());
  await page.locator('[data-photo="0"]').click();
  assert.ok(await page.locator("#photo-dialog").isVisible());
  await page.keyboard.press("Escape");
  assert.ok(!(await page.locator("#photo-dialog").isVisible()));
  const images = await page
    .locator(".photo-button img")
    .evaluateAll((imgs) =>
      imgs.every((img) => img.complete && img.naturalWidth > 0),
    );
  assert.ok(images);
  // Test actual geometry independently from table and button text (dev server only).
  if (!process.env.SKIP_MODEL_CHECK) {
    const geometry = await page.evaluate(async () => {
      const THREE = await import("/node_modules/.vite/deps/three.js");
      const { buildBus, setBatteryOpening, setBatteryRemoval } = await import(
        "/src/model.js"
      );
      const bus = buildBus();
      const bounds = new THREE.Box3().setFromObject(bus.root);
      setBatteryOpening(bus.battery, 0.2);
      const partial = {
        x: bus.battery.lid.position.x,
        angle: bus.battery.lid.rotation.z,
      };
      setBatteryOpening(bus.battery, 0.35);
      const slid = bus.battery.lid.position.x;
      setBatteryOpening(bus.battery, 1);
      setBatteryRemoval(bus.battery, 1);
      return {
        size: bounds.getSize(new THREE.Vector3()).toArray(),
        minY: bounds.min.y,
        angle: bus.battery.lid.rotation.z,
        partial,
        slid,
        rest: bus.battery.lidRestX,
        openedX: bus.battery.lid.position.x,
        raised: bus.battery.pack.position.y > bus.battery.packRestY,
      };
    });
    assert.ok(
      Math.abs(geometry.size[0] - 940) < 0.01,
      JSON.stringify(geometry),
    );
    assert.ok(
      Math.abs(geometry.size[1] - 230) < 0.01,
      JSON.stringify(geometry),
    );
    assert.ok(
      Math.abs(geometry.size[2] - 180) < 0.01,
      JSON.stringify(geometry),
    );
    assert.ok(Math.abs(geometry.minY) < 0.01);
    assert.ok(geometry.partial.x > geometry.rest);
    assert.equal(geometry.partial.angle, 0);
    assert.equal(geometry.openedX, geometry.slid);
    assert.ok(geometry.angle > Math.PI / 2);
    assert.ok(geometry.raised);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#reset").click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  assert.equal(overflow, false);
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: `${output}/desktop-dark.png`, fullPage: true });
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
    "rgb(16, 20, 28)",
  );
  await page.emulateMedia({ colorScheme: "light" });
  const rect = await page.locator("#canvas").boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width / 2 + 40,
    rect.y + rect.height / 2 + 20,
  );
  await page.mouse.up();
  assert.equal(await page.locator("#view-name").textContent(), "FREE ORBIT");
  assert.deepEqual(errors, []);
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith("webgl") ? null : native.call(this, type, ...args);
    };
  });
  await fallback.goto(origin);
  await fallback
    .locator("#load-status")
    .filter({ hasText: "표시하지 못했습니다" })
    .waitFor();
  assert.equal(await fallback.locator("#dimension-table tr").count(), 9);
  assert.ok(await fallback.locator("#battery-toggle").isDisabled());
  await fallback.close();
  console.log(
    `PASS: 3D rendering, ${process.env.SKIP_MODEL_CHECK ? "geometry checked separately on dev server" : "geometry 940×180×230"}, five views, dimension toggles, battery opening/removal/reset, 5 photos, mobile layout, orbit, WebGL failure fallback.`,
  );
} finally {
  await browser.close();
}
