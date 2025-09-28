// src/storage/s3.js
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const BUCKET = process.env.S3_BUCKET;

const s3 = new S3Client({ region: REGION });

function _buildKey({ prefix = "pdfs", ext = "pdf" } = {}) {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const id = randomUUID();
  return `${prefix}/${y}/${m}/${d}/${id}.${ext}`;
}

// canonical export (camelCase)
export function s3KeyFor(opts = {}) {
  return _buildKey(opts);
}

// alias in PascalCase (so both imports work)
export const S3KeyFor = s3KeyFor;

export async function uploadPdfStreamToS3(readableStream, { Key, Bucket = BUCKET } = {}) {
  if (!Bucket) throw new Error("S3 bucket not configured (S3_BUCKET).");
  if (!Key) Key = s3KeyFor();

  const cmd = new PutObjectCommand({
    Bucket,
    Key,
    Body: readableStream,
    ContentType: "application/pdf",
  });
  await s3.send(cmd);
  return Key;
}

export async function getDownloadUrl(Key, { Bucket = BUCKET, Expires = 3600 } = {}) {
  if (!Bucket) throw new Error("S3 bucket not configured (S3_BUCKET).");
  if (!Key) throw new Error("Key is required to create a download URL.");
  const cmd = new GetObjectCommand({ Bucket, Key });
  return getSignedUrl(s3, cmd, { expiresIn: Expires });
}
