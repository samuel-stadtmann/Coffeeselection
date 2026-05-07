import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      // New strategic sitemap → existing routes (until full rebuild)
      { source: "/quiz/start", destination: "/quiz", permanent: false },
      { source: "/account/dashboard", destination: "/dashboard", permanent: false },
      { source: "/account/:path*", destination: "/dashboard", permanent: false },
      { source: "/checkout/cart", destination: "/checkout/shipping", permanent: false },
      { source: "/recommendation/result", destination: "/match-result", permanent: false },
      { source: "/recommendation/:path*", destination: "/match-result", permanent: false },
      { source: "/subscription/how-it-works", destination: "/atelier", permanent: false },
      { source: "/subscription/:path*", destination: "/atelier", permanent: false },
      { source: "/roasters", destination: "/brewing-guides", permanent: false },
      { source: "/roasters/:path*", destination: "/brewing-guides", permanent: false },
      { source: "/roaster-portal/:path*", destination: "/roaster", permanent: false },
      { source: "/coffee/discovery-box", destination: "/atelier", permanent: false },
      { source: "/coffee/:path*", destination: "/atelier", permanent: false },
      { source: "/learn/:path*", destination: "/brewing-guides", permanent: false },
      { source: "/compare/:path*", destination: "/brewing-guides", permanent: false },
      { source: "/seo-city/:path*", destination: "/", permanent: false },
      { source: "/reviews", destination: "/insights", permanent: false },
      { source: "/partner-with-us", destination: "/contact", permanent: false },
      { source: "/privacy", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
