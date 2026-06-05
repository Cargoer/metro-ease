import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = "你的AccountID";
const R2_ACCESS_KEY = "你的R2_ACCESS_KEY";
const R2_SECRET_KEY = "你的R2_SECRET_KEY";

// 配置你的 Cloudflare R2
const s3Client = new S3Client({
  endpoint: "https://你的AccountID.r2.cloudflarestorage.com",
  region: "auto",
  credentials: {
    accessKeyId: "你的R2_ACCESS_KEY",
    secretAccessKey: "你的R2_SECRET_KEY",
  },
});

// 桶名
const BUCKET = "你的桶名";

/**
 * 获取桶内所有文件名称
 */
export async function listAllFiles() {
  try {
    const files = [];
    let continuationToken;

    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        response.Contents.forEach((item) => {
          files.push(item.Key); // 文件名/路径
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return files;
  } catch (err) {
    console.error("获取文件列表失败", err);
    return [];
  }
}

/**
 * 获取单个文件（返回二进制 / 可下载）
 * @param {string} key 文件名，如 a.jpg or dir/file.pdf
 */
export async function getFile(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    // 返回 blob，可直接用于下载、预览图片等
    const blob = await response.Body.transformToByteArray();
    return new Blob([blob]);
  } catch (err) {
    console.error("获取文件失败", err);
    return null;
  }
}