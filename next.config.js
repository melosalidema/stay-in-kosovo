/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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

module.exports = nextConfig;
