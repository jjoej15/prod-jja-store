"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getCachedBeatById } from "@/lib/db";
import { centsToUSD } from "@/lib/utils";

type PurchaseType = 'mp3' | 'wav' | 'exclusive';

export default async function BuyBeat({ params }) {
	const beatToBuy = await getCachedBeatById(params.id);

	const [purchaseType, setPurchaseType] = useState<PurchaseType>("mp3");
	const [total, setTotal] = useState(centsToUSD(beatToBuy?.price_mp3_lease_cents!));
	const [isProcessing, setIsProcessing] = useState(false);
	const [paypalError, setPaypalError] = useState("");

	const createOrder = (_: any, actions: any) => {
		const beatTitle = beatToBuy?.title;
		const descStr = purchaseType === 'mp3'
			? `${beatTitle} MP3 Lease`
			: (purchaseType === 'wav'
				? `${beatTitle} WAV Lease`
				: `${beatTitle} Exclusive`
			);

		return actions.order.create({
			purchase_units: [
				{
					amount: {
						value: total,
						currency_code: 'USD'
					},
					description: descStr,
				},
			],
		});
	};


	const onApprove = async (data: any, actions: any) => {
		setIsProcessing(true);

		try {
			const order = await actions.order.get();
			console.log('Payment successful', order);

			// Extract payer information from PayPal response
			const payerName = order.payer?.name?.given_name || '';
			const payerEmail = order.payer?.email_address || '';

			const paymentData = {
				name: payerName,
				email: payerEmail,
				amount: total,
				orderID: data.orderID
			};

			// Send payment data to our API
			const response = await fetch('/api/payment', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(paymentData),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('API error response:', errorText);
				throw new Error('Payment processing failed');
			}

			const result = await response.json();
			console.log('API response:', result);
			alert('Payment processed successfully!');

		} catch (error) {
			console.error('Payment failed:', error);
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
		<div className="container mx-auto max-w-md p-4">
			<div className="card bg-white rounded-lg shadow p-6">
				<h2 className="text-2xl font-bold mb-6">Order Summary</h2>
				{/* Processing State */}
				{isProcessing && (
					<div className="mb-4 text-center">
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
		</div>
	);
}
