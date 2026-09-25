import { getSupabasePublicClient } from "@/lib/supabase/public";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ListingType = "rental" | "sale";
export type ListingStatus = "available" | "rented" | "pending" | "sold";

export interface Listing {
  id: string;
  address: string;
  city: string;
  zip: string;
  neighborhood: string;
  type: ListingType;
  status: ListingStatus;
  price: number;
  beds: number;
  baths: number;
  pets: string;
  available: string;
  description: string;
  photos: string[];
  // Staff-only visibility flag, independent of `status` — set when a
  // tenant moves in (or a sale closes) to hide the listing from the
  // public site without deleting it; cleared again ("unarchive") when the
  // unit is available again, e.g. a tenant moves out.
  archived: boolean;
  // Optional because the 5 dev-only FALLBACK_LISTINGS below don't carry
  // one — real rows always do (schema.sql's `updated_at`). Only consumer
  // right now is the Zillow feed's required <lastUpdated> (see
  // src/app/zillow-feed.xml/route.ts).
  updatedAt?: string;
}

// Same placeholder data the app launched with. Used only as a fallback —
// when Supabase isn't configured (local dev without accounts set up) or a
// query fails — so the public site still runs without a database. Once the
// admin panel is in real use, the actual source of truth is the `listings`
// table; this fallback is not kept in sync with it.
const FALLBACK_LISTINGS: Listing[] = [
  {
    id: "clay-st",
    address: "1412 SW Clay St",
    city: "Topeka",
    zip: "",
    neighborhood: "SW Topeka",
    type: "rental",
    status: "available",
    price: 1150,
    beds: 3,
    baths: 2,
    pets: "Cats only",
    available: "Sept 1",
    description: "",
    photos: [],
    archived: false,
  },
  {
    id: "burlingame-rd",
    address: "3317 SW Burlingame Rd",
    city: "Topeka",
    zip: "",
    neighborhood: "NW Topeka",
    type: "rental",
    status: "available",
    price: 1400,
    beds: 4,
    baths: 2,
    pets: "Dogs & cats ok",
    available: "Sept 15",
    description: "",
    photos: [],
    archived: false,
  },
  {
    id: "indiana-ave",
    address: "2208 SE Indiana Ave",
    city: "Topeka",
    zip: "",
    neighborhood: "College Hill",
    type: "rental",
    status: "rented",
    price: 875,
    beds: 2,
    baths: 1,
    pets: "No pets",
    available: "—",
    description: "",
    photos: [],
    archived: false,
  },
  {
    id: "lyman-rd",
    address: "905 NW Lyman Rd",
    city: "Topeka",
    zip: "",
    neighborhood: "Westboro",
    type: "sale",
    status: "pending",
    price: 189900,
    beds: 3,
    baths: 2,
    pets: "—",
    available: "—",
    description: "",
    photos: [],
    archived: false,
  },
  {
    id: "macvicar-ave",
    address: "1725 SW MacVicar Ave",
    city: "Topeka",
    zip: "",
    neighborhood: "Westboro",
    type: "sale",
    status: "available",
    price: 214500,
    beds: 4,
    baths: 3,
    pets: "—",
    available: "—",
    description: "",
    photos: [],
    archived: false,
  },
];

// DB row shape (supabase/schema.sql) differs slightly from the app-facing
// Listing type — `available_date` vs `available`, nullable text columns —
// so this mapping is the one place that difference lives.
type ListingRow = {
  id: string;
  address: string;
  city: string | null;
  zip: string | null;
  neighborhood: string;
  type: ListingType;
  status: ListingStatus;
  price: number;
  beds: number;
  baths: number;
  pets: string | null;
  available_date: string | null;
  description: string | null;
  photos: string[] | null;
  archived: boolean;
  updated_at: string;
};

function rowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    address: row.address,
    city: row.city ?? "",
    zip: row.zip ?? "",
    neighborhood: row.neighborhood,
    type: row.type,
    status: row.status,
    price: Number(row.price),
    beds: row.beds,
    baths: row.baths,
    pets: row.pets ?? "—",
    available: row.available_date ?? "—",
    description: row.description ?? "",
    photos: row.photos ?? [],
    archived: row.archived,
    updatedAt: row.updated_at,
  };
}

const LISTING_COLUMNS =
  "id, address, city, zip, neighborhood, type, status, price, beds, baths, pets, available_date, description, photos, archived, updated_at";

export type ListingsLoadResult = {
  listings: Listing[];
  unavailable: boolean;
};

function developmentFallback(): ListingsLoadResult {
  if (process.env.NODE_ENV !== "production") {
    return { listings: FALLBACK_LISTINGS, unavailable: false };
  }
  return { listings: [], unavailable: true };
}

// Public marketing pages use the status-bearing version so an actual empty
// portfolio can be distinguished from a database outage. Production never
// substitutes the realistic development fixtures: showing an old address and
// price as available is worse than showing a clear temporary-unavailable
// message.
export async function getListingsWithStatus(): Promise<ListingsLoadResult> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return developmentFallback();

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getListings: query failed", error);
    return developmentFallback();
  }
  return { listings: data.map(rowToListing), unavailable: false };
}

export async function getListings(): Promise<Listing[]> {
  return (await getListingsWithStatus()).listings;
}

export async function getListing(id: string): Promise<Listing | undefined> {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return process.env.NODE_ENV !== "production"
      ? FALLBACK_LISTINGS.find((l) => l.id === id)
      : undefined;
  }

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getListing: query failed", error);
    return undefined;
  }
  return data ? rowToListing(data) : undefined;
}

export function formatPrice(listing: Pick<Listing, "type" | "price">): string {
  const p = listing.price.toLocaleString();
  return listing.type === "rental" ? `$${p}/mo` : `$${p}`;
}

export const STATUS_LABEL: Record<ListingStatus, string> = {
  available: "Available",
  rented: "Rented",
  pending: "Pending",
  sold: "Sold",
};

// --- Admin writes -----------------------------------------------------
// These take an already-authenticated admin client (see
// src/lib/supabase/server.ts) rather than fetching one themselves, so
// every caller is explicit about running with staff privileges.

export interface ListingInput {
  id: string;
  address: string;
  city: string;
  zip: string;
  neighborhood: string;
  type: ListingType;
  status: ListingStatus;
  price: number;
  beds: number;
  baths: number;
  pets: string;
  available: string;
  description: string;
  photos: string[];
}

export async function createListing(
  supabase: SupabaseClient,
  input: ListingInput
) {
  return supabase.from("listings").insert({
    id: input.id,
    address: input.address,
    city: input.city,
    zip: input.zip,
    neighborhood: input.neighborhood,
    type: input.type,
    status: input.status,
    price: input.price,
    beds: input.beds,
    baths: input.baths,
    pets: input.pets,
    available_date: input.available,
    description: input.description,
    photos: input.photos,
  });
}

export async function updateListing(
  supabase: SupabaseClient,
  id: string,
  input: Omit<ListingInput, "id">
) {
  return supabase
    .from("listings")
    .update({
      address: input.address,
      city: input.city,
      zip: input.zip,
      neighborhood: input.neighborhood,
      type: input.type,
      status: input.status,
      price: input.price,
      beds: input.beds,
      baths: input.baths,
      pets: input.pets,
      available_date: input.available,
      description: input.description,
      photos: input.photos,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function deleteListing(supabase: SupabaseClient, id: string) {
  return supabase.from("listings").delete().eq("id", id);
}

export async function setListingArchived(
  supabase: SupabaseClient,
  id: string,
  archived: boolean
) {
  return supabase.from("listings").update({ archived }).eq("id", id);
}
