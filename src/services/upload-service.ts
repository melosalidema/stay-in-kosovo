import crypto from "node:crypto";

import { env } from "@/lib/env";

export function createCloudinarySignature(folder = "stay-in-kosovo") {
  const timestamp = Math.round(Date.now() / 1000);

  if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
    return {
      configured: false,
      folder,
      timestamp,
      message: "Cloudinary env vars are missing. The UI will use local preview-only uploads."
    };
  }

  const payload = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(payload).digest("hex");

  return {
    configured: true,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
    timestamp,
    signature
  };
}
