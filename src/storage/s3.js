// storage/s3.js
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const BUCKET = process.env.S3_BUCKET;

if (!BUCKET) {
  throw new Error("S3_BUCKET env var is required");
}

export function S3KeyFor(prefix, id) {
  return `${prefix}/${id}.pdf`;
}

const s3 = new S3Client({ region: REGION });

export async function uploadPdfStreamToS3(readable, key) {
  // IMPORTANT: do NOT set ContentLength or x-amz-decoded-content-length if unknown
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: readable,
      ContentType: "application/pdf",
      // leave ContentEncoding/ContentLength unset when streaming
    }
  });
  return uploader.done();
}

export async function getDownloadUrl(key, seconds = 900) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: seconds });
}
