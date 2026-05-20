import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yszpvlfffkiguorwbyaw.supabase.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    return [
      // igrejamaranata.app + www → maranata.app (301, preservando path + query)
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?:www\\.)?igrejamaranata\\.app",
          },
        ],
        destination: "https://maranata.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
