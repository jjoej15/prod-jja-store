import { getOrderById } from "@/lib/db";
import { verifyOrderToken } from "@/lib/order-token";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'success',
}

export const dynamic = "force-dynamic";

export default async function BuySuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ orderId?: string; token?: string }>;
}) {
    const { id: beatId } = await params;
    const { orderId = "", token = "" } = await searchParams;

    const verified = token && orderId ? verifyOrderToken(token, { orderId, beatId }) : null;
    const order = await getOrderById(orderId);
    if (!verified || !order || order.beat_id !== beatId) {
        return (
            <div className="container mx-auto max-w-2xl p-4">
                <h1 className="text-xl font-semibold text-black dark:text-zinc-100">purchase confirmation</h1>
                <p className="mt-2 text-sm text-red-700">
                    This link is invalid or has expired.
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-md p-4">
            <h1 className="text-xl font-semibold text-black dark:text-zinc-100">thank you</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                your purchase was completed successfully.
                please check your email for a download link. link will expire in 24 hours.
            </p>

            <div className="mt-6 rounded border border-zinc-200 bg-white p-4">
                <div className="text-xs text-zinc-500">order id</div>
                <div className="mt-1 font-mono text-sm text-zinc-900">{order.order_id}</div>

                <div className="mt-4 text-xs text-zinc-500">license</div>
                <div className="mt-1 text-sm text-zinc-900">{order.purchase_type}</div>

                <div className="mt-4 text-xs text-zinc-500">recipient email</div>
                <div className="mt-1 text-sm text-zinc-900">{order.recipient_email}</div>

                <div className="mt-4 text-xs text-zinc-500">amount</div>
                <div className="mt-1 text-sm text-zinc-900">{order.gross_amount} {order.currency}</div>

                <div className="mt-4 text-xs text-zinc-500">status</div>
                <div className="mt-1 text-sm text-zinc-900">{order.status}</div>
            </div>
        </div>
    );
}
