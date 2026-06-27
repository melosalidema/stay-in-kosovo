import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org"
      },
      {
        protocol: "https",
        hostname: "static.wixstatic.com"
      },
      {
        protocol: "https",
        hostname: "images.weserv.nl"
      },
      {
        protocol: "https",
        hostname: "media.4-paws.org"
      },
      {
        protocol: "https",
        hostname: "dynamic-media-cdn.tripadvisor.com"
      }
    ]
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"]
};

export default withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true
})(nextConfig);
