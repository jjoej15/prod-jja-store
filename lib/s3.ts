import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.AWS_REGION || 'us-east-1';

// Reuse client across hot reloads
const globalForS3 = global as unknown as { s3Client?: S3Client };
export const s3: S3Client = globalForS3.s3Client || new S3Client({ region });

if (!globalForS3.s3Client) {
    globalForS3.s3Client = s3;
}

export async function getPreviewUrl(key: string): Promise<string> {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
        throw new Error('S3_BUCKET env var missing');
    }

    const expires = parseInt(process.env.PRESIGN_EXPIRY_SECONDS || '300', 10);
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, cmd, { expiresIn: expires });
}

export async function getObjectStream(key: string) {
    const bucket = process.env.S3_BUCKET
    if (!bucket) 
        throw new Error('S3_BUCKET env var missing');

    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const obj = await s3.send(cmd);
    if (!obj.Body) 
        throw new Error('Empty S3 object body');

    const body: any = obj.Body

    const webStream = typeof body.transformToWebStream === 'function'
        ? body.transformToWebStream()
        : (await import('stream')).Readable.toWeb(body);

    return { 
        stream: webStream, 
        contentType: obj.ContentType || 'application/octet-stream' 
    };
}
