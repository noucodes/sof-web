import type { NextConfig } from "next";

// The ops knowledge base runs on EC2 (ops-kb repo, kb.burdens.dev) and is served here at /kb, on this
// domain, so the browser sends the portal's login cookie with it. The KB checks that token with sof-api.
const KB_URL = process.env.KB_URL ?? "https://kb.burdens.dev";

const nextConfig: NextConfig = {
  rewrites: async () => [
    { source: "/kb", destination: `${KB_URL}/kb` },
    { source: "/kb/:path*", destination: `${KB_URL}/kb/:path*` },
  ],
};

export default nextConfig;
