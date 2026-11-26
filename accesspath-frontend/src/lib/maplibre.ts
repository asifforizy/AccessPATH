import type * as MapLibre from "maplibre-gl";

/**
 * Loads MapLibre GL once, with a worker URL that survives Turbopack.
 *
 * Turbopack emits the bundled worker chunk as an HTML fallback in dev, which
 * makes MapLibre fail with "Worker failed to load" — and without its worker,
 * GeoJSON sources never parse, so no markers or clusters ever render.
 *
 * `scripts/copy-maplibre.mjs` copies MapLibre's self-contained worker into
 * `public/vendor/` as `.js` (Next serves `.mjs` from `public` as HTML), and we
 * point MapLibre at that static file instead.
 */

let loader: Promise<typeof MapLibre> | null = null;

export const loadMapLibre = (): Promise<typeof MapLibre> => {
  loader ??= import("maplibre-gl").then((maplibre) => {
    maplibre.setWorkerUrl("/vendor/maplibre-gl-worker.js");
    return maplibre;
  });

  return loader;
};
