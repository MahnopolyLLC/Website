import { getSupabasePublicClient } from "@/lib/supabase/public";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SiteSettings {
  tenantPortalUrl: string;
  payRentUrl: string;
  maintenanceRequestUrl: string;
  uhaulUrl: string;
  // No longer drives any UI — the home page's tenant card always shows
  // now (falls back to "coming soon" until tenantPortalUrl is set).
  // Column stays in the DB/type to avoid an unnecessary migration; not
  // exposed in the admin settings form anymore.
  showTenantButtons: boolean;
  officeAddress: string;
  officePhone: string;
  officeHours: string;
  // Photo gallery shown on /epoxy — same shape as a listing's `photos`
  // column (array of property-photos bucket URLs), just global instead
  // of per-listing. Empty until William uploads real job photos.
  epoxyPhotos: string[];
  // Footer social icons — same "empty until set, hidden until then"
  // pattern as the other optional links above.
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
}

// Real values, matching William's Facebook business page — used both as
// the fallback when Supabase isn't reachable and as the seed for the
// settings row itself (see the update below).
const FALLBACK_SETTINGS: SiteSettings = {
  tenantPortalUrl: "",
  payRentUrl: "",
  maintenanceRequestUrl: "",
  uhaulUrl: "",
  showTenantButtons: false,
  officeAddress: "504 SW 2nd Street, Topeka, KS 66603",
  officePhone: "(785) 329-6344",
  officeHours: "Mon–Fri hours",
  epoxyPhotos: [],
  facebookUrl: "https://www.facebook.com/p/MAHnopoly-LLC-100063579943216/",
  // Not set yet — staff can add it in /admin/settings once the profile
  // URL is available; the footer icon stays hidden until then.
  instagramUrl: "",
  xUrl: "",
};

type SettingsRow = {
  tenant_portal_url: string | null;
  pay_rent_url: string | null;
  maintenance_request_url: string | null;
  uhaul_url: string | null;
  show_tenant_buttons: boolean;
  office_address: string | null;
  office_phone: string | null;
  office_hours: string | null;
  epoxy_photos: string[] | null;
  facebook_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
};

function rowToSettings(row: SettingsRow): SiteSettings {
  return {
    tenantPortalUrl: row.tenant_portal_url ?? "",
    payRentUrl: row.pay_rent_url ?? "",
    maintenanceRequestUrl: row.maintenance_request_url ?? "",
    uhaulUrl: row.uhaul_url ?? "",
    showTenantButtons: row.show_tenant_buttons,
    officeAddress: row.office_address || FALLBACK_SETTINGS.officeAddress,
    officePhone: row.office_phone || FALLBACK_SETTINGS.officePhone,
    officeHours: row.office_hours || FALLBACK_SETTINGS.officeHours,
    epoxyPhotos: row.epoxy_photos ?? [],
    facebookUrl: row.facebook_url || FALLBACK_SETTINGS.facebookUrl,
    instagramUrl: row.instagram_url || FALLBACK_SETTINGS.instagramUrl,
    xUrl: row.x_url || FALLBACK_SETTINGS.xUrl,
  };
}

// Publicly readable (per supabase/schema.sql) — used by the home page and
// footer. Falls back to hardcoded defaults if Supabase isn't configured or
// the query fails, same reasoning as src/lib/listings.ts.
export async function getSettings(): Promise<SiteSettings> {
  const supabase = getSupabasePublicClient();
  if (!supabase) return FALLBACK_SETTINGS;

  const { data, error } = await supabase
    .from("settings")
    .select(
      "tenant_portal_url, pay_rent_url, maintenance_request_url, uhaul_url, show_tenant_buttons, office_address, office_phone, office_hours, epoxy_photos, facebook_url, instagram_url, x_url"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    console.error("getSettings: query failed, using fallback", error);
    return FALLBACK_SETTINGS;
  }
  return rowToSettings(data);
}

export async function updateSettings(
  supabase: SupabaseClient,
  settings: SiteSettings
) {
  return supabase
    .from("settings")
    .update({
      tenant_portal_url: settings.tenantPortalUrl,
      pay_rent_url: settings.payRentUrl,
      maintenance_request_url: settings.maintenanceRequestUrl,
      uhaul_url: settings.uhaulUrl,
      show_tenant_buttons: settings.showTenantButtons,
      office_address: settings.officeAddress,
      office_phone: settings.officePhone,
      office_hours: settings.officeHours,
      epoxy_photos: settings.epoxyPhotos,
      facebook_url: settings.facebookUrl,
      instagram_url: settings.instagramUrl,
      x_url: settings.xUrl,
    })
    .eq("id", 1);
}
