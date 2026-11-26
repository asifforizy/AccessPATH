import type {
  LayerSpecification,
  Map as MapLibreMap,
  StyleSpecification,
} from "maplibre-gl";

import type { IMapPalette } from "@/types/map.types";
import type { CategoryGroup, IPlaceGeoFeature } from "@/types/place.types";

/**
 * Marker icons are generated at runtime from the active theme tokens, so the
 * map follows light/dark mode without hardcoded colours.
 *
 * Categories are distinguished by glyph shape (not colour alone), and the
 * sidebar list repeats every marker as text.
 */

export const PLACE_SOURCE_ID = "places";
export const USER_SOURCE_ID = "user-location";
export const ACCURACY_SOURCE_ID = "user-accuracy";

export const categoryGroupLabel: Record<CategoryGroup, string> = {
  BUILDING: "Public building",
  PARK: "Park",
  EDUCATION: "Education",
  TRANSPORT: "Transport",
  GOVERNMENT: "Government",
  COMMUNITY: "Community",
  OTHER: "Other",
};

type Glyph =
  | "building"
  | "park"
  | "education"
  | "transport"
  | "government"
  | "community"
  | "other";

const glyphPaths: Record<Glyph, string> = {
  building:
    "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M2 21h20M8 8h3M8 12h3M8 16h3M18 13h1M18 17h1",
  park: "M12 3 6 11h12L12 3ZM12 9l-5 6h10l-5-6ZM12 15v6",
  education: "M2 9l10-4 10 4-10 4L2 9ZM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5",
  transport:
    "M4 5h16v11H4zM4 9h16M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
  government: "M3 21h18M5 21V10M19 21V10M3 10h18L12 4 3 10ZM9 21v-7M15 21v-7",
  community:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M2 21v-1c0-2.7 3-4.5 7-4.5s7 1.8 7 4.5v1M17 11a3 3 0 1 0-1-5.8M18 21v-1c0-1.7-.8-3.1-2.2-4",
  other:
    "M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5",
};

const groupGlyph: Record<CategoryGroup, Glyph> = {
  BUILDING: "building",
  PARK: "park",
  EDUCATION: "education",
  TRANSPORT: "transport",
  GOVERNMENT: "government",
  COMMUNITY: "community",
  OTHER: "other",
};

