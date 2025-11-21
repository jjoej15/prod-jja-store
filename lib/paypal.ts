import { Client, Environment, LogLevel, OrdersController } from '@paypal/paypal-server-sdk'

// Compute API base URL for fallback fetch calls
export const PAYPAL_API_URL = process.env.ENVIRONMENT === 'PRODUCTION'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

type GlobalPaypal = {
    paypalClient?: Client
    ordersController?: OrdersController
}

const globalForPaypal = global as unknown as GlobalPaypal

export const paypalClient: Client =
    globalForPaypal.paypalClient || new Client({
        clientCredentialsAuthCredentials: {
            oAuthClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '',
            oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
        },
        timeout: 0,
        environment: process.env.ENVIRONMENT === 'PRODUCTION'
            ? Environment.Production
            : Environment.Sandbox,
        logging: {
            logLevel: LogLevel.Info,
            logRequest: { logBody: true },
            logResponse: { logHeaders: true },
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
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
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
