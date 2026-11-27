import {
  Accessibility,
  Building2,
  Check,
  Compass,
  Eye,
  Flag,
  HandHeart,
  Layers,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Navigation,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services · AccessPath",
  description:
    "What AccessPath offers: an accessible place directory, an accessibility map, barrier-free route planning, live issue reports and community-verified contributions.",
};

const accent = "text-[#FF7A00]";
const accentTile = "bg-[#FF7A00]/10";

const services = [
  {
    icon: Search,
    title: "Accessible place directory",
    description:
      "Search any place by name, category or neighbourhood and read what is actually waiting for you at the door.",
    points: [
      "Entrances, ramps, elevators, restrooms and parking",
      "Photos and notes from people who have been there",
      "Filters for the features you need",
    ],
  },
  {
    icon: MapIcon,
    title: "Accessibility map",
    description:
      "Every place on one map, so you can compare a whole street before you leave the house.",
    points: [
      "Pins sized and faded by zoom, never hidden behind counts",
      "Filter by feature or category as you pan",
      "Tap any pin for its details and directions",
    ],
  },
  {
    icon: Route,
    title: "Barrier-free route planner",
    description:
      "Routes that follow real streets and tell you what you will meet on the way, not just a straight line between two points.",
    points: [
      "Start from a place search, your location or a pin on the map",
      "Walking, wheelchair, cycling and driving modes",
      "Barriers, detours and a score for each option",
    ],
  },
  {
    icon: Accessibility,
    title: "Accessibility records",
    description:
      "Each feature is recorded as available, not available, or simply unknown — so a gap is never mistaken for a green tick.",
    points: [
      "Three-state answers: yes, no, not recorded",
      "A 0–100 score from the community, kept separate from facts",
      "Verified details marked as verified",
    ],
  },
  {
    icon: Flag,
    title: "Live issue reports",
    description:
      "A broken lift or a blocked ramp today is not the same place it was last month — report it and see what others found.",
    points: [
      "Report closures, broken equipment and hazards",
      "Reports stay visible until they are resolved",
      "Shown next to the place, not buried in a comment",
    ],
  },
  {
    icon: MessageSquare,
    title: "Community reviews & contributions",
    description:
      "The data comes from people who use these spaces. Anyone can add a place, correct a detail or record accessibility.",
    points: [
      "Guided three-step contribution form",
      "Every submission reviewed by a moderator",
      "Track your own submissions and their status",
    ],
  },
];

const audiences = [
  {
    icon: Accessibility,
    title: "Wheelchair and mobility aid users",
    description:
      "Know whether there is a step-free entrance, a lift that works and a restroom you can use before you arrive.",
  },
  {
    icon: Eye,
    title: "Blind and low-vision people",
    description:
      "Tactile paving, braille signage and staff help recorded as clear facts, not as marketing claims.",
  },
  {
    icon: HandHeart,
    title: "Caregivers, families and older travellers",
    description:
      "Plan a whole outing with less guesswork — for a parent with a walker or a friend recovering from surgery.",
  },
];

const organisationOffers = [
  "Verified accessibility details for your venue, with evidence attached",
  "Issue reports routed to the people who can fix them",
  "Moderation tools to review and approve contributions",
  "Analytics on which accessibility features visitors ask about",
];

const steps = [
  {
    icon: Compass,
    title: "Find the place",
    description:
      "Search by name or browse the map to see what is nearby and how it scores.",
  },
  {
    icon: ShieldCheck,
    title: "Read what is known",
    description:
      "Features, photos, reports and reviews — with unanswered questions left visibly unanswered.",
  },
  {
    icon: Navigation,
    title: "Plan the way in",
    description:
      "Compare route options for your mode of travel and pick the one with fewest barriers.",
  },
  {
    icon: MapPin,
    title: "Add what you learned",
    description:
      "Your two-minute update is what makes the next person's trip predictable.",
  },
];

