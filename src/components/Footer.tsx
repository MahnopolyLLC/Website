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
        {(settings.facebookUrl || settings.instagramUrl) && (
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
          </div>
        )}
        <a className="foot-phone" href={telHref}>
          <PhoneIcon />
          {settings.officePhone}
        </a>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
