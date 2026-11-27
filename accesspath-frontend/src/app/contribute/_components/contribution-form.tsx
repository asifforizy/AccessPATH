"use client";

import {
  Accessibility,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPinPlus,
  PencilLine,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createContribution } from "@/services/contributions";
import type { IPlaceCategory } from "@/types/place.types";

import {
  AccessibilityStates,
  type ContributionFeatureKey,
  type FeatureState,
} from "./accessibility-states";

type ContributionType =
  | "LOCATION_CREATE"
  | "LOCATION_UPDATE"
  | "ACCESSIBILITY_UPDATE";

const typeChoices: Array<{
  value: ContributionType;
  title: string;
  description: string;
  icon: typeof MapPinPlus;
}> = [
  {
    value: "LOCATION_CREATE",
    title: "Add a new place",
    description: "It is not on AccessPath yet",
    icon: MapPinPlus,
  },
  {
    value: "LOCATION_UPDATE",
    title: "Fix place details",
    description: "Wrong name, address or position",
    icon: PencilLine,
  },
  {
    value: "ACCESSIBILITY_UPDATE",
    title: "Record accessibility",
    description: "Ramp, lift, restroom, entrance…",
    icon: Accessibility,
  },
];

const stepLabels = ["What", "Details", "Review"];

interface ContributionFormProps {
  categories?: IPlaceCategory[];
}

