'use client'
import Image from 'next/image'
import { playIcon, pauseIcon } from '@/app/assets/images'
import type { Beat } from '@/lib/types'
import BuyAnchor from '../components/buy-anchor'

interface Props {
    beats: Beat[]
    currentId: string | null
    isPlaying: boolean
    onToggle: (beat: Beat) => void
}

export default function BeatsList({ beats, currentId, isPlaying, onToggle }: Props) {
    return (
        <ul className="space-y-3 pb-24">
            {beats.map(b => {
                const active = b.id === currentId
                const playing = active && isPlaying
                return (
                    <li
                        key={b.id}
                        className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-2"
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{b.title}</span>
                            <span className="text-xs text-zinc-500 truncate">
                                {b.artists.join(', ').replace('jj.aholics', 'Joe Anderson') || 'Unknown Artist'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                            <div className="flex flex-col items-end">
                                <BuyAnchor beat={b} />
                                <span className="text-[10px] text-zinc-500">{b.bpm} BPM</span>
                            </div>
                            <button
                                onClick={() => onToggle(b)}
                                className="group px-2 py-1 transition flex items-center justify-center shrink-0"
                                aria-label={playing ? `Pause ${b.title}` : active && !playing ? `Resume ${b.title}` : `Play ${b.title}`}
                                aria-pressed={playing}
                            >
                                <Image
                                    src={playing ? pauseIcon : playIcon}
                                    alt={playing ? `Pause ${b.title}` : `Play ${b.title}`}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 hover:cursor-pointer transition group-hover:brightness-75 invert dark:invert-0"
                                />
                            </button>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
