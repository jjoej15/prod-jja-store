import { Beat } from "@/lib/types";
import ArrowIcon from "./arrow-icon";

export default function BuyAnchor({ beat, arrowIconColorOverride }: { beat: Beat, arrowIconColorOverride?: string }) {
    return (
        <a
            className="group flex items-center transition-colors hover:text-neutral-400"
            rel="noopener noreferrer"
            href={`/beats/${beat.id}/buy`}
        >
            <ArrowIcon className={`text-${arrowIconColorOverride ?? 'neutral-800'} group-hover:text-neutral-400 transition-colors`} />
            <p className="ml-2 font-medium">buy</p>
        </a>
    );
}
