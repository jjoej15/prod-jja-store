"use client";
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { centsToUSD } from "@/lib/utils";
import { useState } from "react";
import { Beat } from '@/lib/types';
import { error } from 'console';

type PurchaseType = 'mp3' | 'wav' | 'exclusive';

export default function BuyClient({ beatToBuy }: { beatToBuy: Beat | null }) {
    const [purchaseType, setPurchaseType] = useState<PurchaseType>("mp3");
    const [total, setTotal] = useState(centsToUSD(beatToBuy?.price_mp3_lease_cents!).replace("$", ""));
    const [isProcessing, setIsProcessing] = useState(false);
    const [paypalError, setPaypalError] = useState("");

    const createOrder = async () => {
        const beatTitle = beatToBuy?.title;
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
                    id: beatToBuy?.id,
                    totalPrice: total,
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
        }
    }
        

    const onApprove = async (data: any, actions: any) => {
        setIsProcessing(true);

        try {
            // Send orderID to server capture endpoint
            const response = await fetch(`/api/payment/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderID: data.orderID })
            });

            const orderData = await response.json();

            const errorDetail = orderData?.details?.[0];
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
                const transaction =
                    orderData.purchase_units[0].payments.captures[0];
                console.log(
                    "Capture result",
                    orderData,
                    JSON.stringify(orderData, null, 2)
                );
            }

        } catch (error) {
            console.error('Approve/capture error:', error);
        
        } finally {
            setIsProcessing(false);
        }
    };


    const onError = (err: any) => {
        console.error('PayPal error:', err);
        setPaypalError('An error occurred with PayPal. Please try again.');
    };


    return(
        <div className="card bg-white rounded-lg shadow p-6">
            {/* <h2 className="text-2xl text-gray-500 font-bold mb-6">Order Summary</h2> */}
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
            {/* PayPal Button */}
            <PayPalScriptProvider options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                currency: 'USD',
                intent: 'capture'
            }}>
                <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    style={{ layout: "vertical" }}
                    disabled={isProcessing}
                />
            </PayPalScriptProvider>
            <p className="text-xs text-gray-500 text-center mt-4">
                By completing this purchase, you agree to our terms and conditions.
            </p>
        </div>
    );
}
