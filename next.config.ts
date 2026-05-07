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
      // /quiz (no path) → start
      { source: "/quiz", destination: "/quiz/start", permanent: false },
      // New strategic sitemap → existing routes (until full rebuild)
      { source: "/dashboard", destination: "/account/dashboard", permanent: false },
      { source: "/insights", destination: "/account/taste-profile", permanent: false },
      { source: "/account", destination: "/account/dashboard", permanent: false },
      { source: "/checkout/cart", destination: "/checkout/shipping", permanent: false },
      { source: "/recommendation/result", destination: "/match-result", permanent: false },
      { source: "/recommendation/:path*", destination: "/match-result", permanent: false },
      { source: "/atelier", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/how-it-works", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/discovery-subscription", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/plans", destination: "/subscription/discovery", permanent: false },
      { source: "/subscription/classic-subscription", destination: "/subscription/discovery", permanent: false },
      { source: "/roaster-portal/:path*", destination: "/roaster", permanent: false },
      { source: "/coffee", destination: "/subscription/discovery", permanent: false },
      { source: "/coffee/discovery-box", destination: "/subscription/discovery", permanent: false },
      { source: "/coffee/new-arrivals", destination: "/subscription/discovery", permanent: false },
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
