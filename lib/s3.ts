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


// Ranged streaming support: ~251 KB by default
const DEFAULT_CHUNK = Number.parseInt(process.env.STREAM_CHUNK_BYTES || '257024', 10);

function parseRangeHeader(rangeHeader?: string): { start?: number; end?: number } {
    if (!rangeHeader) 
        return {};
    const m = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (!m) 
        return {};
    const start = m[1] ? Number.parseInt(m[1], 10) : undefined;
    const end = m[2] ? Number.parseInt(m[2], 10) : undefined;
    return { start, end };
}


function normalizeRange(rangeHeader?: string, maxChunk = DEFAULT_CHUNK): string {
    const { start, end } = parseRangeHeader(rangeHeader);
    const s = start ?? 0;
    let e: number;
    if (typeof end === 'number' && end >= s) {
        const requested = end - s + 1;
        e = requested > maxChunk ? s + maxChunk - 1 : end;
    } else {
        e = s + maxChunk - 1;
    }
    return `bytes=${s}-${e}`;
}


export async function getObjectRangeStream(key: string, rangeHeader?: string) {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) 
        throw new Error('S3_BUCKET env var missing');

    const normalizedRange = normalizeRange(rangeHeader);
    const cmd = new GetObjectCommand({ 
        Bucket: bucket, 
        Key: key, 
        Range: normalizedRange 
    });
    const obj = await s3.send(cmd);

    if (!obj.Body) 
        throw new Error('Empty S3 object body');
    const body: any = obj.Body;
    const webStream = typeof body.transformToWebStream === 'function'
        ? body.transformToWebStream()
        : (await import('stream')).Readable.toWeb(body);
    return {
        stream: webStream,
        contentType: obj.ContentType || 'audio/mpeg',
        contentRange: obj.ContentRange, // e.g., bytes 0-1048575/12345678
        contentLength: obj.ContentLength, // size of this chunk
    };
}
