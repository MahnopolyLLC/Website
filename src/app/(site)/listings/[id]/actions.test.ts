import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { submitInquiry } from "./actions";

vi.mock("@/lib/supabase/public", () => ({
  getSupabasePublicClient: vi.fn(),
}));
vi.mock("@/lib/notify", () => ({
  notifyOfficeOfInquiry: vi.fn(),
}));
vi.mock("@/lib/listings", () => ({
  getListing: vi.fn(),
}));
vi.mock("@/lib/inquiry-protection", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/inquiry-protection")>();
  return {
    ...actual,
    inquiryRequestKey: vi.fn().mockResolvedValue("request-key"),
    consumeLocalInquiryLimit: vi.fn().mockReturnValue(true),
  };
});

import { getSupabasePublicClient } from "@/lib/supabase/public";
import { notifyOfficeOfInquiry } from "@/lib/notify";
import { getListing } from "@/lib/listings";

const mockedGetClient = vi.mocked(getSupabasePublicClient);
const mockedNotify = vi.mocked(notifyOfficeOfInquiry);
const mockedGetListing = vi.mocked(getListing);

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  if (!fd.has("formStartedAt")) fd.set("formStartedAt", String(Date.now() - 5000));
  return fd;
}

function fakeSupabase(rpcResult: { error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

const validFields = {
  name: "Jane Renter",
  email: "jane@example.com",
  phone: "555-1234",
  message: "Is this still available?",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetListing.mockResolvedValue({
    id: "clay-st",
    address: "1412 SW Clay St",
    city: "Topeka",
    zip: "66604",
    neighborhood: "SW Topeka",
    type: "rental",
    status: "available",
    price: 1150,
    beds: 3,
    baths: 2,
    pets: "Cats only",
    available: "2026-09-01",
    description: "",
    photos: [],
    archived: false,
  });
});

describe("submitInquiry", () => {
  it("rejects missing name/email before touching Supabase or Resend", async () => {
    const result = await submitInquiry(
      "clay-st",
      formData({ phone: "555-1234", message: "hi" })
    );

    expect(result).toEqual({ ok: false, error: "Name and email are required." });
    expect(mockedGetClient).not.toHaveBeenCalled();
    expect(mockedNotify).not.toHaveBeenCalled();
  });

  it("fails clearly when Supabase is not configured", async () => {
    mockedGetClient.mockReturnValue(null);

    const result = await submitInquiry("clay-st", formData(validFields));

    expect(result.ok).toBe(false);
    expect(mockedNotify).not.toHaveBeenCalled();
  });

  it("returns a save error and never emails when the RPC fails", async () => {
    const { client, rpc } = fakeSupabase({ error: { message: "db down" } });
    mockedGetClient.mockReturnValue(client);

    const result = await submitInquiry("clay-st", formData(validFields));

    expect(result.ok).toBe(false);
    expect(rpc).toHaveBeenCalledWith(
      "submit_inquiry",
      expect.objectContaining({
        p_listing_id: "clay-st",
        p_name: "Jane Renter",
        p_email: "jane@example.com",
      })
    );
    expect(mockedNotify).not.toHaveBeenCalled();
  });

  it("reports success when both save and email succeed", async () => {
    const { client } = fakeSupabase({ error: null });
    mockedGetClient.mockReturnValue(client);
    mockedNotify.mockResolvedValue({ sent: true });

    const result = await submitInquiry("clay-st", formData(validFields));

    expect(result).toEqual({ ok: true, emailed: true });
  });

  it("still saves the lead when email delivery fails", async () => {
    const { client, rpc } = fakeSupabase({ error: null });
    mockedGetClient.mockReturnValue(client);
    mockedNotify.mockResolvedValue({ sent: false });

    const result = await submitInquiry("clay-st", formData(validFields));

    expect(rpc).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, emailed: false });
  });

  it("saves the lead before attempting email", async () => {
    const callOrder: string[] = [];
    const { client, rpc } = fakeSupabase({ error: null });
    rpc.mockImplementation(async () => {
      callOrder.push("insert");
      return { error: null };
    });
    mockedGetClient.mockReturnValue(client);
    mockedNotify.mockImplementation(async () => {
      callOrder.push("notify");
      return { sent: true };
    });

    await submitInquiry("clay-st", formData(validFields));

    expect(callOrder).toEqual(["insert", "notify"]);
  });
});
