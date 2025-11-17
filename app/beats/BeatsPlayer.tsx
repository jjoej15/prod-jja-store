"use client"
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Beat } from '@/lib/types'
import Image from 'next/image'
import { playIcon, pauseIcon, forwardStepIcon, backwardStepIcon } from '@/app/assets/images'
import { formatTime } from '@/lib/utils'
import BuyAnchor from '../components/buy-anchor'

interface Props {
    beats: Beat[]
    onStateChange?: (s: {
        currentId: string | null;
        isPlaying: boolean;
        onToggle: (b: Beat) => void
    }) => void
}

export default function BeatsPlayer({ beats, onStateChange }: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [currentIndex, setCurrentIndex] = useState<number | null>(null)
    const currentIndexRef = useRef<number | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [progress, setProgress] = useState(0)
    const [positions, setPositions] = useState<Record<string, number>>({})
    const lastBackClickRef = useRef<number>(0)
    const DOUBLE_BACK_THRESHOLD_MS = 1000

    // create audio element
    useEffect(() => {
        // Instantiate underlying Audio element once on client.
        if (!audioRef.current && typeof window !== 'undefined') {
            audioRef.current = new Audio()
        }

        const audio = audioRef.current!
        const onEnded = () => skipForward()
        const onLoaded = () => setDuration(audio.duration || 0)
        const onTime = () => setProgress(audio.currentTime)
        audio.addEventListener('ended', onEnded)
        audio.addEventListener('loadedmetadata', onLoaded)
        audio.addEventListener('timeupdate', onTime)

        return () => {
            // Cleanup listeners, pause & reset audio element.
            audio.removeEventListener('ended', onEnded)
            audio.removeEventListener('loadedmetadata', onLoaded)
            audio.removeEventListener('timeupdate', onTime)
            try { audio.pause() } catch { }
            audio.removeAttribute('src')
            try { audio.load() } catch { }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep a live ref of currentIndex to avoid stale closures in event listeners
    useEffect(() => {
        currentIndexRef.current = currentIndex
    }, [currentIndex])

    const currentBeat = currentIndex !== null ? beats[currentIndex] : null

    const loadAndPlay = useCallback((beat: Beat, resumePos: number) => {
        // Load the streaming endpoint (range-based server route) and play from resumePos.
        const audio = audioRef.current!
        const streamUrl = `/api/beats/${encodeURIComponent(beat.s3_key_mp3)}/stream`
        audio.src = streamUrl
        audio.load()
        audio.onloadedmetadata = async () => {
            audio.currentTime = resumePos
            try {
                await audio.play();
                setIsPlaying(true)
            } catch { setIsPlaying(false) }
        }
    }, [])

    function toggleBeat(beat: Beat) {
        // Core track selection & play/pause logic.
        const audio = audioRef.current
        if (!audio) return

        const idx = beats.findIndex(b => b.id === beat.id)
        if (idx === -1) return

        // Persist position of previous track when switching to a new one.
        if (currentIndex !== null && currentIndex !== idx && currentBeat) {
            setPositions(p => ({ ...p, [currentBeat.id]: audio.currentTime }))
        }

        const existingPos = positions[beat.id] || 0

        // Same track: toggle play/pause, restoring position on resume.
        if (currentIndex === idx && isPlaying) {
            audio.pause()
            setPositions(p => ({ ...p, [beat.id]: audio.currentTime }))
            setIsPlaying(false)
            return
        } else if (currentIndex === idx) {
            // Resume same track from the current slider position
            audio.play().then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            return;
        }

        setCurrentIndex(idx)
        loadAndPlay(beat, existingPos)
    }

    function skipBack() {
        // Back button: first click restarts current track; double click goes to previous track
        const audio = audioRef.current
        if (!audio || currentIndex === null) return
        const now = Date.now()

        if (now - lastBackClickRef.current < DOUBLE_BACK_THRESHOLD_MS) {
            // go to previous track
            const prevIndex = (currentIndex - 1 + beats.length) % beats.length
            const prevBeat = beats[prevIndex]
            if (currentBeat) {
                setPositions(p => ({ ...p, [currentBeat.id]: audio.currentTime }))
            }
            setCurrentIndex(prevIndex)
            loadAndPlay(prevBeat, 0)

        } else {
            // restart current track
            audio.currentTime = 0
            if (!isPlaying) {
                audio.play().then(() => setIsPlaying(true)).catch(() => { })
            }
        }

        lastBackClickRef.current = now
    }

    function skipForward() {
        // Advance to next track (uses ref to avoid stale state in event handlers)
        if (beats.length === 0) return
        const idx = currentIndexRef.current
        const nextIndex = idx === null ? 0 : (idx + 1) % beats.length
        const beat = beats[nextIndex]
        setCurrentIndex(nextIndex)
        loadAndPlay(beat, 0)
    }

    function togglePlayPause() {
        if (currentIndex === null) {
            skipForward()
            return
        }
        const beat = beats[currentIndex]
        toggleBeat(beat)
    }

    function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
        // Slider change: set audio currentTime directly & mirror in state.
        const audio = audioRef.current
        if (!audio) return
        const value = Number(e.target.value)
        audio.currentTime = value
        setProgress(value)
        // If paused, persist this seek so resuming or coming back to this track starts here
        if (currentBeat && !isPlaying) {
            setPositions(p => ({ ...p, [currentBeat.id]: value }))
        }
    }

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

    // Notify parent of state changes
    useEffect(() => {
        // Emit minimal state up to parent whenever track or play status changes.
        onStateChange?.({
            currentId: currentBeat?.id || null,
            isPlaying,
            onToggle: toggleBeat
        })
    }, [currentBeat?.id, isPlaying, onStateChange]);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 text-white 
            backdrop-blur border-t border-zinc-800 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-4 md:grid 
                md:grid-cols-[12rem_1fr_6rem] md:items-center">
                {/* Left section: current track title & artists */}
                <div className="w-48 overflow-hidden">
                    <div className="text-sm font-medium text-white leading-tight truncate">
                        {currentBeat ? currentBeat.title : 'No track selected'}
                    </div>
                    <div className="text-xs text-zinc-300 truncate">
                        {currentBeat
                            ? (currentBeat.artists.join(', ').replace('jj.aholics', 'Joe Anderson') || 'Unknown Artist')
                            : '—'
                        }
                    </div>
                </div>

                {/* Center section: slider + timestamp (md+) and controls (always) */}
                <div className="flex items-center gap-3 w-auto md:w-full px-2 md:col-start-2 md:col-end-3">
                    {/* Hidden on small screens to keep mobile minimal */}
                    <div className="hidden md:flex items-center gap-3 w-full">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={progress}
                            onChange={onSeek}
                            className="player-slider w-full hover:cursor-pointer"
                            style={{ background: `linear-gradient(to right, #27272a ${progressPercent}%, #e5e7eb ${progressPercent}%)` }}
                            aria-label="Seek"
                        />
                        <div className="text-xs tabular-nums text-zinc-300 w-20 text-right">
                            {formatTime(progress)} / {formatTime(duration)}
                        </div>
                    </div>

                    {/* Transport controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={skipBack}
                            className="p-2 rounded border border-zinc-700 hover:bg-zinc-800 shrink-0"
                            aria-label="Restart (single) or previous track (double)"
                        >
                            <Image
                                src={backwardStepIcon} alt="Restart"
                                width={20} height={20}
                                className="w-[20px] h-[20px] shrink-0 hover:cursor-pointer" />
                        </button>
                        <button
                            onClick={togglePlayPause}
                            className="p-2 rounded border border-zinc-700 hover:bg-zinc-800 
                                flex items-center justify-center shrink-0"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            <Image src={isPlaying ? pauseIcon : playIcon}
                                alt={isPlaying ? 'Pause' : 'Play'} width={24} height={24}
                                className="w-[24px] h-[24px] shrink-0 hover:cursor-pointer" />
                        </button>
                        <button
                            onClick={skipForward}
                            className="p-2 rounded border border-zinc-700 hover:bg-zinc-800 shrink-0"
                            aria-label="Skip to next track"
                        >
                            <Image src={forwardStepIcon} alt="Next"
                                width={20} height={20} className="w-[20px] h-[20px] shrink-0 hover:cursor-pointer" />
                        </button>
                    </div>
                </div>

                {/* Right section: pricing (hidden on mobile) */}
                <div className="hidden md:block w-24 justify-self-end">
                    <div className="flex flex-col items-end">
                        { currentBeat && <BuyAnchor beat={currentBeat} /> }
                    </div>
                </div>
            </div>
        </div>
    )
}
