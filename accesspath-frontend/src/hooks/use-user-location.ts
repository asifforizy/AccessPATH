"use client";

import { useCallback, useRef, useState } from "react";

import type { IUserPosition, UserLocationStatus } from "@/types/map.types";

const errorCopy: Partial<Record<number, string>> = {
  1: "Location permission was denied. You can still search the map, or enable location access in your browser settings.",
  2: "Your current location is unavailable. Check that GPS or location services are switched on.",
  3: "Getting your location timed out. Please try again.",
};

/**
 * Browser geolocation with explicit user initiation.
 *
 * Permission is only requested when `request()` is called from a user gesture —
 * never automatically on mount.
 */
export const useUserLocation = () => {
  const [status, setStatus] = useState<UserLocationStatus>("idle");
  const [position, setPosition] = useState<IUserPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      setError(
        "This browser does not provide location services. Search for a place instead.",
      );
      return;
    }

    requested.current = true;
    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
        setStatus("granted");
      },
      (geolocationError) => {
        setStatus(geolocationError.code === 1 ? "denied" : "error");
        setError(
          errorCopy[geolocationError.code] ??
            "Your location could not be determined. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  return { status, position, error, request, requested: requested.current };
};
