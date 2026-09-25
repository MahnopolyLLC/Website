"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { updateSettings, type SiteSettings } from "@/lib/settings";

export type SaveSettingsResult = { ok: true } | { ok: false; error: string };

export async function saveSettings(formData: FormData): Promise<SaveSettingsResult> {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Not connected to a database yet." };

  const settings: SiteSettings = {
    tenantPortalUrl: String(formData.get("tenantPortalUrl") || "").trim(),
    payRentUrl: String(formData.get("payRentUrl") || "").trim(),
    maintenanceRequestUrl: String(formData.get("maintenanceRequestUrl") || "").trim(),
    uhaulUrl: String(formData.get("uhaulUrl") || "").trim(),
    showTenantButtons: formData.get("showTenantButtons") === "on",
    officeAddress: String(formData.get("officeAddress") || "").trim(),
    officePhone: String(formData.get("officePhone") || "").trim(),
    officeHours: String(formData.get("officeHours") || "").trim(),
    // PhotoUpload's hidden field (src/components/admin/PhotoUpload.tsx),
    // one URL per line, same convention as a listing's photos field.
    epoxyPhotos: String(formData.get("epoxyPhotos") || "")
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean),
    facebookUrl: String(formData.get("facebookUrl") || "").trim(),
    instagramUrl: String(formData.get("instagramUrl") || "").trim(),
  };

  const { error } = await updateSettings(supabase, settings);
  if (error) {
    console.error("saveSettings: update failed", error);
    return { ok: false, error: "Something went wrong saving settings." };
  }

  // (site)/layout.tsx is force-dynamic (see that file), so pages under it
  // already read fresh settings on every request without this — kept as
  // a harmless no-op for /admin/settings itself, which isn't.
  revalidatePath("/admin/settings");
  return { ok: true };
}
