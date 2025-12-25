import { ordersController } from '@/lib/paypal'
import { ApiError } from '@paypal/paypal-server-sdk';
import { NextResponse } from 'next/server';
import { createOrder, getBeatById } from '@/lib/db';
import { Order, PurchaseType } from '@/lib/types';
import { createOrderToken } from '@/lib/order-token';
import { getDownloadUrl } from '@/lib/s3';
import { generateMp3LeaseContractPdf } from '@/lib/contracts/mp3-lease';
import { sendEmail } from '@/lib/email';

interface PaymentData {
    orderID: string;
    beatId: string;
    purchaseType: PurchaseType;
    recipientEmail?: string;
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
        prefer: "return=representation",
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
    if (!jsonResp?.purchase_units?.[0]?.payments?.captures?.[0]) {
        throw new Error('PayPal capture response missing capture details');
    }
    const capture = jsonResp.purchase_units[0].payments.captures[0];
    const payer_email = jsonResp.payer.email_address;
    const amounts = capture.seller_receivable_breakdown;

    const order = await createOrder({
        order_id: paymentData.orderID,
        created_at: capture.create_time,
        beat_id: paymentData.beatId,
        status: jsonResp.status,
        purchase_type: paymentData.purchaseType,
        gross_amount: amounts.gross_amount.value,
        paypal_fee: amounts.paypal_fee.value,
        net_amount: amounts.net_amount.value,
        currency: capture.amount.currency_code,
        payer_email: payer_email,
        recipient_email: paymentData?.recipientEmail || payer_email,
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
        if (!data.beatId) {
            return NextResponse.json({ error: 'Missing beatId' }, { status: 400 });
        }

        const captureData = await capturePayPalOrder(data.orderID);
        const order = await createOrderInDbFromCapture(captureData, data);

        const token = createOrderToken({ orderId: data.orderID, beatId: data.beatId });

        let contractEmailSent = false;
        let contractEmailError: string | undefined;

        try {
            const jsonResp = captureData?.jsonResponse;
            const capture = jsonResp?.purchase_units?.[0]?.payments?.captures?.[0];
            const payerEmail: string | undefined = jsonResp?.payer?.email_address;

            const isCompleted = jsonResp?.status === 'COMPLETED';
            const isMp3Lease = data.purchaseType === 'mp3';

            if (isCompleted && isMp3Lease && payerEmail && capture?.id) {
                const beat = await getBeatById(data.beatId);
                if (!beat) {
                    throw new Error(`Beat not found for id=${data.beatId}`);
                }

                const downloadUrl = await getDownloadUrl(beat.s3_key_mp3, 60 * 60 * 24);

                const payerName = [jsonResp?.payer?.name?.given_name, jsonResp?.payer?.name?.surname]
                    .filter(Boolean)
                    .join(' ')
                    || 'Customer';

                const createdAt = capture?.create_time ? new Date(capture.create_time) : new Date();
                const contractDate = createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });

                const { pdf, filename } = await generateMp3LeaseContractPdf({
                    orderNumber: order.order_id,
                    contractDate,
                    trackName: beat.title,
                    customerFullName: payerName,
                    customerEmail: payerEmail,
                    mp3LeasePriceInDollars: order.gross_amount,
                    purchaseCode: capture.id,
                    trackId: beat.id,
                });

                await sendEmail({
                    to: payerEmail,
                    subject: `jj.aholics - ${beat.title}: MP3 Lease Contract`,
                    text:
                        `thanks for your purchase!\n\n`
                        + `attached is your mp3 lease contract.\n\n`
                        + `your download link (valid for 24 hours):\n${downloadUrl}\n\n`
                        + `order: ${order.order_id}\n`
                        + `beat: ${beat.title}\n`,
                    attachments: [{
                        filename,
                        content: pdf,
                        contentType: 'application/pdf',
                    }],
                });

                contractEmailSent = true;
            }
        } catch (e) {
            contractEmailError = e instanceof Error ? e.message : String(e);
            console.error('Failed to generate/send MP3 lease contract:', e);
        }

        return NextResponse.json({
            ok: true,
            order: order,
            token,
            errDetail: captureData?.jsonResponse.details?.[0],
            contractEmailSent,
            contractEmailError,
        },
            { status: captureData!.httpStatusCode }
        );

    } catch (error) {
        console.log('Error capturing order:', error);
        return NextResponse.json({ error: 'Failed to capture order.' }, { status: 500 });
    }
}
