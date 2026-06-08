import "server-only";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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

/**
 * Cloudflare R2 private bucket으로 직접 업로드할 presigned PUT URL을 생성합니다.
 * 브라우저에서 이 URL로 PUT 하면 Vercel 서버액션 4.5MB 한계를 우회해 대용량 파일을 올릴 수 있습니다.
 * @param key          R2 오브젝트 키 (예: "resources/172...-uuid-file.zip")
 * @param contentType  업로드 파일의 MIME 타입. PUT 시 동일한 Content-Type 헤더를 보내야 합니다.
 * @param expiresIn    URL 유효 시간(초). 기본 120초.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 120
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(R2, cmd, { expiresIn });
}

/**
 * R2 오브젝트를 삭제합니다. (자료 삭제 시 원본 파일 정리)
 */
export async function deleteR2Object(key: string): Promise<void> {
  const cmd = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });
  await R2.send(cmd);
}
