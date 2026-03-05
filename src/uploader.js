const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },
  forcePathStyle: false,
});

async function uploadImage(filePath, key) {
  const body = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: body,
      ContentType: `image/${ext}`,
      ACL: process.env.AWS_ACL || "public-read",
    })
  );

  return `${process.env.CDN_URL}/${key}`;
}

module.exports = { uploadImage };
