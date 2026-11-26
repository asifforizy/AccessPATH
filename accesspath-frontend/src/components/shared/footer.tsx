import { Accessibility, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { FaFacebookF, FaGithub, FaLinkedinIn } from "react-icons/fa";
import Logo from "@/assets/logo";

const exploreLinks = [
  { label: "Explore Locations", href: "/explore" },
  { label: "Accessibility Map", href: "/map" },
  { label: "Route Planner", href: "/routes" },
  { label: "Categories", href: "/categories" },
];

const communityLinks = [
  { label: "Contribute a Location", href: "/contribute" },
  { label: "Report an Issue", href: "/reports" },
  { label: "My Favorites", href: "/favorites" },
  { label: "My Dashboard", href: "/dashboard" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Accessibility Statement", href: "/accessibility" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* BRAND */}
          <div className="space-y-4">
            <Link
              href="/"
              aria-label="AccessPath home"
              className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight"
            >
              <Logo size={30} title="AccessPath" className="shrink-0" />
              <span>
                Access<span className="text-primary">Path</span>
              </span>
            </Link>

            <p className="max-w-xs text-sm leading-6 text-muted-foreground">
              Discover accessible places, find barrier-free routes, and explore
              your city with confidence. Together, we are building a more
              inclusive world.
            </p>

            <a
              href="mailto:support@accesspath.com"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="size-4" />
              support@accesspath.com
            </a>

            <div className="flex items-center gap-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <FaFacebookF size={18} />
              </Link>

              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <FaGithub size={20} />
              </Link>

              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <FaLinkedinIn size={20} />
              </Link>
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Explore</h3>

            <ul className="space-y-3">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMMUNITY */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Community</h3>

            <ul className="space-y-3">
              {communityLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Information</h3>

            <ul className="space-y-3">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-muted-foreground">
            © 2026 AccessPath. All rights reserved.
          </p>

          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            Making every path accessible.
          </p>
        </div>
      </div>
    </footer>
  );
}
