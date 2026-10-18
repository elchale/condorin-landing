import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static open data layers (public/data) change only when the data pipeline reruns: cache for a week,
  // revalidate in the background. Not "immutable" because the file names carry no content hash.
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
