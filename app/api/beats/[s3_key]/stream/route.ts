import { getObjectRangeStream } from '@/lib/s3';

export const runtime = 'nodejs';

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ s3_key: string }> }
) {
    try {
        const { s3_key } = await ctx.params;

        if (s3_key.endsWith('.wav')) {
            return new Response(
                'WAV files not available for streaming', { status: 400 });
        }
        const range = _req.headers.get('range') || undefined;
        const { stream, contentRange, contentLength } = await getObjectRangeStream(s3_key, range);
        return new Response(stream, {
            status: 206,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Accept-Ranges': 'bytes',
                ...(contentRange ? { 'Content-Range': contentRange } : {}),
                ...(contentLength ? { 'Content-Length': String(contentLength) } : {}),
                'Cache-Control': 'no-store',
            },
        });

    } catch (err: any) {
        return new Response('Internal Server Error', { status: 500 });
    }
}