const promises = [
  {
    icon: Layers,
    title: "Unknown stays unknown",
    description:
      "If nobody has checked a feature, we show it as not recorded. We never assume a place is accessible.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewed, not anonymous",
    description:
      "New places and corrections pass a moderator before they go live, so the map stays trustworthy.",
  },
  {
    icon: Users,
    title: "Community-owned data",
    description:
      "Details come from visitors and residents, not from venues writing their own reviews.",
  },
  {
    icon: Sparkles,
    title: "Free to use",
    description:
      "Browsing, route planning and contributing cost nothing, and there is no paid placement in the results.",
  },
];

export default function ServicesPage() {
  return (
    <main className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/60 to-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-[#FF7A00]/10 blur-3xl"
        />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Layers className={`size-3.5 ${accent}`} />
              What we offer
            </span>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              One service, built around{" "}
              <span className={accent}>getting in the door.</span>
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              AccessPath is a public accessibility layer for the city: it
              records what places are really like, routes you around the
              barriers, and keeps the information honest — including the parts
              nobody has checked yet.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 px-6 text-base"
                nativeButton={false}
                render={<Link href="/explore/map" />}
              >
                <MapIcon className="size-4" />
                Open the map
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
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        aria-labelledby="services-heading"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p
            className={`text-sm font-semibold tracking-wider uppercase ${accent}`}
          >
            Services
          </p>
          <h2
            id="services-heading"
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Everything in the box
          </h2>
          <p className="mt-4 text-muted-foreground">
            Six things you can do with AccessPath today, all of them free.
          </p>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <li
                key={service.title}
                className="flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-11 items-center justify-center rounded-xl ${accentTile}`}
                >
                  <Icon className={`size-5 ${accent}`} />
                </span>
                <h3 className="mt-4 text-base font-semibold">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {service.description}
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {service.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-[#FF7A00]"
                      />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      {/* WHO IT IS FOR */}
      <section
        aria-labelledby="audience-heading"
        className="border-y bg-muted/30"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className={`text-sm font-semibold tracking-wider uppercase ${accent}`}
            >
              Who it is for
            </p>
            <h2
              id="audience-heading"
              className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Built for the people who need it most
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <ul className="space-y-4">
              {audiences.map((audience) => {
                const Icon = audience.icon;

                return (
                  <li
                    key={audience.title}
                    className="flex gap-4 rounded-2xl border bg-background p-5"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accentTile}`}
                    >
                      <Icon className={`size-5 ${accent}`} />
                    </span>
                    <span>
                      <span className="block font-semibold">
                        {audience.title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        {audience.description}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-2xl border bg-background p-6">
              <span
                aria-hidden="true"
                className={`flex size-10 items-center justify-center rounded-xl ${accentTile}`}
              >
                <Building2 className={`size-5 ${accent}`} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                Venues, cities and organisations
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                If you run a place or a district, AccessPath gives you a clear,
                public record of your accessibility — and the gaps people
                report.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {organisationOffers.map((offer) => (
                  <li key={offer} className="flex gap-2">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-[#FF7A00]"
                    />
                    <span className="text-muted-foreground">{offer}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-5"
                nativeButton={false}
                render={<a href="mailto:support@accesspath.com" />}
              >
                <MessageSquare className="size-4" />
                Talk to us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        aria-labelledby="cta-heading"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="rounded-3xl border bg-card px-6 py-12 text-center sm:px-12">
          <h2
            id="cta-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Start with the place you are going next
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Look it up, check what is known, and plan the way in. If something
            is missing, two minutes of yours saves the next person a bad trip.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 px-6 text-base"
              nativeButton={false}
              render={<Link href="/explore" />}
            >
              <Compass className="size-4" />
              Browse places
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-6 text-base"
              nativeButton={false}
              render={<Link href="/contribute" />}
            >
              <MapPin className="size-4" />
              Contribute a place
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
