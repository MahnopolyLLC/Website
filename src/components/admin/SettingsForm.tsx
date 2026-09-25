"use client";

import { useState, useTransition } from "react";
import type { SiteSettings } from "@/lib/settings";
import { saveSettings } from "@/app/admin/(protected)/settings/actions";
import PhotoUpload from "./PhotoUpload";

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      setResult(await saveSettings(formData));
    });
  }

  return (
    <form action={handleSubmit}>
      <div className="form-row">
        <label htmlFor="tenantPortalUrl">Tenant portal URL</label>
        <input
          id="tenantPortalUrl"
          name="tenantPortalUrl"
          type="url"
          defaultValue={settings.tenantPortalUrl}
          placeholder="https://…"
        />
      </div>
      <div className="form-row">
        <label htmlFor="payRentUrl">Pay rent URL</label>
        <input
          id="payRentUrl"
          name="payRentUrl"
          type="url"
          defaultValue={settings.payRentUrl}
          placeholder="https://…"
        />
      </div>
      <div className="form-row">
        <label htmlFor="maintenanceRequestUrl">Maintenance request URL</label>
        <input
          id="maintenanceRequestUrl"
          name="maintenanceRequestUrl"
          type="url"
          defaultValue={settings.maintenanceRequestUrl}
          placeholder="https://…"
        />
        <p className="form-note">
          The tenant portal page always shows a Pay Rent button and a
          Maintenance Request button. Each links out once its URL above is
          set; until then it shows &quot;coming soon.&quot;
        </p>
      </div>
      <div className="form-row">
        <label htmlFor="uhaulUrl">U-Haul dealership URL</label>
        <input
          id="uhaulUrl"
          name="uhaulUrl"
          type="url"
          defaultValue={settings.uhaulUrl}
          placeholder="https://…"
        />
        <p className="form-note">
          Adds a U-Haul link to the site navigation. Hidden until set.
        </p>
      </div>
      <div className="two-col">
        <div className="form-row">
          <label htmlFor="officeAddress">Office address</label>
          <input id="officeAddress" name="officeAddress" type="text" defaultValue={settings.officeAddress} />
        </div>
        <div className="form-row">
          <label htmlFor="officePhone">Office phone</label>
          <input id="officePhone" name="officePhone" type="text" defaultValue={settings.officePhone} />
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="officeHours">Office hours</label>
        <input id="officeHours" name="officeHours" type="text" defaultValue={settings.officeHours} />
      </div>
      <div className="two-col">
        <div className="form-row">
          <label htmlFor="facebookUrl">Facebook page URL</label>
          <input
            id="facebookUrl"
            name="facebookUrl"
            type="url"
            defaultValue={settings.facebookUrl}
            placeholder="https://www.facebook.com/…"
          />
        </div>
        <div className="form-row">
          <label htmlFor="instagramUrl">Instagram profile URL</label>
          <input
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            defaultValue={settings.instagramUrl}
            placeholder="https://www.instagram.com/…"
          />
        </div>
      </div>
      <p className="form-note" style={{ marginTop: "-0.5rem" }}>
        Each shows an icon in the site footer once its URL above is set;
        hidden until then.
      </p>

      <PhotoUpload
        initialPhotos={settings.epoxyPhotos}
        fieldName="epoxyPhotos"
        label="Epoxy gallery photos"
        folder="epoxy"
        placeholder="Add photos — shown on the epoxy page in this order"
      />
      <p className="form-note" style={{ marginTop: "-0.5rem", marginBottom: "1.25rem" }}>
        Shows as a gallery on /epoxy once at least one photo is added.
        Hidden entirely until then.
      </p>

      {result && result.ok && (
        <div className="form-success">Settings saved.</div>
      )}
      {result && !result.ok && <div className="form-error">{result.error}</div>}

      <div className="admin-actions">
        <button className="btn btn-navy" type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
