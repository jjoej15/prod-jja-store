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

    try {
        const { body, ...httpResponse } = await ordersController.createOrder(
            collect
        );

        return {
            jsonResponse: JSON.parse(body as string),
            httpStatusCode: httpResponse.statusCode,
        };

    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(error.message);
        }
    }
}

export async function POST(request: Request) {
    try {
        const data: OrderData = await request.json();
        console.log('Received order data:', data);

        if (!(data.id && data.totalPrice && data.description)) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        const created = await createOrder(data)
        return NextResponse.json(created!.jsonResponse, { status: created!.httpStatusCode })

    } catch (err) {
        console.error('Create order error:', err)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}
