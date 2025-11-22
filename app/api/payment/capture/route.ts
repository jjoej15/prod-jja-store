import { ordersController } from '@/lib/paypal'
import { ApiError } from '@paypal/paypal-server-sdk';
import { NextResponse } from 'next/server';

interface PaymentData {
    orderID: string;
    // Optional future fields:
    name?: string;
    email?: string;
    amount?: string;
}

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
async function capturePayPalOrder(orderID: string) {
    const collect = {
        id: orderID,
        prefer: "return=minimal",
    }

    try {
        console.log(`Capturing order ${orderID}`);

        const { body, ...httpResponse } = await ordersController.captureOrder(collect);
        let parsed: any = {};
        if (body && (body as string).length > 0) {
            try {
                parsed = JSON.parse(body as string);
            } catch (e) {
                console.warn('Failed to parse PayPal capture body, returning raw string');
                parsed = { raw: body };
            }
        }
        return {
            jsonResponse: parsed,
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
        const raw = await request.text();
        if (!raw) {
            return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
        }
        let data: PaymentData;

        try {
            data = JSON.parse(raw);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        if (!data.orderID) {
            return NextResponse.json({ error: 'Missing orderID' }, { status: 400 });
        }

        const captureData = await capturePayPalOrder(data.orderID);

        return NextResponse.json(captureData!.jsonResponse, { status: captureData!.httpStatusCode });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to capture order.' }, { status: 500 });
    }
}
