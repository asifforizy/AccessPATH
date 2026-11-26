"use client";

import { Loader2, MapPinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  IPlaceCard,
  IPlaceCategory,
  IPlaceFilters,
  PlaceSort,
} from "@/types/place.types";

import { LocationCard } from "./location-card";
import { MapFilters } from "./map-filters";
import { MapSearch } from "./map-search";

interface MapSidebarProps {
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

export function MapSidebar({
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
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-border p-4">
        <MapSearch
          value={query}
          onChange={onQueryChange}
          suggestions={suggestions}
          onSelectSuggestion={onSelectSuggestion}
          loading={loading}
        />

        <MapFilters
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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-2 px-4 pt-3">
          <h2 className="text-sm font-semibold">{listLabel}</h2>
          <span className="text-xs text-muted-foreground">
            {cards.length} shown
          </span>
        </div>

        {listHint && (
          <p className="px-4 pt-1 text-xs text-muted-foreground">{listHint}</p>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
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
