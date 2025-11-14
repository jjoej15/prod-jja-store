import { listBeats } from '@/lib/db'
import type { Beat } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const beats: Beat[] = await listBeats();
    return Response.json(beats);

  } catch (err: any) {
    return new Response(JSON.stringify({ 
        error: err.message || 'Failed to list beats' 
    }), { status: 500 });
  }
}
