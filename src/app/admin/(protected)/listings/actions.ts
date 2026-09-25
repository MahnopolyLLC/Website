"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  createListing,
  updateListing,
  deleteListing,
  setListingArchived,
  type ListingInput,
  type ListingType,
  type ListingStatus,
} from "@/lib/listings";

export type SaveResult = { ok: false; error: string } | void;

function slugify(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function parseListingForm(formData: FormData): Omit<ListingInput, "id"> & { id?: string } {
  return {
    id: String(formData.get("id") || ""),
    address: String(formData.get("address") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    zip: String(formData.get("zip") || "").trim(),
    neighborhood: String(formData.get("neighborhood") || "").trim(),
    type: (formData.get("type") as ListingType) || "rental",
    status: (formData.get("status") as ListingStatus) || "available",
    price: Number(formData.get("price") || 0),
    beds: Number(formData.get("beds") || 0),
    baths: Number(formData.get("baths") || 0),
    pets: String(formData.get("pets") || "").trim(),
    available: String(formData.get("available") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    // Newline-joined public Supabase Storage URLs, set by the
    // PhotoUpload client component's hidden field (src/components/admin/
    // PhotoUpload.tsx) after real uploads — not free text staff type in.
    photos: String(formData.get("photos") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export async function createListingAction(formData: FormData): Promise<SaveResult> {
  const input = parseListingForm(formData);
  if (!input.address) return { ok: false, error: "Street address is required." };
  if (!input.city) return { ok: false, error: "City is required." };

  const supabase = await getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Not connected to a database yet." };

  const id = slugify(input.address);
  if (!id) return { ok: false, error: "Couldn't generate an ID from that address." };

  const { error } = await createListing(supabase, { ...input, id });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A property with a matching address already exists." };
    }
    console.error("createListingAction: insert failed", error);
    return { ok: false, error: "Something went wrong saving this property." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/listings");
  redirect("/admin");
}

export async function updateListingAction(
  id: string,
  formData: FormData
): Promise<SaveResult> {
  const input = parseListingForm(formData);
  if (!input.address) return { ok: false, error: "Street address is required." };
  if (!input.city) return { ok: false, error: "City is required." };

  const supabase = await getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Not connected to a database yet." };

  const { error } = await updateListing(supabase, id, input);
  if (error) {
    console.error("updateListingAction: update failed", error);
    return { ok: false, error: "Something went wrong saving this property." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath(`/listings/${id}`);
  redirect("/admin");
}

export async function deleteListingAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Not connected to a database yet." };

  const { error } = await deleteListing(supabase, id);
  if (error) {
    console.error("deleteListingAction: delete failed", error);
    return { ok: false, error: "Something went wrong deleting this property." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/listings");
  return { ok: true };
}

export async function setListingArchivedAction(
  id: string,
  archived: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Not connected to a database yet." };

  const { error } = await setListingArchived(supabase, id, archived);
  if (error) {
    console.error("setListingArchivedAction: update failed", error);
    return { ok: false, error: "Something went wrong updating this property." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/listings");
  return { ok: true };
}
