import type { IMapBounds } from "./place.types";

export interface IMapViewport extends IMapBounds {
  zoom: number;
}

export interface IUserPosition {
  latitude: number;
  longitude: number;
  /** Accuracy radius in meters, from the Geolocation API. */
  accuracy: number;
}

export type UserLocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable"
  | "error";

export interface IGeoRequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface IMapPalette {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  mutedForeground: string;
  border: string;
}
