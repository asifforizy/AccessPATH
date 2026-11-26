"use client";

import { Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { geoFetch, isAbortError } from "@/lib/geo-api";
import { cn } from "@/lib/utils";
import type { IPlaceCard } from "@/types/place.types";
import type { IRoutePoint } from "@/types/route.types";

interface RouteEndpointPickerProps {
  label: string;
  accent: "origin" | "destination";
  placeholder: string;
  point: IRoutePoint | null;
  onSelect: (point: IRoutePoint) => void;
  onClear: () => void;
  onUseMyLocation?: () => void;
  locating?: boolean;
  onTogglePick: () => void;
  picking: boolean;
}

/**
 * Endpoint field for the route planner.
 *
 * Three ways to answer "where?": type a name (searched against the locations
 * API), use the current position, or drop a pin on the map. Coordinates are
 * never typed by hand.
 */
export function RouteEndpointPicker({
  label,
  accent,
  placeholder,
  point,
  onSelect,
  onClear,
  onUseMyLocation,
  locating = false,
  onTogglePick,
  picking,
}: RouteEndpointPickerProps) {
  const inputId = useId();
  const listId = useId();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<IPlaceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const accentClass = accent === "origin" ? "bg-primary" : "bg-rose-600";

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    geoFetch<IPlaceCard[]>(
      "places/search",
      { query: debouncedQuery, limit: 6 },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        setResults(response.success ? (response.data ?? []) : []);
        setOpen(true);
      })
      .catch((cause) => {
        if (!isAbortError(cause)) setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (place: IPlaceCard) => {
    onSelect({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const showList = open && debouncedQuery.length >= 2;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!showList || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const place = results[activeIndex];
      if (place) choose(place);
    }
  };

  return (
    <div ref={containerRef} className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <span
            aria-hidden="true"
            className={cn("size-2.5 rounded-full", accentClass)}
          />
          {label}
        </label>

        {point && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X aria-hidden="true" className="size-3" />
            Clear
          </button>
        )}
      </div>

      {point ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <MapPin
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0",
              accent === "origin" ? "text-foreground" : "text-rose-600",
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{point.name}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
            </span>
          </span>
        </div>
      ) : (
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={showList && results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            className="h-9 pr-8 pl-8"
          />
          {loading && (
            <Loader2
              aria-hidden="true"
              className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            />
          )}
        </div>
      )}

      {showList && results.length > 0 && !point && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="max-h-56 overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {results.map((place, index) => (
            <button
              key={place.id}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onPointerDown={(event) => {
                event.preventDefault();
                choose(place);
              }}
              className={cn(
                "w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm",
                index === activeIndex && "bg-muted",
              )}
            >
              <span className="block truncate font-medium">{place.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {place.address}, {place.city}
              </span>
            </button>
          ))}
        </div>
      )}

      {showList && !loading && results.length === 0 && !point && (
        <p className="text-xs text-muted-foreground">
          No match for “{debouncedQuery}”. Try another name, or pin it on the
          map.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {onUseMyLocation && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onUseMyLocation}
            disabled={locating}
          >
            {locating ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Crosshair aria-hidden="true" />
            )}
            My location
          </Button>
        )}

        <Button
          type="button"
          variant={picking ? "secondary" : "outline"}
          size="xs"
          onClick={onTogglePick}
          aria-pressed={picking}
        >
          <MapPin aria-hidden="true" />
          {picking ? "Click the map…" : "Pick on map"}
        </Button>
      </div>
    </div>
  );
}
