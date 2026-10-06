import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The video montage runs ffmpeg on the server: keep the binary out of the bundle
  // and ship it with the routes that edit ads.
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/ads": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/ads/[id]": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/webhooks/fal": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};

export default nextConfig;
