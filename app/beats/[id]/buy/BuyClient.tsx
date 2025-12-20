"use client";
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { centsToUSD } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Beat, PurchaseType } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function BuyClient({ beatToBuy }: { beatToBuy: Beat | null }) {
    const router = useRouter();
    const [purchaseType, setPurchaseType] = useState<PurchaseType>("mp3");
    const [isProcessing, setIsProcessing] = useState(false);
    const [paypalError, setPaypalError] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");

    const totalCents = useMemo(() => {
        if (!beatToBuy) return 0;
        switch (purchaseType) {
            case "mp3":
                return beatToBuy.price_mp3_lease_cents;
            case "wav":
                return beatToBuy.price_wav_lease_cents;
            case "exclusive":
                return beatToBuy.price_exclusive_cents;
            default:
                return beatToBuy.price_mp3_lease_cents;
        }
    }, [beatToBuy, purchaseType]);

    const totalUsdDisplay = useMemo(() => centsToUSD(totalCents), [totalCents]);
    const totalUsdForApi = useMemo(() => (totalCents / 100).toFixed(2), [totalCents]);

    const createOrder = async () => {
        if (!beatToBuy) {
            setPaypalError("Unable to load beat details. Please refresh and try again.");
            throw new Error("beatToBuy was null");
        }

        const beatTitle = beatToBuy.title;
        const descStr = purchaseType === 'mp3'
            ? `${beatTitle} MP3 Lease`
            : (purchaseType === 'wav'
                ? `${beatTitle} WAV Lease`
                : `${beatTitle} Exclusive`
            );

        try {
            const resp = await fetch("/api/payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: beatToBuy.id,
                    totalPrice: totalUsdForApi,
                    description: descStr,
                }),
            });

            const orderData = await resp.json();
            if (orderData.id) {
                return orderData.id;
            } else {
                const errDetail = orderData?.details?.[0];
                const errMsg = errDetail
                    ? `${errDetail.issue} ${errDetail.description} (${orderData.debug_id})`
                    : JSON.stringify(orderData);
                throw new Error(errMsg);
            }

        } catch (error) {
            console.error(error);
            setPaypalError("Unable to create PayPal order. Please try again.");
            throw error;
        }
    }


    const onApprove = async (data: any, actions: any) => {
        setIsProcessing(true);

        try {
            // Send orderID to server capture endpoint
            const response = await fetch(`/api/payment/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderID: data.orderID,
                    beatId: beatToBuy?.id,
                    purchaseType,
                    recipientEmail,
                }),
            });

            const orderData = await response.json();
            const errorDetail = orderData?.errDetail;

            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                // recoverable state, per https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                return actions.restart();
            } else if (errorDetail) {
                // (2) Other non-recoverable errors -> Show a failure message
                throw new Error(
                    `${errorDetail.description} (${orderData.debug_id})`
                );
            } else {
                // (3) Successful transaction -> Show confirmation or thank you message
                // Or go to another URL:  actions.redirect('thank_you.html');
                const token = orderData?.token;
                const orderId = orderData?.order?.order_id ?? data.orderID;
                if (!token || !orderId || !beatToBuy?.id) {
                    throw new Error('Missing token/orderId in capture response');
                }

                router.replace(`/beats/${beatToBuy.id}/buy/success?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`);
            }

        } catch (error) {
            console.error('Approve/capture error:', error);
            setPaypalError('Payment failed. Please try again.');

        } finally {
            setIsProcessing(false);
        }
    };


    const onError = (err: any) => {
        console.error('PayPal error:', err);
        setPaypalError('An error occurred with PayPal. Please try again.');
    };


    return (
        <div className="card bg-white rounded-lg shadow p-4">
            {/* Processing State */}
            {isProcessing && (
                <div className="mb-4 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                    <span>Processing your payment...</span>
                </div>
            )}
            {/* Error Message */}
            {paypalError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                    {paypalError}
                </div>
            )}

            <div className="flex flex-col gap-6 md:flex-row md:items-start">
                {/* Summary (left) */}
                <div className="md:w-1/2">
                    <h2 className="text-lg font-semibold text-zinc-900">order summary</h2>

                    {!beatToBuy ? (
                        <p className="mt-2 text-sm text-zinc-500">Beat not found.</p>
                    ) : (
                        <div className="mt-3 space-y-3">
                            <div>
                                <div className="text-base font-medium text-zinc-900">{beatToBuy.title}</div>
                                <div className="text-sm text-zinc-500">
                                    {beatToBuy.artists.join(", ")} • {beatToBuy.bpm} BPM
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-900" htmlFor="purchaseType">
                                    purchase type
                                </label>
                                <select
                                    id="purchaseType"
                                    className="mt-1 w-full rounded border text-zinc-700 border-zinc-200 black p-2 text-sm"
                                    value={purchaseType}
                                    onChange={(e) => {
                                        setPaypalError("");
                                        setPurchaseType(e.target.value as PurchaseType);
                                    }}
                                    disabled={isProcessing}
                                >
                                    <option value="mp3">mp3 lease</option>
                                    <option value="wav">wav lease</option>
                                    <option value="exclusive">exclusive</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between rounded bg-zinc-50 p-3">
                                <span className="text-sm text-zinc-600">total</span>
                                <span className="text-sm font-semibold text-zinc-900">{totalUsdDisplay}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* PayPal (right) */}
                <div className="md:w-1/2 md:pl-6 md:flex md:justify-end">
                    <div className="w-full md:max-w-sm">
                        <PayPalScriptProvider options={{
                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                            currency: 'USD',
                            intent: 'capture'
                        }}>
                            <PayPalButtons
                                createOrder={createOrder}
                                onApprove={onApprove}
                                onError={onError}
                                disabled={isProcessing}
                            />
                        </PayPalScriptProvider>

                        <p className="text-xs text-zinc-500 text-center mt-4">
                            Download link for track will be sent to email associated with PayPal account upon completing purchase
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
