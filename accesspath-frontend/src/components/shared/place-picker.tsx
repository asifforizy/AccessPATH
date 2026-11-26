"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { geoFetch, isAbortError } from "@/lib/geo-api";
import type { IPlaceCard } from "@/types/place.types";

export interface ISelectedPlace {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface PlacePickerProps {
  label?: string;
  value: ISelectedPlace | null;
  onChange: (place: ISelectedPlace | null) => void;
  error?: string | null;
}

/**
 * Debounced place search used to attach a report/contribution to a real
 * location instead of asking users to paste a raw UUID.
 */
export function PlacePicker({
  label = "Location",
  value,
  onChange,
  error,
}: PlacePickerProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<IPlaceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setSearchError(null);

    geoFetch<IPlaceCard[]>(
      "places/search",
      { query: debouncedQuery, limit: 8 },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!response.success) {
          setSearchError(response.message);
          setResults([]);
          return;
        }
        setResults(response.data ?? []);
      })
      .catch((cause) => {
        if (isAbortError(cause)) return;
        setSearchError("Search failed");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>

      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 text-primary" />
            <span className="truncate">{value.name}</span>
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={() => onChange(null)}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a location by name or address"
              aria-label={`Search ${label.toLowerCase()}`}
              aria-controls={listId}
              className="h-9 pl-8"
            />
            {loading && (
              <Loader2
                aria-hidden="true"
                className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              />
            )}
          </div>

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          {searchError && (
            <p role="alert" className="text-xs text-destructive">
              {searchError}
            </p>
          )}

          {results.length > 0 && (
            <ul
              id={listId}
              className="max-h-52 overflow-auto rounded-lg border border-border"
            >
              {results.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() =>
                      onChange({
                        id: place.id,
                        name: place.name,
                        latitude: place.latitude,
                        longitude: place.longitude,
                      })
                    }
                  >
                    <span className="font-medium">{place.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {place.address}, {place.city}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {debouncedQuery.length >= 2 &&
            !loading &&
            results.length === 0 &&
            !searchError && (
              <p className="text-xs text-muted-foreground">
                No matching locations. Try another name.
              </p>
            )}
        </>
      )}
    </div>
  );
}
