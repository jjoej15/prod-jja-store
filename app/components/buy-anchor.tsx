import { Beat } from "@/lib/types";
import ArrowIcon from "./arrow-icon";

export default function BuyAnchor({ beat }: { beat: Beat }) {
    return (
        <a
            className="group flex items-center transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
            rel="noopener noreferrer"
            href={`/beats/${beat.id}/buy`}
        >
            <ArrowIcon className="text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-800 
                dark:group-hover:text-neutral-400 transition-colors" />
            <p className="ml-2 font-medium">buy</p>
        </a>
    );
}
