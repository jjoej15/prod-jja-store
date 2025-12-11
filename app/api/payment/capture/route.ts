import { ordersController } from '@/lib/paypal'
import { ApiError } from '@paypal/paypal-server-sdk';
import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/db';
import { Order, PurchaseType } from '@/lib/types';

interface PaymentData {
    orderID: string;
    beatId: string;
    purchaseType: PurchaseType;
    recipient_email?: string;
}

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
async function capturePayPalOrder(orderID: string): Promise<{
    jsonResponse: any;
    httpStatusCode: number;
} | undefined> {
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


const createOrderInDbFromCapture = async (
    captureData: {
        jsonResponse: any;
        httpStatusCode: number;
    } | undefined,
    paymentData: PaymentData
): Promise<Order> => {
    const jsonResp = captureData?.jsonResponse;
    const capture = jsonResp.purchase_units[0].payments.captures[0];
    const payer_email = jsonResp.payer.email_address;
    const amounts = capture.seller_receivable_breakdown;

    const order = await createOrder({
        order_id: paymentData.orderID,
        created_at: capture.create_time,
        beat_id: paymentData.beatId,
        status: jsonResp.status,
        purchase_type: "mp3",
        gross_amount: amounts.gross_amount.value,
        paypal_fee: amounts.paypal_fee.value,
        net_amount: amounts.net_amount.value,
        currency: capture.amount.currency_code,
        payer_email: payer_email,
        recipient_email: paymentData?.recipient_email || payer_email,
    });

    return order;
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
        const order = await createOrderInDbFromCapture(captureData, data);

        return NextResponse.json({
            order: order,
            errDetail: captureData?.jsonResponse.details?.[0]
        },
            { status: captureData!.httpStatusCode }
        );

    } catch (error) {
        console.log('Error capturing order:', error);
        return NextResponse.json({ error: 'Failed to capture order.' }, { status: 500 });
    }
}
