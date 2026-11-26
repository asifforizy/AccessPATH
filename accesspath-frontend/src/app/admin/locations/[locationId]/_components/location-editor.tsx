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
import { Textarea } from "@/components/ui/textarea";
import {
  updateAdminAccessibility,
  updateAdminLocation,
} from "@/services/admin";
import type { IAccessibilityProfile } from "@/utils/types";

const accessibilityFields = [
  { key: "wheelchairAccessible", label: "Wheelchair accessible" },
  { key: "rampAvailable", label: "Ramp available" },
  { key: "elevatorAvailable", label: "Elevator available" },
  { key: "accessibleRestroom", label: "Accessible restroom" },
  { key: "accessibleParking", label: "Accessible parking" },
  { key: "stepFreeEntrance", label: "Step-free entrance" },
  { key: "doorAccessibility", label: "Accessible door" },
  { key: "tactilePaving", label: "Tactile paving" },
  { key: "brailleSignage", label: "Braille signage" },
  { key: "hearingLoop", label: "Hearing loop" },
] as const;

interface LocationEditorProps {
  location: {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    website: string;
    latitude: number;
    longitude: number;
    categoryId: string;
    status: string;
    accessibility: IAccessibilityProfile | null;
  };
  categories: Array<{ id: string; name: string }>;
}

const statuses = ["PENDING", "APPROVED", "REJECTED", "ARCHIVED"] as const;

export function LocationEditor({ location, categories }: LocationEditorProps) {
  const router = useRouter();

  const [details, setDetails] = useState({
    name: location.name,
    description: location.description,
    address: location.address,
    city: location.city,
    state: location.state,
    country: location.country,
    postalCode: location.postalCode,
    phone: location.phone,
    website: location.website,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    categoryId: location.categoryId,
    status: location.status,
  });

  const [features, setFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(
      accessibilityFields.map((field) => [
        field.key,
        Boolean(location.accessibility?.[field.key]),
      ]),
    ),
  );
  const [score, setScore] = useState(
    String(location.accessibility?.accessibilityScore ?? 0),
  );
  const [verified, setVerified] = useState(
    Boolean(location.accessibility?.isVerified),
  );
  const [notes, setNotes] = useState(
    (location.accessibility?.additionalInformation as string | null) ?? "",
  );
  const [saving, setSaving] = useState<string | null>(null);

  const saveDetails = async () => {
    try {
      setSaving("details");
      const result = await updateAdminLocation(location.id, {
        name: details.name,
        description: details.description || undefined,
        address: details.address,
        city: details.city,
        state: details.state || undefined,
        country: details.country,
        postalCode: details.postalCode || undefined,
        phone: details.phone || undefined,
        website: details.website || undefined,
        latitude: Number(details.latitude),
        longitude: Number(details.longitude),
        categoryId: details.categoryId || undefined,
        status: details.status,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } finally {
      setSaving(null);
    }
  };

  const saveAccessibility = async () => {
    try {
      setSaving("accessibility");
      const result = await updateAdminAccessibility(location.id, {
        ...features,
        accessibilityScore: Number(score) || 0,
        isVerified: verified,
        additionalInformation: notes || undefined,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Location details</CardTitle>
          <CardDescription>
            Changing status to APPROVED publishes the location.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="admin-name">Name</Label>
            <Input
              id="admin-name"
              value={details.name}
              onChange={(event) =>
                setDetails((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-description">Description</Label>
            <Textarea
              id="admin-description"
              value={details.description}
              onChange={(event) =>
                setDetails((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-address">Address</Label>
              <Input
                id="admin-address"
                value={details.address}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    address: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-city">City</Label>
              <Input
                id="admin-city"
                value={details.city}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    city: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-state">State</Label>
              <Input
                id="admin-state"
                value={details.state}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    state: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-country">Country</Label>
              <Input
                id="admin-country"
                value={details.country}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    country: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-lat">Latitude</Label>
              <Input
                id="admin-lat"
                type="number"
                step="0.000001"
                value={details.latitude}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    latitude: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-lng">Longitude</Label>
              <Input
                id="admin-lng"
                type="number"
                step="0.000001"
                value={details.longitude}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    longitude: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-category">Category</Label>
              <Select
                id="admin-category"
                value={details.categoryId}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    categoryId: event.target.value,
                  }))
                }
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-status">Status</Label>
              <Select
                id="admin-status"
                value={details.status}
                onChange={(event) =>
                  setDetails((previous) => ({
                    ...previous,
                    status: event.target.value,
                  }))
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Button
            type="button"
            onClick={saveDetails}
            disabled={saving !== null}
          >
            {saving === "details" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Save location details
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessibility information</CardTitle>
          <CardDescription>
            Verified data is weighted higher by the route scoring engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {accessibilityFields.map((field) => (
              <label
                key={field.key}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={Boolean(features[field.key])}
                  onChange={(event) =>
                    setFeatures((previous) => ({
                      ...previous,
                      [field.key]: event.target.checked,
                    }))
                  }
                  className="size-4 accent-primary"
                />
                {field.label}
              </label>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admin-score">Accessibility score (0–100)</Label>
              <Input
                id="admin-score"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(event) => setScore(event.target.value)}
              />
            </div>
            <label className="flex items-end gap-2 pb-1 text-sm">
              <input
                type="checkbox"
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
                className="size-4 accent-primary"
              />
              Mark as verified
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-notes">Additional information</Label>
            <Textarea
              id="admin-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Access notes, temporary closures, etc."
            />
          </div>

          <Button
            type="button"
            onClick={saveAccessibility}
            disabled={saving !== null}
          >
            {saving === "accessibility" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Save accessibility information
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
