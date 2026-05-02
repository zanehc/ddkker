import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Cloudflare R2 private bucket에서 presigned 다운로드 URL을 생성합니다.
 * @param key    R2 오브젝트 키 (예: "resources/template-001.zip")
 * @param expiresIn  URL 유효 시간(초). 기본 60초.
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 60
): Promise<string> {
  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(R2, cmd, { expiresIn });
}
