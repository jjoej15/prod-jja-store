import type { Beat } from '@/lib/types'
import { listBeats } from '@/lib/db'
import { centsToUSD } from '@/lib/utils';

export default async function Page() {
    try {
        const beats: Beat[] = await listBeats();

        return (
            <section>
                <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
                    beats by joe
                </h1>
                {beats.length === 0 ? (
                    <p className="text-sm text-zinc-500">No beats available.</p>
                ) : (
                    <ul className="space-y-3">
                        {beats.map((b) => (
                            <li
                                key={b.id}
                                className="flex flex-col sm:flex-row sm:items-center 
                                    sm:justify-between gap-1 border-b border-zinc-200 pb-2"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{b.title}</span>
                                    <span className="text-xs text-zinc-500">
                                        {b.artists.join(', ').replace("jj.aholics", "Joe Anderson")
                                            || 'Unknown Artist'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="text-sm text-white-600">
                                        {centsToUSD(b.price_mp3_lease_cents)}
                                    </div>
                                    <div className="text-xs text-zinc-600">{b.bpm} BPM</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        )
    } catch (err) {
        return (
            <section>
                <h1 className="mb-8 text-2xl font-semibold tracking-tighter">beats by joe</h1>
                <p className="text-sm text-red-600">failed to load beats.</p>
            </section>
        )
    }
}
