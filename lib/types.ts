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
