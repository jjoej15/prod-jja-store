import { Client, Environment, LogLevel, OrdersController } from '@paypal/paypal-server-sdk'

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENVIRONMENT === 'PRODUCTION'

// Compute API base URL for fallback fetch calls
const PAYPAL_API_URL = IS_PRODUCTION
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

const PAYPAL_CLIENT_ID = IS_PRODUCTION 
    ? process.env.NEXT_PUBLIC_PROD_PAYPAL_CLIENT_ID ?? "" 
    : process.env.NEXT_PUBLIC_SANDBOX_PAYPAL_CLIENT_ID ?? "";

const PAYPAL_CLIENT_SECRET = IS_PRODUCTION 
    ? process.env.PROD_PAYPAL_CLIENT_SECRET ?? ""
    : process.env.SANDBOX_PAYPAL_CLIENT_SECRET ?? "";

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('Missing PayPal client ID or secret in environment variables');
}

type GlobalPaypal = {
    paypalClient?: Client
    ordersController?: OrdersController
}

const globalForPaypal = global as unknown as GlobalPaypal

export const paypalClient: Client =
    globalForPaypal.paypalClient || new Client({
        clientCredentialsAuthCredentials: {
            oAuthClientId: PAYPAL_CLIENT_ID,
            oAuthClientSecret: PAYPAL_CLIENT_SECRET,
        },
        timeout: 0,
        environment: IS_PRODUCTION
            ? Environment.Production
            : Environment.Sandbox,
        logging: {
            logLevel: IS_PRODUCTION ? LogLevel.Warn : LogLevel.Info,
            maskSensitiveHeaders: true,
            logRequest: IS_PRODUCTION ? { logBody: false, logHeaders: false } : { logBody: true, logHeaders: false },
            logResponse: IS_PRODUCTION ? { logBody: false, logHeaders: false } : { logBody: false, logHeaders: true },
        },
    });

export const ordersController: OrdersController =
    globalForPaypal.ordersController || new OrdersController(paypalClient)

if (!globalForPaypal.paypalClient) {
    globalForPaypal.paypalClient = paypalClient
}
if (!globalForPaypal.ordersController) {
    globalForPaypal.ordersController = ordersController
}


export async function getPayPalAccessToken(): Promise<string> {
    const clientId = PAYPAL_CLIENT_ID
    const clientSecret = PAYPAL_CLIENT_SECRET
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const resp = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    })
    if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(`PayPal token error: ${resp.status} ${txt}`)
    }
    const data = await resp.json()
    return data.access_token as string
}