const markerSvg = (glyph: Glyph, palette: IMapPalette) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
		<circle cx="20" cy="20" r="16" fill="${palette.primary}" stroke="${palette.background}" stroke-width="3" />
		<g transform="translate(9 9)" fill="none" stroke="${palette.primaryForeground}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="${glyphPaths[glyph]}" />
		</g>
	</svg>`;

/**
 * Converts any CSS colour (oklch/lab/var-resolved) into hex/rgba.
 * MapLibre's style parser only accepts legacy colour syntax, so theme tokens
 * declared in modern colour spaces must be normalised first — otherwise every
 * paint property is rejected and layers silently disappear.
 */
const createColorNormalizer = () => {
  if (typeof document === "undefined") return (value: string) => value;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  return (value: string) => {
    if (!context || !value) return value;

    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "#000000";
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);

    const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
    const hex = `#${[red, green, blue]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")}`;

    return alpha === 255
      ? hex
      : `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
  };
};

/** Reads the live theme tokens from the document root. */
export const readMapPalette = (): IMapPalette => {
  if (typeof window === "undefined") {
    return {
      background: "#ffffff",
      foreground: "#111111",
      primary: "#111111",
      primaryForeground: "#ffffff",
      mutedForeground: "#666666",
      border: "#dddddd",
    };
  }

  const styles = getComputedStyle(document.documentElement);
  const toLegacyColor = createColorNormalizer();
  const read = (token: string, fallback: string) => {
    const raw = styles.getPropertyValue(token).trim() || fallback;
    const normalized = toLegacyColor(raw);
    return /^(#|rgb|hsl)/.test(normalized) ? normalized : fallback;
  };

  return {
    background: read("--background", "#ffffff"),
    foreground: read("--foreground", "#111111"),
    primary: read("--primary", "#111111"),
    primaryForeground: read("--primary-foreground", "#ffffff"),
    mutedForeground: read("--muted-foreground", "#666666"),
    border: read("--border", "#dddddd"),
  };
};

const loadSvgImage = (svg: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Marker icon failed to load"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

export const loadMarkerImages = async (
  map: MapLibreMap,
  palette: IMapPalette,
) => {
  const groups = Object.keys(groupGlyph) as CategoryGroup[];

  await Promise.all(
    groups.map(async (group) => {
      const image = await loadSvgImage(markerSvg(groupGlyph[group], palette));
      const name = `place-${group}`;

      if (map.hasImage(name)) map.removeImage(name);
      map.addImage(name, image, { pixelRatio: 2 });
    }),
  );
};

/** OpenStreetMap raster basemap, overridable with a MapLibre style URL. */
export const buildMapStyle = (): StyleSpecification => {
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL;

  if (styleUrl) {
    return styleUrl as unknown as StyleSpecification;
  }

  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };
};

export const emptyFeatureCollection = {
  type: "FeatureCollection" as const,
  features: [] as IPlaceGeoFeature[],
};

/**
 * Every place is rendered as its own marker — there is no clustering and no
 * count badge, so the map never shows an unexplained number over a pin. Markers
 * shrink and fade at low zoom so dense areas stay readable.
 */
export const placesSource = (features: IPlaceGeoFeature[]) => ({
  type: "geojson" as const,
  data: { type: "FeatureCollection" as const, features },
  cluster: false,
});

export const userSource = (position: {
  latitude: number;
  longitude: number;
}) => ({
  type: "geojson" as const,
  data: {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [position.longitude, position.latitude],
        },
        properties: {},
      },
    ],
  },
});

/** Approximates the GPS accuracy radius as a GeoJSON polygon. */
export const accuracySource = (position: {
  latitude: number;
  longitude: number;
  accuracy: number;
}) => {
  const points = 64;
  const radius = Math.max(position.accuracy, 25);
  const latitudeDelta = radius / 111_320;
  const longitudeDelta =
    radius /
    (111_320 * Math.max(Math.cos((position.latitude * Math.PI) / 180), 0.01));
  const ring: [number, number][] = [];

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * 2 * Math.PI;
    ring.push([
      position.longitude + longitudeDelta * Math.cos(angle),
      position.latitude + latitudeDelta * Math.sin(angle),
    ]);
  }

  return {
    type: "geojson" as const,
    data: {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [ring] },
          properties: {},
        },
      ],
    },
  };
};

export type { LayerSpecification };

/**
 * Layer definitions. They are rebuilt (not diffed) when the theme changes so
 * every paint property follows the active theme tokens.
 */
export const buildLayers = (palette: IMapPalette): LayerSpecification[] => [
  {
    id: "user-accuracy",
    type: "fill",
    source: ACCURACY_SOURCE_ID,
    paint: {
      "fill-color": palette.foreground,
      "fill-opacity": 0.08,
    },
  },
  {
    id: "place-selected",
    type: "circle",
    source: PLACE_SOURCE_ID,
    filter: ["==", ["get", "id"], "__none__"],
    paint: {
      "circle-radius": 24,
      "circle-color": "transparent",
      "circle-stroke-width": 2,
      "circle-stroke-color": palette.foreground,
    },
  },
  {
    id: "place-markers",
    type: "symbol",
    source: PLACE_SOURCE_ID,
    layout: {
      "icon-image": ["concat", "place-", ["get", "categoryGroup"]],
      "icon-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        0.5,
        13,
        0.75,
        16,
        1,
      ],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-anchor": "center",
    },
    paint: {
      "icon-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        0.7,
        13,
        0.9,
        15,
        1,
      ],
    },
  },
  {
    id: "user-dot",
    type: "circle",
    source: USER_SOURCE_ID,
    paint: {
      "circle-radius": 7,
      "circle-color": palette.primary,
      "circle-stroke-width": 3,
      "circle-stroke-color": palette.background,
    },
  },
];

export const applySelection = (map: MapLibreMap, selectedId: string | null) => {
  if (!map.getLayer("place-selected")) return;

  map.setFilter("place-selected", [
    "==",
    ["get", "id"],
    selectedId ?? "__none__",
  ]);
};
