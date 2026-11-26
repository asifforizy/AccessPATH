import { MapPin } from "lucide-react";

import { mosaicOffset, osmTileUrl } from "@/lib/geo";

const TILE_SIZE = 256;
const MOSAIC = 3;
const ZOOM = 15;

interface LocationMapPreviewProps {
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Static OpenStreetMap preview built from a 3×3 tile mosaic, positioned so the
 * place sits exactly in the middle. No MapLibre bundle on the details page.
 */
export function LocationMapPreview({
  latitude,
  longitude,
  name,
}: LocationMapPreviewProps) {
  const { tileX, tileY, offsetX, offsetY } = mosaicOffset(
    latitude,
    longitude,
    ZOOM,
  );

  const placeX = ((MOSAIC - 1) / 2) * TILE_SIZE + offsetX;
  const placeY = ((MOSAIC - 1) / 2) * TILE_SIZE + offsetY;

  const tiles = Array.from({ length: MOSAIC * MOSAIC }, (_, index) => {
    const row = Math.floor(index / MOSAIC);
    const col = index % MOSAIC;
    return {
      key: `${tileX - 1 + col}:${tileY - 1 + row}`,
      row,
      col,
      url: osmTileUrl(ZOOM, tileX - 1 + col, tileY - 1 + row),
    };
  });

  return (
    <div
      role="img"
      aria-label={`Map preview showing the location of ${name}`}
      className="relative h-44 overflow-hidden rounded-xl bg-muted"
    >
      {/* Tile inversions keep the raster map readable in dark mode. */}
      <div
        className="absolute dark:brightness-90 dark:contrast-90 dark:hue-rotate-180 dark:invert"
        style={{
          width: MOSAIC * TILE_SIZE,
          height: MOSAIC * TILE_SIZE,
          left: `calc(50% - ${placeX}px)`,
          top: `calc(50% - ${placeY}px)`,
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.key}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: tile.col * TILE_SIZE,
              top: tile.row * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundImage: `url(${tile.url})`,
              backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
              backgroundRepeat: "no-repeat",
            }}
          />
        ))}
      </div>

      <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-primary drop-shadow-md">
        <MapPin aria-hidden="true" className="size-8 fill-current" />
      </span>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-foreground/10 ring-inset"
      />

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute right-1 bottom-1 rounded bg-background/85 px-1 text-[10px] text-muted-foreground hover:text-foreground"
      >
        © OpenStreetMap
      </a>
    </div>
  );
}
