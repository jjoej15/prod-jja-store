import { Pool } from 'pg'
import type { Beat, Order } from './types'
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
    try {
        const trimId = id.trim();

        const res = await pool.query<Beat>(
            'SELECT id, title, artists, beat_key, bpm, s3_key_mp3, '
            + 's3_key_wav, price_mp3_lease_cents, price_wav_lease_cents, '
            + 'price_exclusive_cents, created_at FROM beats WHERE id = $1 LIMIT 1',
            [trimId]
        );

        if (res.rowCount === 0) return null

        const r = res.rows[0] as any
        return {
            ...(res.rows[0] as Beat),
            created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
        }

    } catch (error) {
        console.error('Error fetching beat by ID:', error);
        return null;
    }
}

export const getCachedBeatById = cache(async (id: string): Promise<Beat | null> => {
    return await getBeatById(id);
});

export const createOrder = async (order: Order): Promise<Order> => {
    const res = await pool.query<Order>(
        `INSERT INTO orders 
        (order_id, created_at, beat_id, status, purchase_type, gross_amount, paypal_fee, net_amount, currency, payer_email, recipient_email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING order_id, created_at, beat_id, status, purchase_type, gross_amount, paypal_fee, net_amount, currency, payer_email, recipient_email`,
        [
            order.order_id,
            order.created_at,
            order.beat_id,
            order.status,
            order.purchase_type,
            order.gross_amount,
            order.paypal_fee,
            order.net_amount,
            order.currency,
            order.payer_email,
            order.recipient_email
        ]
    );

    return res.rows[0];
}
