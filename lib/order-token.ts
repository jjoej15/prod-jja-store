import crypto from "crypto";

// order tokens: base64url(json payload) + "." + base64url(hmac(payload))
// note: this provides integrity (tamper detection), not confidentiality (payload is readable)

type OrderTokenPayload = {
    orderId: string;
    beatId: string;
    exp: number; // unix ms
};

function base64UrlEncode(input: string | Buffer) {
    const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
    return buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function base64UrlDecodeToBuffer(input: string) {
    // replace url-safe chars with base64 chars
    const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    return Buffer.from(b64 + pad, "base64");
}

// read signing secret from env; required for both create and verify
function getSecret() {
    const secret = process.env.ORDER_TOKEN_SECRET;
    if (!secret) {
        throw new Error("Missing ORDER_TOKEN_SECRET");
    }
    return secret;
}

// hmac-sha256 over the base64url payload string
function sign(payloadB64: string) {
    const secret = getSecret();
    return crypto.createHmac("sha256", secret).update(payloadB64).digest();
}

export function createOrderToken(input: { orderId: string; beatId: string; ttlSeconds?: number }) {
    // ttl defaults to env var, then 1 day
    const ttlSeconds = input.ttlSeconds ?? Number(process.env.ORDER_TOKEN_TTL_SECONDS ?? "86400");
    const exp = Date.now() + ttlSeconds * 1000;
    const payload: OrderTokenPayload = { orderId: input.orderId, beatId: input.beatId, exp };

    // payload is json, then signed; signature covers the payload string
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const sigB64 = base64UrlEncode(sign(payloadB64));
    return `${payloadB64}.${sigB64}`;
}

export function verifyOrderToken(token: string, expected: { orderId: string; beatId: string }) {
    try {
        // token must have exactly two parts
        const [payloadB64, sigB64] = token.split(".");
        if (!payloadB64 || !sigB64) return null;

        // recompute signature and compare using timing-safe equality
        const expectedSig = sign(payloadB64);
        const actualSig = base64UrlDecodeToBuffer(sigB64);

        const expectedView = Uint8Array.from(expectedSig);
        const actualView = Uint8Array.from(actualSig);

        // length check prevents timingSafeEqual from throwing
        if (actualView.length !== expectedView.length) return null;
        if (!crypto.timingSafeEqual(actualView, expectedView)) return null;

        // parse and validate claims
        const payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString("utf8")) as OrderTokenPayload;
        if (!payload?.orderId || !payload?.beatId || !payload?.exp) return null;

        // enforce binding to the expected order + beat
        if (payload.orderId !== expected.orderId) return null;
        if (payload.beatId !== expected.beatId) return null;

        // reject expired tokens
        if (Date.now() > payload.exp) return null;

        return payload;
    } catch {
        // treat any parse/format error as invalid
        return null;
    }
}
