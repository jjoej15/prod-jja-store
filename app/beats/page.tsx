import type { Beat } from '@/lib/types'
import { listBeats } from '@/lib/db'
import BeatsList from './BeatsList'

export default async function Page() {
    try {
        const beats: Beat[] = await listBeats();

        return (
            <section>
                <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
                    beats by joe
                </h1>
                {beats.length === 0 ? (
                    <p className="text-sm text-zinc-500">no beats available.</p>
                ) : (
                    <BeatsList beats={beats} />
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
