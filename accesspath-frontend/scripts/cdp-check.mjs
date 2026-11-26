/**
 * Headless browser check (Chrome/Edge via CDP) for the map explorer.
 *
 * Usage:
 *   node scripts/cdp-check.mjs <url> <accessToken> <out.png> [clickX] [clickY]
 *
 * Prints runtime/console diagnostics and an optional click result, and saves a
 * screenshot so the map can be inspected visually.
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const [url, token, outFile, clickX, clickY] = process.argv.slice(2);
const PORT = 9333;
const BROWSER = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = spawn(
  BROWSER,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=" + process.env.TEMP + "\\cdp-profile",
    "--window-size=1440,960",
    "--no-first-run",
    "--no-default-browser-check",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const waitForVersion = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return;
    } catch {
      // not ready
    }
    await sleep(250);
  }
  throw new Error("DevTools endpoint did not start");
};

const main = async () => {
  await waitForVersion();

  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const consoleLines = [];
  let messageId = 0;

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++messageId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }

    if (message.method === "Runtime.consoleAPICalled") {
      consoleLines.push(
        `${message.params.type}: ${message.params.args
          .map((arg) => arg.value ?? arg.description ?? "")
          .join(" ")}`,
      );
    }

    if (message.method === "Runtime.exceptionThrown") {
      consoleLines.push(
        `exception: ${message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text}`,
      );
    }

    if (message.method === "Network.responseReceived") {
      const response = message.params.response;
      if (response.status >= 400) {
        consoleLines.push(
          `http ${response.status}: ${response.url.slice(0, 140)}`,
        );
      }
    }

    if (message.method === "Log.entryAdded") {
      consoleLines.push(
        `log[${message.params.entry.level}]: ${message.params.entry.text}`,
      );
    }
  });

  await new Promise((resolve) => socket.addEventListener("open", resolve));

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");

  const origin = new URL(url).origin;
  await send("Network.setCookie", {
    name: "accessToken",
    value: token,
    domain: new URL(url).hostname,
    path: "/",
    url: origin,
  });

  await send("Page.navigate", { url });
  await sleep(9000);

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result.result?.value;
  };

  const diagnostics = await evaluate(`(() => {
		const canvas = document.querySelector("canvas.maplibregl-canvas");
		const sidebarCount = document.body.innerText.match(/(\\d+)\\s+(places in view|search results|nearby places)/i);
		const labels = [...document.querySelectorAll("[aria-label]")]
			.map(el => el.getAttribute("aria-label"))
			.filter(Boolean);
		const m = window.__accessPathMap;
		const mapInfo = m ? {
			zoom: Number(m.getZoom().toFixed(2)),
			center: m.getCenter().toArray().map(v => Number(v.toFixed(4))),
			layers: m.getStyle().layers.map(l => l.id),
			images: ["place-BUILDING","place-PARK","place-OTHER"].map(n => [n, m.hasImage(n)]),
			source: (() => { const src = m.getSource("places"); return src ? { type: src.type, features: (src._data?.features ?? []).length, cluster: src.cluster } : null; })(),
			visibility: ["place-markers","places-clusters","places-cluster-count","place-selected","user-dot"].map(id => m.getLayer(id) ? [id, m.getLayoutProperty(id, "visibility") ?? "visible"] : [id, "MISSING"]),
			sources: Object.keys(m.getStyle().sources ?? {}),
			serializedData: (() => { try { const s = m.getSource("places").serialize(); return (s.data?.features ?? []).length; } catch (e) { return "err:" + e.message; } })(),
			canvasCount: document.querySelectorAll("canvas.maplibregl-canvas").length,
			renderedCount: (() => { try { return m.queryRenderedFeatures().length; } catch (e) { return "err"; } })(),
		} : null;

		return {
			mapInfo,
			hasCanvas: Boolean(canvas),
			canvasSize: canvas ? [canvas.width, canvas.height] : null,
			countText: sidebarCount ? sidebarCount[0] : null,
			buttons: labels.filter(l => l.length < 60).slice(0, 25),
			markerCanvasPixels: (() => {
				if (!canvas) return null;
				try {
					const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
					return gl ? "webgl-ok" : "no-webgl";
				} catch (error) {
					return "webgl-error";
				}
			})(),
		};
	})()`);

  console.log("DIAGNOSTICS", JSON.stringify(diagnostics, null, 2));

  let targetX = clickX ? Number(clickX) : null;
  let targetY = clickY ? Number(clickY) : null;

  if (clickX === "auto") {
    const point = await evaluate(`(() => {
			const m = window.__accessPathMap;
			const canvas = document.querySelector("canvas.maplibregl-canvas");
			const features = m.queryRenderedFeatures({ layers: ["place-markers"] });
			const feature = features[0];
			if (!feature || !canvas) return null;
			const projected = m.project(feature.geometry.coordinates);
			const rect = canvas.getBoundingClientRect();
			return {
				x: Math.round(rect.left + projected.x),
				y: Math.round(rect.top + projected.y),
				name: feature.properties.name,
			};
		})()`);
    console.log("CLICK_TARGET", JSON.stringify(point));
    targetX = point?.x ?? null;
    targetY = point?.y ?? null;
  }

  if (targetX && targetY) {
    const clickX = targetX;
    const clickY = targetY;
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: Number(clickX),
      y: Number(clickY),
    });
    await send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: Number(clickX),
      y: Number(clickY),
      button: "left",
      clickCount: 1,
    });
    await send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: Number(clickX),
      y: Number(clickY),
      button: "left",
      clickCount: 1,
    });
    await sleep(2500);

    const afterClick = await evaluate(`(() => ({
			panel: document.querySelector('section[aria-label^="Details for"]')?.getAttribute("aria-label") ?? null,
			cursor: document.querySelector("canvas.maplibregl-canvas")?.style.cursor ?? null,
		}))()`);
    console.log("AFTER_CLICK", JSON.stringify(afterClick, null, 2));
  }

  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(outFile, Buffer.from(screenshot.data, "base64"));

  console.log("CONSOLE", consoleLines.slice(-25).join("\n"));
  socket.close();
  browser.kill();
};

main().catch((error) => {
  console.error("FAILED", error.message);
  browser.kill();
  process.exit(1);
});
