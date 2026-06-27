import crypto from "node:crypto";

import { env } from "@/lib/env";

const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

  const transformation = `f_auto,q_auto`;
  const payload = `allowed_formats=${ALLOWED_FORMATS}&folder=${folder}&max_file_size=${MAX_FILE_SIZE}&timestamp=${timestamp}&transformation=${transformation}${env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(payload).digest("hex");

  return {
    configured: true,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
    timestamp,
    signature,
    allowedFormats: ALLOWED_FORMATS,
    maxFileSize: MAX_FILE_SIZE,
    transformation
  };
}
