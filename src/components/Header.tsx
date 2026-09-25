"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import type { SiteSettings } from "@/lib/settings";

const NAV_LINKS = [
  { href: "/", label: "Home", match: (path: string) => path === "/" },
  {
    href: "/listings?tab=rent",
    label: "For Rent",
    match: (path: string, tab: string | null) => path === "/listings" && tab !== "sale",
  },
  {
    href: "/listings?tab=sale",
    label: "For Sale",
    match: (path: string, tab: string | null) => path === "/listings" && tab === "sale",
  },
  { href: "/apply", label: "Apply", match: (path: string) => path === "/apply" },
  { href: "/epoxy", label: "Epoxy", match: (path: string) => path === "/epoxy" },
];

export default function Header({ settings }: { settings: SiteSettings }) {
  const telHref = `tel:${settings.officePhone.replace(/[^\d+]/g, "")}`;
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Mahnopoly LLC — home">
        <Image
          src="/redesign/logo.png"
          alt="Mahnopoly LLC"
          width={1003}
          height={190}
          className="brand-logo"
          priority
        />
        <div className="brand-tag">Topeka, Kansas &middot; Est. 2011</div>
      </Link>
      <nav className="main-nav">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            className={`nav-link${link.match(pathname, tab) ? " active" : ""}`}
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
        {settings.uhaulUrl && (
          <a className="nav-link" href={settings.uhaulUrl} target="_blank" rel="noopener noreferrer">
            U-Haul
          </a>
        )}
        <Link className="nav-staff" href="/admin/login">Staff Login</Link>
      </nav>
      <a className="phone-btn" href={telHref}>{settings.officePhone}</a>
    </header>
  );
}
