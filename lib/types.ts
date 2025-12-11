export type PurchaseType = 'mp3' | 'wav' | 'exclusive';

export interface Beat {
    id: string;
    title: string;
    artists: string[]; // Postgres text[]
    beat_key: string | null;
    bpm: number;
    s3_key_mp3: string;
    s3_key_wav: string;
    price_mp3_lease_cents: number;
    price_wav_lease_cents: number;
    price_exclusive_cents: number;
    created_at: string; // ISO timestamp
}

export interface PreviewResponse {
    url: string;
}

export interface Order {
    order_id: string;
    created_at: string;
    beat_id: string;
    status: string;
    purchase_type: PurchaseType;
    amount_cents: number;
    currency: string;
    payer_email: string;
    recipient_email: string;
}