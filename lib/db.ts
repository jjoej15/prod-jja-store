import { Pool } from 'pg'
import type { Beat } from './types'

// Reuse a single pool across hot reloads in dev.
const globalForDb = global as unknown as { pgPool?: Pool }

export const pool: Pool = globalForDb.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
});

if (!globalForDb.pgPool) {
    globalForDb.pgPool = pool
};

export async function listBeats(): Promise<Beat[]> {
    const res = await pool.query<Beat>(
        'SELECT id, title, artists, beat_key, bpm, s3_key_mp3, ' 
            + 's3_key_wav, price_mp3_lease_cents, price_wav_lease_cents, ' 
            + 'price_exclusive_cents, created_at FROM beats ORDER BY created_at DESC'
    );

    return res.rows.map(r => ({
        ...r,
        created_at: (r as any).created_at instanceof Date
            ? (r as any).created_at.toISOString()
            : r.created_at,
    }))
}
