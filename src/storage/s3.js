cat > src/storage/s3.js <<'EOF'
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const S3_BUCKET = process.env.S3_BUCKET;
if (!S3_BUCKET) throw new Error("Missing S3_BUCKET in environment");

export const s3 = new S3Client({ region: REGION });

export function s3KeyFor(type, id) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${type}/${id}/${ts}.pdf`;
}

export async function uploadPdfStreamToS3(readableStream, key, contentType="application/pdf") {
  const uploader = new Upload({
    client: s3,
    params: { Bucket: S3_BUCKET, Key: key, Body: readableStream, ContentType: contentType },
  });
  return await uploader.done();
}

export async function getDownloadUrl(key, expiresSeconds=900) {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const getCmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return await getSignedUrl(s3, getCmd, { expiresIn: expiresSeconds });
}
EOF
