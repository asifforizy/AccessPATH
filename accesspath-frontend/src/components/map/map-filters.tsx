"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  IPlaceCategory,
  IPlaceFilters,
  PlaceSort,
} from "@/types/place.types";
import { filterableFeatureKeys, hasActiveFilters } from "@/types/place.types";

import { CategoryIcon, categoryGroupFromText, featureLabel } from "./map-meta";

interface MapFiltersProps {
  filters: IPlaceFilters;
  sort: PlaceSort;
  categories: IPlaceCategory[];
  categoriesLoading: boolean;
  hasUserLocation: boolean;
  onFiltersChange: (filters: IPlaceFilters) => void;
  onSortChange: (sort: PlaceSort) => void;
  onReset: () => void;
}

const sortOptions: Array<{ value: PlaceSort; label: string }> = [
  { value: "nearest", label: "Nearest first" },
  { value: "score", label: "Highest accessibility score" },
  { value: "recently_verified", label: "Recently verified" },
];

export function MapFilters({
  filters,
  sort,
  categories,
  categoriesLoading,
  hasUserLocation,
  onFiltersChange,
  onSortChange,
  onReset,
}: MapFiltersProps) {
  const toggleFeature = (feature: (typeof filterableFeatureKeys)[number]) => {
    const next = filters.features.includes(feature)
      ? filters.features.filter((item) => item !== feature)
      : [...filters.features, feature];

    onFiltersChange({ ...filters, features: next });
  };

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Accessibility filters
        </legend>
        <div className="grid gap-1.5">
          {filterableFeatureKeys.map((feature) => (
            <label
              key={feature}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={filters.features.includes(feature)}
                onChange={() => toggleFeature(feature)}
                className="size-4 rounded border-input accent-primary"
              />
              {featureLabel[feature]}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  verifiedOnly: event.target.checked,
                })
              }
              className="size-4 rounded border-input accent-primary"
            />
            Verified accessibility only
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Category
        </legend>

        {categoriesLoading ? (
          <p className="text-xs text-muted-foreground">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No location categories are available yet.
          </p>
        ) : (
          <div className="grid gap-1">
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="map-category"
                  checked={filters.category === null}
                  onChange={() =>
                    onFiltersChange({ ...filters, category: null })
                  }
                  className="size-4 accent-primary"
                />
                All categories
              </span>
            </label>

            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="radio"
                    name="map-category"
                    checked={filters.category === category.slug}
                    onChange={() =>
                      onFiltersChange({ ...filters, category: category.slug })
                    }
                    className="size-4 accent-primary"
                  />
                  <CategoryIcon
                    group={categoryGroupFromText(category.name, category.slug)}
                  />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {category.count}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <label
          htmlFor="map-sort"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Sort results
        </label>
        <Select
          id="map-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as PlaceSort)}
          className="h-9"
        >
          {sortOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.value === "nearest" && !hasUserLocation}
            >
              {option.label}
            </option>
          ))}
        </Select>
        {sort === "nearest" && !hasUserLocation && (
          <p className="text-xs text-muted-foreground">
            Share your location to sort by distance.
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={!hasActiveFilters(filters) && sort === "score"}
        className={cn("w-full gap-1.5")}
      >
        <RotateCcw aria-hidden="true" className="size-3.5" />
        Reset filters
      </Button>
    </div>
  );
}
