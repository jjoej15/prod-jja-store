import { getCachedBeatById } from "@/lib/db";
import BuyClient from "./BuyClient";

export default async function BuyBeat({ params }) {
	const beatToBuy = await getCachedBeatById((await params).id);

	return (
		<div className="container mx-auto max-w-md p-4">
			<BuyClient beatToBuy={beatToBuy} />
		</div>
	);
}
