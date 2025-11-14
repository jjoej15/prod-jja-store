import { getObjectStream } from '@/lib/s3';

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
        
        const { stream } = await getObjectStream(s3_key);
        return new Response(stream, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-store',
            },
        });

    } catch (err: any) {
        return new Response('Internal Server Error', { status: 500 });
    }
}
