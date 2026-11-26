/** Small geo helpers used by the location details page (no client JS needed). */

const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;

export const clampLatitude = (latitude: number) =>
  Math.min(MAX_LATITUDE, Math.max(-MAX_LATITUDE, latitude));

/** Web Mercator absolute pixel position of a coordinate at a zoom level. */
export const lngLatToPixel = (
  latitude: number,
  longitude: number,
  zoom: number,
) => {
  const scale = 2 ** zoom * TILE_SIZE;
  const lat = (clampLatitude(latitude) * Math.PI) / 180;

  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * scale,
  };
};

/**
 * Position of a coordinate inside a `size`×`size` mosaic of raster tiles that
 * starts at `tileX - (size - 1) / 2`. Used to centre a static map preview
 * exactly on the place without loading MapLibre.
 */
export const mosaicOffset = (
  latitude: number,
  longitude: number,
  zoom: number,
) => {
  const { x, y } = lngLatToPixel(latitude, longitude, zoom);
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);

  return {
    tileX,
    tileY,
    offsetX: x - tileX * TILE_SIZE,
    offsetY: y - tileY * TILE_SIZE,
  };
};

export const osmTileUrl = (zoom: number, tileX: number, tileY: number) => {
  const tilesPerAxis = 2 ** zoom;
  const x = ((tileX % tilesPerAxis) + tilesPerAxis) % tilesPerAxis;
  return `https://tile.openstreetmap.org/${zoom}/${x}/${tileY}.png`;
};

export const osmDirectionsUrl = (
  latitude?: number | null,
  longitude?: number | null,
) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${latitude},${longitude}`;
};

export const osmPlaceUrl = (latitude: number, longitude: number, zoom = 17) =>
  `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
