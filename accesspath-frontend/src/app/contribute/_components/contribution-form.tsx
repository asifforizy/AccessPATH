"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LocationPicker } from "@/components/map/location-picker";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import {
  type ISelectedPlace,
  PlacePicker,
} from "@/components/shared/place-picker";
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
import { geoFetch } from "@/lib/geo-api";
import { createContribution } from "@/services/contributions";
import type { IPlaceCategory } from "@/types/place.types";

const contributionTypes = [
  { value: "LOCATION_CREATE", label: "New location" },
  { value: "LOCATION_UPDATE", label: "Update location details" },
  { value: "ACCESSIBILITY_UPDATE", label: "Update accessibility information" },
] as const;

const featureFields = [
  { key: "wheelchairAccessible", label: "Wheelchair access" },
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

type FeatureKey = (typeof featureFields)[number]["key"];

export function ContributionForm() {
  const [type, setType] = useState<string>("LOCATION_CREATE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState<ISelectedPlace | null>(null);
  const [categories, setCategories] = useState<IPlaceCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [state, setState] = useState("Dhaka Division");
  const [country, setCountry] = useState("Bangladesh");
  const [postalCode, setPostalCode] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    geoFetch<IPlaceCategory[]>("places/categories")
      .then((response) => {
        if (response.success) setCategories(response.data ?? []);
      })
      .catch(() => undefined);
  }, []);

  const isNewLocation = type === "LOCATION_CREATE";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!isNewLocation && !place)
      nextErrors.place = "Choose the location to update.";
    if (isNewLocation) {
      if (!title.trim()) nextErrors.title = "Location name is required.";
      if (!address.trim()) nextErrors.address = "Address is required.";
      if (!city.trim()) nextErrors.city = "City is required.";
      if (!country.trim()) nextErrors.country = "Country is required.";
      if (!categoryId) nextErrors.categoryId = "Choose a category.";
      if (!coordinates) nextErrors.coordinates = "Set the position on the map.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const proposedData: Record<string, unknown> = {
      features,
      photoUrl: photoUrl ?? undefined,
      accessibilityScore: score ? Number(score) : undefined,
      additionalInformation: description || undefined,
    };

    if (isNewLocation) {
      Object.assign(proposedData, {
        name: title.trim(),
        description: description.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim() || undefined,
        country: country.trim(),
        postalCode: postalCode.trim() || undefined,
        categoryId,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      });
    } else if (type === "LOCATION_UPDATE") {
      Object.assign(proposedData, {
        name: title.trim() || undefined,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
      });
    }

    try {
      setLoading(true);

      const result = await createContribution({
        type,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        proposedData,
        locationId: place?.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setTitle("");
      setDescription("");
      setAddress("");
      setPhotoUrl(null);
      setFeatures({});
      setScore("");
      setPlace(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit accessibility information</CardTitle>
        <CardDescription>
          Submissions are reviewed by a moderator before they are published.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contribution-type">Contribution type</Label>
            <Select
              id="contribution-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {contributionTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-title">
              {isNewLocation ? "Location name" : "Title"}
            </Label>
            <Input
              id="contribution-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                isNewLocation
                  ? "e.g. Mirpur Community Library"
                  : "Short summary"
              }
              required={isNewLocation}
            />
            {errors.title && (
              <p role="alert" className="text-xs text-destructive">
                {errors.title}
              </p>
            )}
          </div>

          {!isNewLocation && (
            <div className="md:col-span-2">
              <PlacePicker
                value={place}
                onChange={setPlace}
                error={errors.place ?? null}
              />
            </div>
          )}

          {isNewLocation && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="contribution-category">Category</Label>
                <Select
                  id="contribution-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                {errors.categoryId && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.categoryId}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contribution-address">Address</Label>
                <Input
                  id="contribution-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street address"
                  required
                />
                {errors.address && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contribution-city">City</Label>
                <Input
                  id="contribution-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contribution-state">State / region</Label>
                <Input
                  id="contribution-state"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contribution-country">Country</Label>
                <Input
                  id="contribution-country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contribution-postal">Postal code</Label>
                <Input
                  id="contribution-postal"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="contribution-description">
              {isNewLocation ? "Description & accessibility notes" : "Details"}
            </Label>
            <Textarea
              id="contribution-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What makes this place accessible? Any barriers to know about?"
            />
          </div>

          {isNewLocation && (
            <div className="space-y-2 md:col-span-2">
              <Label>Location coordinates</Label>
              <LocationPicker
                latitude={coordinates?.latitude ?? null}
                longitude={coordinates?.longitude ?? null}
                onChange={setCoordinates}
              />
              {errors.coordinates && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.coordinates}
                </p>
              )}
            </div>
          )}

          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-sm font-medium">
              Accessibility features
            </legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {featureFields.map((feature) => (
                <label
                  key={feature.key}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(features[feature.key])}
                    onChange={(event) =>
                      setFeatures((previous) => ({
                        ...previous,
                        [feature.key as FeatureKey]: event.target.checked,
                      }))
                    }
                    className="size-4 accent-primary"
                  />
                  {feature.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-score">
              Accessibility score (0–100, optional)
            </Label>
            <Input
              id="contribution-score"
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(event) => setScore(event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploadField
              id="contribution-photo"
              label="Supporting photograph (optional)"
              value={photoUrl}
              onChange={setPhotoUrl}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Submit for review
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
