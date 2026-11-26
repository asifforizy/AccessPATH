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

import { Button } from "@/components/ui/button";

const heroImage =
  "https://i.ibb.co.com/DDtPsDYV/3d-view-map.jpg?auto=format&fit=crop&w=900&q=80";

const stats = [
  { value: "2,400+", label: "Accessible places" },
  { value: "18", label: "Cities covered" },
  { value: "5,000+", label: "Community contributors" },
];

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

const places = [
  {
    name: "The Blue Door Café",
    city: "Portland, OR",
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80",
    tags: ["Step-free entry", "Accessible restroom"],
  },
  {
    name: "Riverside Park",
    city: "Austin, TX",
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=900&q=80",
    tags: ["Paved paths", "Tactile signage"],
  },
  {
    name: "Central Library",
    city: "Seattle, WA",
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
    tags: ["Elevator access", "Quiet rooms"],
  },
];

const HomePage = () => {
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

            <div className="absolute -bottom-6 -left-4 w-56 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:-left-8">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#FF7A00]/10">
                  <Star className="size-4 text-[#FF7A00]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">4.9 accessibility</p>
                  <p className="text-xs text-muted-foreground">
                    from 1,200 reviews
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y rounded-2xl border bg-background/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-5 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              Hand-picked spots loved by the community for their thoughtful
              accessibility.
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <article
              key={place.name}
              className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="overflow-hidden">
                <img
                  src={place.image}
                  alt={place.name}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{place.name}</h3>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {place.city}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FF7A00]/10 px-2.5 py-1 text-sm font-medium text-[#FF7A00]">
                    <Star className="size-3.5 fill-current" />
                    {place.rating}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {place.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#FF7A00]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-[#FF7A00]/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Help make every path accessible
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Share what you know about the places around you. Your reviews and
              reports help someone else travel with confidence today.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 bg-[#FF7A00] px-6 text-base text-white hover:bg-[#e66e00]"
                nativeButton={false}
                render={<Link href="/contribute" />}
              >
                Contribute a place
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-11 border-primary-foreground/30 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                Create free account
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
