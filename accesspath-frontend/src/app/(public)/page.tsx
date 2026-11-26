import {
  Accessibility,
  ArrowRight,
  CheckCircle2,
  Compass,
  Flag,
  MapPin,
  MessageSquare,
  Navigation,
  Route,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getPublicHome } from "@/services/public";
import type { IAccessibilityProfile, IFeaturedLocation } from "@/utils/types";

const heroImage =
  "https://i.ibb.co.com/DDtPsDYV/3d-view-map.jpg?auto=format&fit=crop&w=900&q=80";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (value: number) => numberFormatter.format(value);

const getAccessibilityTags = (accessibility?: IAccessibilityProfile | null) => {
  if (!accessibility) return [];

  const tags: string[] = [];

  if (accessibility.stepFreeEntrance) tags.push("Step-free entry");
  if (accessibility.wheelchairAccessible) tags.push("Wheelchair accessible");
  if (accessibility.accessibleRestroom) tags.push("Accessible restroom");
  if (accessibility.elevatorAvailable) tags.push("Elevator");
  if (accessibility.accessibleParking) tags.push("Accessible parking");
  if (accessibility.rampAvailable) tags.push("Ramp");

  return tags.slice(0, 3);
};

const getPrimaryPhoto = (location: IFeaturedLocation) =>
  location.photos?.find((photo) => photo.isPrimary) ?? location.photos?.[0];

const features = [
  {
    icon: ShieldCheck,
    title: "Verified accessibility details",
    description:
      "Know what to expect before you arrive — step-free entrances, elevators, restrooms and more.",
  },
  {
    icon: Route,
    title: "Barrier-free route planner",
    description:
      "Get directions that avoid stairs, steep slopes and broken paths so every trip is smooth.",
  },
  {
    icon: MessageSquare,
    title: "Honest community reviews",
    description:
      "Real experiences from people who use these spaces every day, not just marketing copy.",
  },
  {
    icon: Flag,
    title: "Live issue reports",
    description:
      "Report and check closures, broken lifts and blocked ramps in real time before you head out.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Search a place",
    description: "Find locations by name, category or neighborhood in seconds.",
  },
  {
    icon: Compass,
    title: "Check accessibility",
    description:
      "Review verified features, photos and notes from the community.",
  },
  {
    icon: Navigation,
    title: "Go with confidence",
    description:
      "Follow a barrier-free route and share feedback to help others.",
  },
];

