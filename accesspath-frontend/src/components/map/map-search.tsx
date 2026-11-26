"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { IPlaceCard } from "@/types/place.types";

import { CategoryIcon, VerificationBadge } from "./map-meta";

interface MapSearchProps {
  /** Keeps ids unique when the sidebar is mounted more than once. */
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: IPlaceCard[];
  onSelectSuggestion: (place: IPlaceCard) => void;
  loading: boolean;
}

/**
 * Debounced search input with keyboard-navigable suggestions.
 * The debouncing itself happens in `usePlaceSearch` before any request is sent.
 */
export function MapSearch({
  idPrefix,
  value,
  onChange,
  suggestions,
  onSelectSuggestion,
  loading,
}: MapSearchProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = `${idPrefix}-search-suggestions`;
  const inputId = `${idPrefix}-search-input`;

  const visibleSuggestions =
    value.trim().length >= 2 ? suggestions.slice(0, 5) : [];
  const showList = open && visibleSuggestions.length > 0;

  useEffect(() => {
    if (!showList) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!showList) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % visibleSuggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) =>
          (index - 1 + visibleSuggestions.length) % visibleSuggestions.length,
      );
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = visibleSuggestions[activeIndex];
      if (suggestion) {
        onSelectSuggestion(suggestion);
        setOpen(false);
        setActiveIndex(-1);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search accessible places by name or address
      </label>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />

        <Input
          id={inputId}
          type="search"
          value={value}
          placeholder="Search places or addresses"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && activeIndex >= 0
              ? `${idPrefix}-suggestion-${activeIndex}`
              : undefined
          }
          className="h-9 pr-8 pl-8"
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        ) : (
          loading && (
            <span
              aria-hidden="true"
              className="absolute top-1/2 right-3 size-2 -translate-y-1/2 animate-pulse rounded-full bg-muted-foreground"
            />
          )
        )}
      </div>

      {showList && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {visibleSuggestions.map((suggestion, index) => (
            <button
              type="button"
              key={suggestion.id}
              id={`${idPrefix}-suggestion-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm",
                index === activeIndex && "bg-muted",
              )}
              onPointerDown={(event) => {
                event.preventDefault();
                onSelectSuggestion(suggestion);
                setOpen(false);
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <CategoryIcon group={suggestion.categoryGroup} />
                  <span className="truncate font-medium">
                    {suggestion.name}
                  </span>
                </span>
                <VerificationBadge status={suggestion.verification} />
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {suggestion.address}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
