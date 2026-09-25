import Link from "next/link";
import Image from "next/image";
import type { SiteSettings } from "@/lib/settings";

export default function Footer({ settings }: { settings: SiteSettings }) {
  const telHref = `tel:${settings.officePhone.replace(/[^\d+]/g, "")}`;

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
          {settings.officeAddress}
          <br />
          {settings.officeHours}
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
        <a className="foot-phone" href={telHref}>{settings.officePhone}</a>
      </div>
    </footer>
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
