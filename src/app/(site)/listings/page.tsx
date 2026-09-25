import Link from "next/link";
import Image from "next/image";
import { getListingsWithStatus } from "@/lib/listings";
import { getSettings } from "@/lib/settings";
import ListingCard from "@/components/ListingCard";
import PhotoHero from "@/components/PhotoHero";
import Ticker from "@/components/Ticker";

const HERO_PHOTOS = ["/redesign/hero-1.jpg", "/redesign/hero-2.jpg", "/redesign/hero-3.jpg"];

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string }>;
}) {
  const { tab, sort } = await searchParams;
  const activeTab = tab === "sale" ? "sale" : "rent";
  const type = activeTab === "rent" ? "rental" : "sale";
  const activeSort = sort === "newest" ? "newest" : "price";

  const [{ listings, unavailable }, settings] = await Promise.all([
    getListingsWithStatus(),
    getSettings(),
  ]);
  const telHref = `tel:${settings.officePhone.replace(/[^\d+]/g, "")}`;
  const rentCount = listings.filter((l) => l.type === "rental" && l.status === "available" && !l.archived).length;
  const saleCount = listings.filter((l) => l.type === "sale" && l.status === "available" && !l.archived).length;

  const items = listings
    .filter((l) => l.type === type && l.status === "available" && !l.archived)
    .sort((a, b) =>
      activeSort === "price"
        ? a.price - b.price
        : (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
    );

  const sortHref = (nextSort: string) => `/listings?tab=${activeTab}&sort=${nextSort}`;

  return (
    <>
      <PhotoHero photos={HERO_PHOTOS} padding="96px 2.5rem 30px">
        <h1 className="hero-title" style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.6rem)" }}>
          {activeTab === "rent" ? (
            <>
              The possibilities
              <br />
              <em>are endless.</em>
            </>
          ) : (
            <>
              Built to keep,
              <br />
              <em>offered anyway.</em>
            </>
          )}
        </h1>
        <div className="listing-controls">
          <div className="tabs">
            <Link className={`tab${activeTab === "rent" ? " active" : ""}`} href={`/listings?tab=rent&sort=${activeSort}`}>
              For Rent &middot; {rentCount}
            </Link>
            <Link className={`tab${activeTab === "sale" ? " active" : ""}`} href={`/listings?tab=sale&sort=${activeSort}`}>
              For Sale &middot; {saleCount}
            </Link>
          </div>
          <div className="sort-group">
            <Link className={`sort-pill${activeSort === "price" ? " active" : ""}`} href={sortHref("price")}>
              Price ↑ Low to High
            </Link>
            <Link className={`sort-pill${activeSort === "newest" ? " active" : ""}`} href={sortHref("newest")}>
              Newest Listed
            </Link>
          </div>
        </div>
      </PhotoHero>

      <Ticker />

      <div className="blueprint-grid" style={{ padding: "34px 2.5rem 70px" }}>
        <div className="listing-grid" style={{ padding: 0, maxWidth: 1300, margin: "0 auto" }}>
          {items.length ? (
            items.map((listing) => <ListingCard key={listing.id} listing={listing} />)
          ) : (
            <div className="listing-empty listing-empty-grid">
              <span className="eyebrow">
                {unavailable ? "TEMPORARILY UNAVAILABLE" : "NO PUBLIC OPENINGS TODAY"}
              </span>
              <h2>
                {unavailable
                  ? "Call us for current availability."
                  : activeTab === "rent"
                    ? "Let us know what kind of home you need."
                    : "Ask what is coming next."}
              </h2>
              <p>
                {unavailable
                  ? "The live inventory could not be loaded. The office can give you the latest information."
                  : "Send your preferred city, budget, and timing. We will know what to watch for when inventory changes."}
              </p>
              <div className="empty-actions">
                <Link className="btn btn-red" href="/contact?topic=availability">
                  Contact the office
                </Link>
                <a className="empty-phone" href={telHref}>{settings.officePhone}</a>
              </div>
            </div>
          )}
          <MahtropolisTile />
        </div>
      </div>
    </>
  );
}

function MahtropolisTile() {
  return (
    <Link
      href="/mahtropolis"
      style={{
        position: "relative",
        border: "1px solid var(--border)",
        borderRadius: 5,
        background: "var(--navy-deep)",
        overflow: "hidden",
        minHeight: 340,
        display: "block",
        transition: "transform .45s cubic-bezier(.2,.7,.2,1), box-shadow .45s ease",
      }}
    >
      <Image
        src="/redesign/plat-map.webp"
        alt=""
        fill
        sizes="(max-width: 900px) 100vw, 33vw"
        style={{
          objectFit: "cover",
          filter: "invert(1) sepia(1) hue-rotate(185deg) saturate(3.2) brightness(.6) contrast(1.15)",
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(16,26,52,.93) 32%, rgba(16,26,52,.25) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--red-soft)",
          }}
        >
          MAHTROPOLIS &middot; COMPLETE
        </span>
        <div
          style={{
            marginTop: 14,
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: "1.9rem",
            lineHeight: 1.05,
            color: "#fff",
          }}
        >
          A little bigger
          <br />
          <em style={{ fontStyle: "italic", color: "var(--red-soft)" }}>than we let on.</em>
        </div>
        <div
          style={{
            marginTop: 18,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            paddingBottom: 5,
            borderBottom: "1px solid rgba(255,255,255,.45)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            fontWeight: 600,
            letterSpacing: "0.14em",
            color: "#fff",
          }}
        >
          TAKE A LOOK<span style={{ color: "var(--red-soft)" }}>→</span>
        </div>
      </div>
    </Link>
  );
}
