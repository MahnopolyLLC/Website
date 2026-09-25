import { getListings } from "@/lib/listings";
import { getSettings } from "@/lib/settings";

// Zillow's rental listing feed (single-unit / "Base Feed Structure" —
// condos, single-family homes, townhouses; not the multifamily/MITS
// structure). Field names, required-ness, and the operational rules
// referenced in comments below are taken from Zillow's own "Rental
// Listing Bulk Feed Guide" (last revised Aug 13, 2026; fetched and read
// directly for this build, not from memory — that guide changes over
// time and an out-of-date field list would fail Zillow's validation).
//
// Per that guide, a feed this small doesn't strictly need to exist:
// "For owners or property managers with a small number of properties,
// consider creating listings directly via Zillow Rental Manager...
// rather than building and maintaining your own feed." William MVP.md
// asks for the feed specifically, so this builds it — but if the
// approval/testing process below turns out heavier than expected,
// manual entry via Rental Manager is a legitimate fallback worth
// remembering.
//
// This route is the "feed" — a static, unchanging URL, per the guide's
// requirement. Getting it live on Zillow additionally requires, outside
// this codebase, emailing rentalfeeds@zillow.com to request approval and
// test-environment setup, then a go-live meeting once test data looks
// right. That approval process is on Zillow's timeline, not ours (see
// the plan's "Zillow feed done criteria").

const COMPANY_ID = "mahnopoly";
// The feed's <Company> block wants the business's own city/state, not
// each listing's — hardcoded to the office location rather than derived
// from settings.officeAddress (a single free-text string, not split into
// parts). Update this if the office ever moves out of Topeka.
const COMPANY_CITY = "Topeka";
const COMPANY_STATE = "KS";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Dashes and underscores in Zillow listing ids "cause issues" / "are
// stripped during parsing" per the feed guide — our own ids (slugified
// addresses, e.g. "1412-sw-clay-st") are full of dashes. Stripped here
// rather than changed at the source, so nothing else in the app has to
// know about Zillow's id constraints.
function zillowSafeId(id: string): string {
  return id.replace(/[-_]/g, "");
}

// <dateAvailable> must be YYYY-MM-DD. Our admin form's "available" field
// is free text ("Sept 1", "—", "ASAP") — not something safe to guess a
// year onto. `new Date("Sept 1")` looked like a reasonable way to parse
// this and is NOT: it silently succeeds with a made-up year (2001 in
// V8's implementation) instead of failing, which would have shipped a
// wrong move-in date to Zillow for every listing whose "available" field
// doesn't literally spell out a year. Caught by manually testing this
// route's actual output before considering it done, not by inspection —
// worth remembering. A strict YYYY-MM-DD regex is the only safe check:
// only emit the tag when staff already typed a real full date; otherwise
// omit it (it's optional). If the Zillow feed matters long-term, that
// field should become a real date input in the admin panel instead of
// free text.
function toZillowDate(available: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(available)) return null;
  const parsed = new Date(`${available}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return available;
}

export async function GET() {
  const [listings, settings] = await Promise.all([getListings(), getSettings()]);

  const contactEmail = process.env.OFFICE_NOTIFICATION_EMAIL || "";
  const contactPhone = settings.officePhone.replace(/\D/g, "");

  // Feed is a complete snapshot — Zillow removes anything simply omitted
  // from it. Only rental listings belong here at all (there's no
  // for-sale concept in this feed format); "available" is the only
  // status that should still be live on Zillow.
  const rentals = listings.filter((l) => l.type === "rental" && l.status === "available" && !l.archived);

  const skipped: string[] = [];
  const listingXml = rentals
    .map((listing) => {
      // <zip> and <street> are required. Rather than crash the whole
      // feed over one incomplete listing, skip it and note why — staff
      // can fill in the missing field from the admin panel and it picks
      // up on the next feed fetch.
      if (!listing.zip) {
        skipped.push(`${listing.id} (missing ZIP code)`);
        return "";
      }

      const fullBaths = Math.floor(listing.baths);
      const halfBaths = listing.baths % 1 !== 0 ? 1 : 0;
      const dateAvailable = toZillowDate(listing.available);
      const lastUpdated = listing.updatedAt
        ? new Date(listing.updatedAt).toISOString()
        : new Date().toISOString();

      const photoTags = listing.photos
        .map((url) => `      <listingPhoto source="${escapeXml(url)}" />`)
        .join("\n");

      return `    <listing id="${escapeXml(zillowSafeId(listing.id))}" type="RENTAL" companyId="${COMPANY_ID}" propertyType="HOUSE">
      <street>${escapeXml(listing.address)}</street>
      <city>${escapeXml(listing.city)}</city>
      <state>KS</state>
      <zip>${escapeXml(listing.zip)}</zip>
      <lastUpdated>${lastUpdated}</lastUpdated>
      <contactEmail>${escapeXml(contactEmail)}</contactEmail>
      <contactPhone>${escapeXml(contactPhone)}</contactPhone>
${listing.description ? `      <description><![CDATA[${listing.description}]]></description>\n` : ""}      <price>${listing.price}</price>
      <numBedrooms>${listing.beds}</numBedrooms>
      <numFullBaths>${fullBaths}</numFullBaths>
${halfBaths ? `      <numHalfBaths>${halfBaths}</numHalfBaths>\n` : ""}${dateAvailable ? `      <dateAvailable>${dateAvailable}</dateAvailable>\n` : ""}${photoTags ? photoTags + "\n" : ""}    </listing>`;
    })
    .filter(Boolean)
    .join("\n");

  if (skipped.length > 0) {
    console.warn("zillow-feed.xml: skipped listings missing required fields:", skipped.join(", "));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<hotPadsItems version="2.1">
  <Company id="${COMPANY_ID}">
    <name>Mahnopoly LLC</name>
    <city>${COMPANY_CITY}</city>
    <state>${COMPANY_STATE}</state>
  </Company>
${listingXml}
</hotPadsItems>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Feed guide: "static, unchanging URL" — no caching directive that
      // would make Zillow's fetcher see stale data, but no need to
      // regenerate on every single request either.
      "Cache-Control": "public, max-age=300",
    },
  });
}
