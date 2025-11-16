'use client'
import { useState } from 'react'
import type { Beat } from '@/lib/types'
import BeatsList from './BeatsList'
import BeatsPlayer from './BeatsPlayer'

interface Props { beats: Beat[] }

interface PlayerState {
    currentId: string | null
    isPlaying: boolean
    onToggle: (beat: Beat) => void
}

export default function BeatsClient({ beats }: Props) {
    const [playerState, setPlayerState] = useState<PlayerState>({
        currentId: null,
        isPlaying: false,
        onToggle: () => { }
    })

    return (
        <div className="relative">
            <BeatsList
                beats={beats}
                currentId={playerState.currentId}
                isPlaying={playerState.isPlaying}
                onToggle={playerState.onToggle}
            />
            <BeatsPlayer beats={beats} onStateChange={setPlayerState} />
        </div>
    )
}
