import { getCachedBeatById } from "@/lib/db";
import BuyClient from "./BuyClient";

export default async function BuyBeat({ params }) {
	const beatToBuy = await getCachedBeatById((await params).id);

	return (
		<div className="container mx-auto max-w-4xl p-4">
			{!beatToBuy ? <p className="text-sm text-zinc-500">invalid beat id.</p>
				: <BuyClient beatToBuy={beatToBuy} />}
		</div>
	);
}
