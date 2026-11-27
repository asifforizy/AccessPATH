import { Check, MapPin, X } from "lucide-react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ContributionModel,
  formatCoordinate,
  placeLine,
  readContribution,
  scoreBand,
  typeBlurb,
  typeLabel,
} from "@/lib/contribution";
import { osmPlaceUrl } from "@/lib/geo";
import type { IPlaceDetail } from "@/types/place.types";
import type { IContribution } from "@/utils/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children}</dd>
    </div>
  );
}

function PlaceDetails({
  model,
  categoryName,
  currentPlace,
}: {
  model: ContributionModel;
  categoryName?: string | null;
  currentPlace?: IPlaceDetail | null;
}) {
  const hasCoordinates =
    model.latitude !== undefined && model.longitude !== undefined;

  const comparisons = currentPlace
    ? (
        [
          { label: "Name", current: currentPlace.name, proposed: model.name },
          {
            label: "Address",
            current: currentPlace.address,
            proposed: model.address,
          },
          { label: "City", current: currentPlace.city, proposed: model.city },
          {
            label: "Region / state",
            current: currentPlace.state,
            proposed: model.state,
          },
        ] as const
      )
        .filter((row) => row.proposed !== undefined)
        .map((row) => ({
          ...row,
          changed: row.proposed !== row.current,
        }))
    : [];

  const rows: Array<{ label: string; value: React.ReactNode }> = [];
  if (model.name) rows.push({ label: "Name", value: model.name });
  if (categoryName) rows.push({ label: "Category", value: categoryName });
  if (model.address) rows.push({ label: "Address", value: model.address });
  if (model.city) rows.push({ label: "City", value: model.city });
  if (model.state) rows.push({ label: "Region / state", value: model.state });
  if (model.postalCode) {
    rows.push({ label: "Postal code", value: model.postalCode });
  }
  if (model.country) rows.push({ label: "Country", value: model.country });
  if (hasCoordinates) {
    rows.push({
      label: "Coordinates",
      value: (
        <a
          href={osmPlaceUrl(
            model.latitude as number,
            model.longitude as number,
          )}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
        >
          <MapPin aria-hidden="true" className="size-3.5" />
          {formatCoordinate(model.latitude as number)},{" "}
          {formatCoordinate(model.longitude as number)}
          <span className="sr-only">(opens in OpenStreetMap)</span>
        </a>
      ),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place details</CardTitle>
        <CardDescription>
          {currentPlace
            ? "What should change, compared with what the place shows today."
            : "The details included in this submission."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {comparisons.length ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              {comparisons.some((row) => row.changed)
                ? `${comparisons.filter((row) => row.changed).length} of ${comparisons.length} fields would change.`
                : "These values match what the place already shows."}
            </p>
            <ul className="space-y-2">
              {comparisons.map((row) => (
                <li
                  key={row.label}
                  className="rounded-lg border border-border p-2.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <span
                      className={
                        row.changed
                          ? "rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                          : "rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      }
                    >
                      {row.changed ? "Change" : "Unchanged"}
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5">
                    {row.changed && (
                      <>
                        <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                          {row.current || "empty"}
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-muted-foreground"
                        >
                          →
                        </span>
                      </>
                    )}
                    <span className="font-medium">{row.proposed}</span>
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {!comparisons.length && rows.length ? (
          <dl className="divide-y divide-border">
            {rows.map((row) => (
              <Field key={row.label} label={row.label}>
                {row.value}
              </Field>
            ))}
          </dl>
        ) : comparisons.length ? null : (
          <p className="text-sm text-muted-foreground">
            This submission did not include place details — check the note from
            the contributor above.
          </p>
        )}

        {hasCoordinates && (
          <p className="mt-3 text-xs text-muted-foreground">
            The pin is where the contributor wants the place to appear.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AccessibilityDetails({ model }: { model: ContributionModel }) {
  const score = model.score === undefined ? undefined : Math.round(model.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility</CardTitle>
        <CardDescription>
          Only the features the contributor answered are listed — anything they
          skipped stays unknown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {model.available.length > 0 && (
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Reported as available
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {model.available.map((feature) => (
                <li
                  key={feature.key}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-400"
                >
                  <Check aria-hidden="true" className="size-3.5" />
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {model.unavailable.length > 0 && (
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Reported as not available
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {model.unavailable.map((feature) => (
                <li
                  key={feature.key}
                  className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
                >
                  <X aria-hidden="true" className="size-3.5" />
                  {feature.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {score !== undefined && (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Score proposed
              </p>
              <p className="text-sm font-semibold tabular-nums">{score}/100</p>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Proposed accessibility score ${score} out of 100`}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {scoreBand(score)} — the contributor&apos;s own estimate.
            </p>
          </div>
        )}

        {!model.available.length &&
          !model.unavailable.length &&
          score === undefined && (
            <p className="text-sm text-muted-foreground">
              No accessibility features were recorded in this submission.
            </p>
          )}
      </CardContent>
    </Card>
  );
}

export function ContributionBreakdown({
  contribution,
  currentPlace,
  categoryName,
}: {
  contribution: IContribution;
  currentPlace?: IPlaceDetail | null;
  categoryName?: string | null;
}) {
  const model = readContribution(contribution.proposedData);
  const hasAccessibility =
    model.available.length > 0 ||
    model.unavailable.length > 0 ||
    model.score !== undefined;
  const hasPlaceFields = Boolean(
    model.name ||
      model.address ||
      model.city ||
      model.state ||
      model.postalCode ||
      model.country ||
      model.latitude !== undefined,
  );
  const showPlaceDetails =
    contribution.type !== "ACCESSIBILITY_UPDATE" || hasPlaceFields;

  return (
    <div className="space-y-4">
      {showPlaceDetails ? (
        <PlaceDetails
          model={model}
          categoryName={categoryName}
          currentPlace={currentPlace}
        />
      ) : null}

      {hasAccessibility && <AccessibilityDetails model={model} />}

      {model.photoUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Photo</CardTitle>
            <CardDescription>
              Attached by the contributor as evidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src={model.photoUrl}
              alt="Photo attached to this contribution"
              width={960}
              height={640}
              unoptimized
              className="max-h-80 w-auto rounded-lg border border-border object-contain"
            />
          </CardContent>
        </Card>
      )}

      {!hasAccessibility &&
        !model.photoUrl &&
        contribution.type === "ACCESSIBILITY_UPDATE" && (
          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {typeBlurb(contribution.type)} This one arrived without any
                feature answers.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

/** One-line description of the submission used in headers. */
export function contributionHeadline(contribution: IContribution) {
  const model = readContribution(contribution.proposedData);
  const where = placeLine(model);
  const label = typeLabel(contribution.type);
  return where ? `${label} · ${where}` : label;
}
