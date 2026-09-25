import Link from "next/link";
import Image from "next/image";
import type { SiteSettings } from "@/lib/settings";

export default function Footer({ settings }: { settings: SiteSettings }) {
  const telHref = `tel:${settings.officePhone.replace(/[^\d+]/g, "")}`;
  // officeHours is one comma-separated string ("Mon–Thu 8am–3pm, Fri
  // 8am–4pm, Sat–Sun 8am–12pm") — split for display so each day range
  // gets its own stacked line instead of running together as one row.
  const hoursLines = settings.officeHours.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <footer className="site-footer" id="contact">
      <div>
        <Link href="/" aria-label="Mahnopoly LLC — home" className="foot-logo-link">
          <Image
            src="/redesign/logo-white.png"
            alt="Mahnopoly LLC"
            width={1003}
            height={190}
            className="foot-logo"
          />
        </Link>
        <div className="foot-meta">
          <span className="foot-meta-row">
            <PinIcon />
            {settings.officeAddress}
          </span>
          {hoursLines.map((line) => (
            <span key={line} className="foot-meta-row foot-hours-line">
              {line}
            </span>
          ))}
        </div>
      </div>
      <nav className="foot-nav" aria-label="More pages">
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/mahtropolis">Mahtropolis</Link>
      </nav>
      <div className="foot-right">
        <a className="foot-phone" href={telHref}>
          <PhoneIcon />
          {settings.officePhone}
        </a>
        {(settings.facebookUrl || settings.instagramUrl || settings.xUrl) && (
          <div className="foot-social" aria-label="Follow us">
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Mahnopoly LLC on Facebook">
                <FacebookIcon />
              </a>
            )}
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Mahnopoly LLC on Instagram">
                <InstagramIcon />
              </a>
            )}
            {settings.xUrl && (
              <a href={settings.xUrl} target="_blank" rel="noopener noreferrer" aria-label="Mahnopoly LLC on X">
                <XIcon />
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

// Solid glyph (not the thin-stroke outline variant) to match Facebook
// and X's fill weight — mixing a thin outline icon in with two solid
// ones is what actually made Instagram/Facebook look mismatched, more
// than any size difference.
function InstagramIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
