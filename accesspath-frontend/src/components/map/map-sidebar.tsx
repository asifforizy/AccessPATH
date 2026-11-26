"use client";

import {
  ChevronDown,
  Loader2,
  MapPinOff,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  IPlaceCard,
  IPlaceCategory,
  IPlaceFilters,
  PlaceSort,
} from "@/types/place.types";
import { hasActiveFilters } from "@/types/place.types";

import { LocationCard } from "./location-card";
import { MapFilters } from "./map-filters";
import { MapSearch } from "./map-search";

interface MapSidebarProps {
  /** Keeps input ids unique when the panel is mounted twice (rail + sheet). */
  idPrefix: string;
  query: string;
  onQueryChange: (value: string) => void;
  suggestions: IPlaceCard[];
  onSelectSuggestion: (place: IPlaceCard) => void;
  filters: IPlaceFilters;
  sort: PlaceSort;
  categories: IPlaceCategory[];
  categoriesLoading: boolean;
  hasUserLocation: boolean;
  onFiltersChange: (filters: IPlaceFilters) => void;
  onSortChange: (sort: PlaceSort) => void;
  onReset: () => void;
  cards: IPlaceCard[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (placeId: string) => void;
  listLabel: string;
  listHint: string | null;
  onRetry: () => void;
}

/**
 * Search + filters + results. The header stays put and only the result list
 * scrolls, so the map beside it keeps a stable height.
 */
export function MapSidebar({
  idPrefix,
  query,
  onQueryChange,
  suggestions,
  onSelectSuggestion,
  filters,
  sort,
  categories,
  categoriesLoading,
  hasUserLocation,
  onFiltersChange,
  onSortChange,
  onReset,
  cards,
  loading,
  error,
  selectedId,
  onSelect,
  listLabel,
  listHint,
  onRetry,
}: MapSidebarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    filters.features.length +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.category ? 1 : 0);
  const anyActive = hasActiveFilters(filters) || sort !== "score";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border p-3">
        <MapSearch
          idPrefix={idPrefix}
          value={query}
          onChange={onQueryChange}
          suggestions={suggestions}
          onSelectSuggestion={onSelectSuggestion}
          loading={loading}
        />

        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls={`${idPrefix}-filters`}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium transition-colors",
            "hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
            filtersOpen && "bg-muted",
          )}
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              filtersOpen && "rotate-180",
            )}
          />
        </button>

        {filtersOpen && (
          <div
            id={`${idPrefix}-filters`}
            className="relative max-h-[min(24rem,42vh)] overflow-y-auto pr-1"
          >
            <MapFilters
              idPrefix={idPrefix}
              filters={filters}
              sort={sort}
              categories={categories}
              categoriesLoading={categoriesLoading}
              hasUserLocation={hasUserLocation}
              onFiltersChange={onFiltersChange}
              onSortChange={onSortChange}
              onReset={onReset}
            />
          </div>
        )}

        {!filtersOpen && anyActive && (
          <p className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>Filters are narrowing the results.</span>
            <button
              type="button"
              onClick={onReset}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              Reset
            </button>
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pt-3">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {listLabel}
            </h2>
            {listHint && (
              <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                {listHint}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
            {cards.length}
          </span>
        </div>

        {/*
         * `relative` is load-bearing: without a positioning context Chrome
         * leaks the scrolled list's overflow into the document scroll height,
         * which makes the whole page scroll far past the map.
         */}
        <div className="relative min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {loading && cards.length === 0 && (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              Loading places…
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-border p-3 text-xs">
              <p role="alert" className="text-destructive">
                {error}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onRetry}
              >
                Try again
              </Button>
            </div>
          )}

          {!loading && !error && cards.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <MapPinOff
                aria-hidden="true"
                className="size-6 text-muted-foreground"
              />
              <p className="text-sm font-medium">No places found</p>
              <p className="text-xs text-muted-foreground">
                Try another search, move the map, or clear some filters.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReset}
              >
                Reset filters
              </Button>
            </div>
          )}

          {cards.map((card) => (
            <LocationCard
              key={card.id}
              place={card}
              distanceMeters={
                (card as IPlaceCard & { distanceMeters?: number })
                  .distanceMeters ?? null
              }
              selected={card.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
