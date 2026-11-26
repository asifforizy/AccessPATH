/**
 * Copies MapLibre's self-contained worker into `public/vendor/`.
 *
 * Runs before `dev` and `build` (see package.json) so the static worker stays
 * in sync with the installed maplibre-gl version. See src/lib/maplibre.ts for
 * why the worker must be served as a plain static file.
 */

import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(
  root,
  "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
);
const targetDirectory = path.join(root, "public/vendor");
const target = path.join(targetDirectory, "maplibre-gl-worker.js");

await mkdir(targetDirectory, { recursive: true });
await copyFile(source, target);

console.log("MapLibre worker copied to public/vendor/maplibre-gl-worker.js");
