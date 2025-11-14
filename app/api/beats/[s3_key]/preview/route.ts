import { getPreviewUrl } from '@/lib/s3'
import type { PreviewResponse } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(_req: Request, ctx: { params: { s3_key: string } }) {
    try {
        const { s3_key } = await ctx.params;
        const url = await getPreviewUrl(s3_key);
        const payload: PreviewResponse = { url };
        return Response.json(payload);
        
    } catch (err: any) {
        return new Response(JSON.stringify({ 
            error: err.message || 'Preview generation failed' 
        }), { status: 500 });
    }
}
