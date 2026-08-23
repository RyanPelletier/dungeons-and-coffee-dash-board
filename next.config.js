// Set NEXT_BASE_PATH when building for GitHub Pages, e.g.
//   NEXT_BASE_PATH=/dungeons-and-coffee-dash-board npm run build
// Leave it unset for local dev / emulator testing so the app serves from "/".
const basePath = process.env.NEXT_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  // Firebase Storage image URLs are absolute, so leaving assetPrefix unset
  // (defaults to basePath) is fine for our own static assets.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