export function ContributionForm({ categories = [] }: ContributionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [type, setType] = useState<ContributionType>("LOCATION_CREATE");
  const [place, setPlace] = useState<ISelectedPlace | null>(null);

  const [name, setName] = useState("");
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

  const [notes, setNotes] = useState("");
  const [featureStates, setFeatureStates] = useState<
    Partial<Record<ContributionFeatureKey, FeatureState>>
  >({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [score, setScore] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCreate = type === "LOCATION_CREATE";
  const needsPlace = type !== "LOCATION_CREATE";

  const recordedFeatures = useMemo(
    () =>
      Object.entries(featureStates).filter(
        ([, state]) => state === "yes" || state === "no",
      ) as Array<[ContributionFeatureKey, FeatureState]>,
    [featureStates],
  );

  const stepOneValid = isCreate || Boolean(place);

  const stepTwoValid = isCreate
    ? name.trim().length >= 3 &&
      Boolean(categoryId) &&
      address.trim().length >= 3 &&
      city.trim().length > 0 &&
      coordinates !== null
    : type === "LOCATION_UPDATE"
      ? Boolean(
          name.trim() ||
            address.trim() ||
            city.trim() ||
            notes.trim().length >= 10,
        )
      : recordedFeatures.length > 0 || notes.trim().length >= 10;

  const notesTooShort = notes.trim().length > 0 && notes.trim().length < 10;

  const hint = !stepOneValid
    ? "Pick the place you want to update."
    : step === 1
      ? null
      : isCreate && !stepTwoValid
        ? "A name, category, address, city and map position are required."
        : notesTooShort
          ? "Add a little more detail — at least 10 characters."
          : null;

  const setFeature = (key: ContributionFeatureKey, next: FeatureState) => {
    setFeatureStates((previous) => ({ ...previous, [key]: next }));
  };

  const reset = () => {
    setStep(1);
    setSubmitted(false);
    setType("LOCATION_CREATE");
    setPlace(null);
    setName("");
    setCategoryId("");
    setAddress("");
    setCity("Dhaka");
    setState("Dhaka Division");
    setCountry("Bangladesh");
    setPostalCode("");
    setCoordinates(null);
    setNotes("");
    setFeatureStates({});
    setPhotoUrl(null);
    setScore("");
    setErrors({});
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};

    if (!isCreate && !place) nextErrors.place = "Choose the place to update.";
    if (isCreate) {
      if (name.trim().length < 3)
        nextErrors.name = "Give the place a name (3+ characters).";
      if (!categoryId) nextErrors.categoryId = "Choose a category.";
      if (address.trim().length < 3)
        nextErrors.address = "Add the street address.";
      if (!city.trim()) nextErrors.city = "Add the city.";
      if (!coordinates) nextErrors.coordinates = "Pin the place on the map.";
    }
    if (notesTooShort) {
      nextErrors.notes = "Add at least 10 characters, or leave it empty.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const features = Object.fromEntries(
      recordedFeatures.map(([key, state]) => [key, state === "yes"]),
    );

    const proposedData: Record<string, unknown> = {
      additionalInformation: notes.trim() || undefined,
      ...(recordedFeatures.length > 0 ? { features } : {}),
      ...(photoUrl ? { photoUrl } : {}),
      ...(score ? { accessibilityScore: Number(score) } : {}),
    };

    if (isCreate) {
      Object.assign(proposedData, {
        name: name.trim(),
        description: notes.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim() || undefined,
        country: country.trim(),
        postalCode: postalCode.trim() || undefined,
        categoryId,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      });
    } else {
      if (type === "LOCATION_UPDATE") {
        Object.assign(proposedData, {
          name: name.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          description: notes.trim() || undefined,
        });
      } else {
        proposedData.description = notes.trim() || undefined;
      }
    }

    const title = (
      isCreate
        ? name.trim()
        : type === "LOCATION_UPDATE"
          ? `Fix details: ${place?.name ?? "place"}`
          : `Accessibility: ${place?.name ?? "place"}`
    ).slice(0, 160);

    try {
      setLoading(true);

      const result = await createContribution({
        type,
        title,
        description: notes.trim() || undefined,
        proposedData,
        locationId: place?.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setSubmitted(true);
      // Pull fresh counts and history straight away.
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 aria-hidden="true" className="size-6" />
          </span>
          <h2 className="text-lg font-semibold">Thanks — it is in review</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            A moderator checks every submission before it appears on the map.
            You can follow its status under “My contributions”.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <Button type="button" size="sm" onClick={reset}>
              <MapPinPlus aria-hidden="true" />
              Contribute another place
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              Back to dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share what you know</CardTitle>
        <CardDescription>
          Three short steps. Only the essentials are required — everything else
          is optional.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Progress */}
        <ol className="flex items-center gap-2">
          {stepLabels.map((label, index) => {
            const value = index + 1;
            const done = value < step;
            const active = value === step;

            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    done || active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <CheckCircle2 className="size-3.5" /> : value}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    active ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {index < stepLabels.length - 1 && (
                  <span aria-hidden="true" className="h-px flex-1 bg-border" />
                )}
              </li>
            );
          })}
        </ol>

        {/* Step 1 — what are you adding? */}
        {step === 1 && (
          <div className="space-y-3">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                What would you like to add?
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {typeChoices.map((choice) => {
                  const Icon = choice.icon;
                  const active = type === choice.value;

                  return (
                    <button
                      key={choice.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setType(choice.value)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-4",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-sm font-medium">
                        {choice.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {choice.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {needsPlace && (
              <PlacePicker
                label="Which place?"
                value={place}
                onChange={setPlace}
                error={errors.place ?? null}
              />
            )}

            {place && (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Updating <strong>{place.name}</strong>. You only need to change
                the fields that are wrong.
              </p>
            )}
          </div>
        )}

        {/* Step 2 — details for this contribution type */}
        {step === 2 && (
          <div className="space-y-4">
            {isCreate && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contribution-name">Place name</Label>
                  <Input
                    id="contribution-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Mirpur Community Library"
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contribution-address">Street address</Label>
                  <Input
                    id="contribution-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="e.g. 12 Road 7, Mirpur"
                    aria-invalid={Boolean(errors.address)}
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
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contribution-country">Country</Label>
                  <Input
                    id="contribution-country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contribution-state">Region / state</Label>
                  <Input
                    id="contribution-state"
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contribution-postal">
                    Postal code (optional)
                  </Label>
                  <Input
                    id="contribution-postal"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                  />
                </div>

                <fieldset className="space-y-2 sm:col-span-2">
                  <legend className="text-sm font-medium">Category</legend>
                  <div className="grid gap-1.5 sm:grid-cols-3">
                    {categories.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Categories are loading…
                      </p>
                    ) : (
                      categories.map((category) => {
                        const active = categoryId === category.id;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setCategoryId(category.id)}
                            className={cn(
                              "truncate rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors",
                              active
                                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                : "border-border hover:bg-muted",
                            )}
                          >
                            {category.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                  {errors.categoryId && (
                    <p role="alert" className="text-xs text-destructive">
                      {errors.categoryId}
                    </p>
                  )}
                </fieldset>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Pin the exact position</Label>
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
              </div>
            )}

            {type === "LOCATION_UPDATE" && place && (
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Updating <strong>{place.name}</strong> — fill in only what is
                wrong and leave the rest empty.
              </p>
            )}

            {type === "LOCATION_UPDATE" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="update-name">Correct name</Label>
                  <Input
                    id="update-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={place?.name ?? "Leave empty to keep"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="update-address">Correct address</Label>
                  <Input
                    id="update-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Leave empty to keep"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="update-city">Correct city</Label>
                  <Input
                    id="update-city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Leave empty to keep"
                  />
                </div>
              </div>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                {isCreate
                  ? "What is accessible here?"
                  : type === "ACCESSIBILITY_UPDATE"
                    ? "What is accessible here?"
                    : "Accessibility (optional)"}
              </legend>
              <p className="text-xs text-muted-foreground">
                Tap Yes, No or Not sure. “Not sure” is never submitted, so
                nothing is assumed.
              </p>
              <AccessibilityStates
                values={featureStates}
                onChange={setFeature}
              />
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="contribution-notes">
                Notes, entrance details or barriers
              </Label>
              <Textarea
                id="contribution-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. The side entrance has a ramp, but the main door has two steps."
                aria-invalid={notesTooShort}
              />
              {notesTooShort && (
                <p role="alert" className="text-xs text-destructive">
                  Add at least 10 characters, or leave this empty.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — photo, score, review */}
        {step === 3 && (
          <div className="space-y-4">
            <ImageUploadField
              id="contribution-photo"
              label="Photo of the entrance or ramp (optional)"
              value={photoUrl}
              onChange={setPhotoUrl}
              helpText="A clear photo of the entrance helps more than anything else. JPEG, PNG, WebP or GIF up to 8 MB."
            />

            <div className="space-y-1.5">
              <Label htmlFor="contribution-score">
                Accessibility score (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                0 means barriers everywhere, 100 means fully accessible. Leave
                it empty if you are not sure.
              </p>
              <Input
                id="contribution-score"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(event) => setScore(event.target.value)}
                className="max-w-24"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles aria-hidden="true" className="size-4 text-primary" />
                What you are submitting
              </p>
              <dl className="grid gap-1 text-xs sm:grid-cols-2">
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Type:</dt>
                  <dd>
                    {typeChoices.find((choice) => choice.value === type)?.title}
                  </dd>
                </div>
                <div className="flex min-w-0 gap-1">
                  <dt className="shrink-0 text-muted-foreground">Place:</dt>
                  <dd className="truncate">
                    {isCreate ? name || "—" : (place?.name ?? "—")}
                  </dd>
                </div>
                {isCreate && (
                  <div className="flex min-w-0 gap-1 sm:col-span-2">
                    <dt className="shrink-0 text-muted-foreground">Address:</dt>
                    <dd className="truncate">
                      {[address, city, country].filter(Boolean).join(", ") ||
                        "—"}
                    </dd>
                  </div>
                )}
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Features:</dt>
                  <dd>
                    {recordedFeatures.length} recorded
                    {recordedFeatures.length > 0
                      ? ` (${recordedFeatures.filter(([, state]) => state === "yes").length} yes)`
                      : ""}
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground">Photo:</dt>
                  <dd>{photoUrl ? "attached" : "none"}</dd>
                </div>
              </dl>
              <p className="text-[11px] text-muted-foreground">
                A moderator reviews every submission before it goes live.
              </p>
            </div>
          </div>
        )}

        {hint && step > 1 && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5" />
            {hint}
          </p>
        )}

        {Object.keys(errors).length > 0 && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"
          >
            {Object.values(errors)[0]}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep((value) => Math.max(1, value - 1))}
            disabled={step === 1 || loading}
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setStep((value) => value + 1)}
              disabled={step === 1 ? !stepOneValid : !stepTwoValid}
              title={
                (step === 1 && !stepOneValid) || (step === 2 && !stepTwoValid)
                  ? (hint ?? "Fill the required fields first")
                  : undefined
              }
            >
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={submit} disabled={loading}>
              {loading ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}
              Submit for review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
