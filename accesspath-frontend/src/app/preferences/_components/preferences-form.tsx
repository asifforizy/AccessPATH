"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  updateAccessibilityPreferences,
  updatePreferences,
} from "@/services/preferences";
import type { IUserPreference } from "@/utils/types";

const travelModes = ["WALKING", "WHEELCHAIR", "CYCLING", "DRIVING"];

const needKeys = [
  ["wheelchairAccessible", "Wheelchair accessible"],
  ["rampAvailable", "Ramp available"],
  ["elevatorAvailable", "Elevator available"],
  ["accessibleRestroom", "Accessible restroom"],
  ["accessibleParking", "Accessible parking"],
  ["stepFreeEntrance", "Step-free entrance"],
  ["tactilePaving", "Tactile paving"],
  ["brailleSignage", "Braille signage"],
  ["hearingLoop", "Hearing loop"],
] as const;

export function PreferencesForm({
  preferences,
  accessibility,
}: {
  preferences: IUserPreference;
  accessibility: Record<string, unknown>;
}) {
  const router = useRouter();

  const [travelMode, setTravelMode] = useState(
    preferences.travelMode ?? "WALKING",
  );
  const [preferredLanguage, setPreferredLanguage] = useState(
    preferences.preferredLanguage ?? "en",
  );
  const [notificationEnabled, setNotificationEnabled] = useState(
    preferences.notificationEnabled ?? true,
  );
  const [needs, setNeeds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      needKeys.map(([key]) => [key, accessibility[key] === true]),
    ),
  );
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);

      const [preferenceResult, accessibilityResult] = await Promise.all([
        updatePreferences({
          travelMode,
          preferredLanguage,
          notificationEnabled,
        }),
        updateAccessibilityPreferences(needs),
      ]);

      if (!preferenceResult.success) {
        toast.error(preferenceResult.message);
        return;
      }

      if (!accessibilityResult.success) {
        toast.error(accessibilityResult.message);
        return;
      }

      toast.success("Preferences saved");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save preferences",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Travel and accessibility preferences</CardTitle>
        <CardDescription>
          Used to personalise route planning and location recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="travelMode">Preferred travel mode</Label>
              <Select
                id="travelMode"
                value={travelMode}
                onChange={(event) => setTravelMode(event.target.value)}
              >
                {travelModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="language">Preferred language</Label>
              <Input
                id="language"
                value={preferredLanguage}
                onChange={(event) => setPreferredLanguage(event.target.value)}
                placeholder="en"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={(event) => setNotificationEnabled(event.target.checked)}
              className="size-4 rounded border"
            />
            Enable notifications
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">Accessibility needs</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {needKeys.map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={needs[key] ?? false}
                    onChange={(event) =>
                      setNeeds((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                    className="size-4 rounded border"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Save preferences
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
