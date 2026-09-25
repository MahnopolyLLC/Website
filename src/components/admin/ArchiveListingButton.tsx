"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setListingArchivedAction } from "@/app/admin/(protected)/listings/actions";

export default function ArchiveListingButton({
  listingId,
  archived,
}: {
  listingId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await setListingArchivedAction(listingId, !archived);
            if (!result.ok) {
              setError(result.error ?? "Something went wrong.");
              return;
            }
            router.refresh();
          })
        }
        style={{ color: "var(--navy)", background: "none", border: "none", cursor: "pointer", font: "inherit" }}
      >
        {isPending ? "Saving…" : archived ? "Unarchive" : "Archive"}
      </button>
      {error && <span style={{ color: "#9a1f1f", fontSize: "0.85rem" }}>{error}</span>}
    </span>
  );
}
