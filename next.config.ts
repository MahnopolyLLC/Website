import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Property photos live in Supabase Storage's public bucket
    // (supabase/storage.sql). The project ref is fixed per-environment
    // via NEXT_PUBLIC_SUPABASE_URL, but next.config.ts can't read env
    // vars at the type level here, so this allows any *.supabase.co
    // project — safe, since Next/Image only ever fetches what a listing
    // record itself points to, and photo writes are staff-only per RLS.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
