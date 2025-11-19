import { Pool } from 'pg'
import type { Beat } from './types'
import { cache } from 'react'

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

export const getCachedBeats = cache(async (): Promise<Beat[]> => {
    return await listBeats();
})

export async function getBeatById(id: string): Promise<Beat | null> {
    const res = await pool.query<Beat>(
        'SELECT id, title, artists, beat_key, bpm, s3_key_mp3, '
        + 's3_key_wav, price_mp3_lease_cents, price_wav_lease_cents, '
        + 'price_exclusive_cents, created_at FROM beats WHERE id = $1 LIMIT 1',
        [id]
    )

    if (res.rowCount === 0) return null

    const r = res.rows[0] as any
    return {
        ...(res.rows[0] as Beat),
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    }
}

export const getCachedBeatById = cache(async (id: string): Promise<Beat | null> => {
    return await getBeatById(id);
});