const HomePage = async () => {
  const res = await getPublicHome();
  const data = res.data;

  const stats = data?.stats ?? {
    places: 0,
    verifiedPlaces: 0,
    reviews: 0,
    cities: 0,
    averageAccessibilityScore: 0,
  };
  const cities = data?.cities ?? [];
  const categories = data?.categories ?? [];
  const featured = data?.featured ?? [];

  const statItems = [
    { value: formatNumber(stats.places), label: "Accessible places" },
    { value: formatNumber(stats.cities), label: "Cities covered" },
    { value: formatNumber(stats.verifiedPlaces), label: "Verified places" },
    { value: formatNumber(stats.reviews), label: "Community reviews" },
  ];

  return (
    <main className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/60 to-background">
        <div className="pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-[#FF7A00]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Accessibility className="size-3.5 text-[#FF7A00]" />
              Accessibility-first city exploration
            </span>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find your way to places that{" "}
              <span className="text-[#FF7A00]">truly welcome you.</span>
            </h1>

            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              AccessPath helps you discover accessible places, plan barrier-free
              routes and explore your city with confidence.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 px-6 text-base"
                nativeButton={false}
                render={<Link href="/explore" />}
              >
                <Compass className="size-4" />
                Explore places
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 text-base"
                nativeButton={false}
                render={<Link href="/routes" />}
              >
                <Route className="size-4" />
                Plan a route
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#FF7A00]" />
                Free to use
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#FF7A00]" />
                Community verified
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border shadow-xl">
              <img
                src={heroImage}
                alt="A wide view of an accessible city street"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            <div className="absolute -bottom-6 -left-4 w-60 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:-left-8">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#FF7A00]/10">
                  <Star className="size-4 text-[#FF7A00]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {stats.places > 0 && stats.averageAccessibilityScore > 0
                      ? `${stats.averageAccessibilityScore}/100 avg. accessibility`
                      : "Community verified"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.places > 0
                      ? `across ${formatNumber(stats.places)} ${stats.places === 1 ? "place" : "places"}`
                      : "Be the first to add a place"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="bg-background/80 px-6 py-5 text-center"
              >
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
              Discover
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Featured accessible places
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Real places from the AccessPath community, ranked by accessibility
              details and recent activity.
            </p>
          </div>

          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/explore" />}
          >
            View all places
            <ArrowRight className="size-4" />
          </Button>
        </div>

        {featured.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((location) => {
              const photo = getPrimaryPhoto(location);
              const tags = getAccessibilityTags(location.accessibility);

              return (
                <article
                  key={location.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"
                >
                  <Link
                    href={`/explore/${location.id}`}
                    className="block overflow-hidden"
                  >
                    {photo ? (
                      <img
                        src={photo.url}
                        alt={location.name}
                        className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-[#FF7A00]/15 via-muted to-background">
                        <Accessibility className="size-10 text-[#FF7A00]/60" />
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/explore/${location.id}`}
                          className="block"
                        >
                          <h3 className="truncate text-lg font-semibold transition-colors group-hover:text-[#FF7A00]">
                            {location.name}
                          </h3>
                        </Link>
                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {location.city}
                            {location.country ? `, ${location.country}` : ""}
                          </span>
                        </p>
                      </div>
                      {typeof location.accessibility?.accessibilityScore ===
                        "number" && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FF7A00]/10 px-2.5 py-1 text-sm font-medium text-[#FF7A00]">
                          <Star className="size-3.5 fill-current" />
                          {location.accessibility.accessibilityScore}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {location.category && (
                        <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                          {location.category.name}
                        </span>
                      )}
                      {location.accessibility?.isVerified && (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Verified
                        </span>
                      )}
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {typeof location.averageRating === "number"
                          ? `${location.averageRating.toFixed(1)} avg rating (${location.ratingCount})`
                          : "No ratings yet"}
                      </span>
                      <span>
                        {location._count?.reviews ?? 0} reviews ·{" "}
                        {location._count?.favorites ?? 0} saved
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="No featured places yet"
              description="Approved accessible places will appear here as soon as the community adds them."
            />
          </div>
        )}
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
                Explore by city
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Accessible places in{" "}
                {stats.cities > 0
                  ? `${formatNumber(stats.cities)} ${stats.cities === 1 ? "city" : "cities"}`
                  : "your city"}
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Browse approved locations by city and check accessibility
                details before you go.
              </p>
            </div>

            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/explore" />}
            >
              Browse all places
              <ArrowRight className="size-4" />
            </Button>
          </div>

          {cities.length ? (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {cities.map((city) => (
                <Link
                  key={city.city}
                  href={`/explore?city=${encodeURIComponent(city.city)}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border bg-background p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FF7A00]/10">
                      <MapPin className="size-5 text-[#FF7A00]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{city.city}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(city.count)}{" "}
                        {city.count === 1 ? "place" : "places"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                title="No cities yet"
                description="Cities will appear here once accessible places are approved."
              />
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
              Browse by category
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Find the places you need
            </h2>
            <p className="mt-4 text-muted-foreground">
              From cafes to libraries, explore accessible places by the category
              that matters to you.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 12).map((category) => (
              <Link
                key={category.id}
                href={`/explore?categoryId=${category.id}`}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-[#FF7A00]/40 hover:text-[#FF7A00]"
              >
                {category.name}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {formatNumber(category.count)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section
        id="about"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to move with confidence
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built with and for people with disabilities, caregivers and anyone
            who wants fewer surprises on the way.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#FF7A00]/10">
                  <Icon className="size-5 text-[#FF7A00]" />
                </span>
                <h3 className="mt-4 text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#FF7A00]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to a smoother journey
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="relative text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full border bg-background shadow-sm">
                    <Icon className="size-6 text-[#FF7A00]" />
                  </div>
                  <span className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


    </main>
  );
};

export default HomePage;
