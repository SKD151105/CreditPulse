import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function main() {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    console.log(`Setting CORS for bucket: ${bucketName}`);

    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'], // In production, restrict this to CLIENT_URL
            ExposeHeaders: [],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });

    await s3Client.send(command);
    console.log('Successfully set CORS configuration.');
  } catch (err) {
    console.error('Error setting CORS:', err);
  }
}

main();
