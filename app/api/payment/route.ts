import { NextResponse } from 'next/server';
import { ApiError, CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';
import { ordersController } from '@/lib/paypal'

interface OrderData {
    id: string;
    totalPrice: string;
    description: string;
}

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (orderData: OrderData) => {
    const collect = {
        body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [
                {
                    amount: {
                        currencyCode: "USD",
                        value: orderData.totalPrice,
                    },
                    description: orderData.description,
                },
            ],
        },
        prefer: "return=minimal",
    };

    const { body, ...httpResponse } = await ordersController.createOrder(collect);

    let parsed: any = {};
    if (body && (body as string).length > 0) {
        try {
            parsed = JSON.parse(body as string);
        } catch {
            parsed = { raw: body };
        }
    }

    return {
        jsonResponse: parsed,
        httpStatusCode: httpResponse.statusCode,
    };
}

export async function POST(request: Request) {
    try {
        const raw = await request.text();
        if (!raw) {
            return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
        }

        let data: OrderData;
        try {
            data = JSON.parse(raw);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        console.log('Received order data:', data);

        if (!(data.id && data.totalPrice && data.description)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        const created = await createOrder(data)
        return NextResponse.json(created.jsonResponse, { status: created.httpStatusCode })

    } catch (err) {
        if (err instanceof ApiError) {
            return NextResponse.json(err.result ?? { error: err.message }, { status: err.statusCode ?? 500 })
        }
        console.error('Create order error:', err)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}
