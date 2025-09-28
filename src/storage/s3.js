// storage/s3.js
import { S3Client, HeadBucketCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.S3_BUCKET;
if (!BUCKET) throw new Error("S3_BUCKET env var is required");

let s3;         // S3 client bound to bucket's region
let S3_REGION;  // cached region

export function S3KeyFor(prefix, id) {
  return `${prefix}/${id}.pdf`;
}

async function getBucketRegion() {
  // Try env first; fall back to a probe if wrong/missing
  const guess = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
  let client = new S3Client({ region: guess });
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    return guess; // guess was correct
  } catch (err) {
    // When region is wrong, AWS returns x-amz-bucket-region
    const hdr = err?.$response?.headers?.["x-amz-bucket-region"] || err?.Code === "PermanentRedirect" && err?.Region;
    if (!hdr) throw err;
    return hdr;
  }
}

async function ensureS3() {
  if (s3) return;
  S3_REGION = await getBucketRegion();
  s3 = new S3Client({ region: S3_REGION });
}

export async function uploadPdfStreamToS3(readable, key) {
  await ensureS3();
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: readable,
      ContentType: "application/pdf",
    }
  });
  return uploader.done();
}

export async function getDownloadUrl(key, seconds = 900) {
  await ensureS3();
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: seconds });
}
