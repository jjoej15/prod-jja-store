'use client';
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { playIcon, pauseIcon } from '@/app/assets/images'
import type { Beat } from '@/lib/types'
import { centsToUSD } from '@/lib/utils'

interface Props { beats: Beat[] }

export default function BeatsList({ beats }: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [positions, setPositions] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!audioRef.current && typeof window !== 'undefined') {
            audioRef.current = new Audio();
        }
    }, []);


    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onEnded = () => setIsPlaying(false);
        audio.addEventListener('ended', onEnded);
        return () => audio.removeEventListener('ended', onEnded);
    }, [audioRef.current]);


    async function playPauseBeat(beat: Beat) {
        const audio = audioRef.current;
        if (!audio) return;

        // If selecting a different beat
        if (currentId && currentId !== beat.id) {
            // store previous position
            setPositions(p => ({ ...p, [currentId]: audio.currentTime }));
        }

        const existingPos = positions[beat.id] || 0;

        // If same beat toggling
        if (currentId === beat.id && isPlaying) {
            // Pause
            audio.pause();
            setPositions(p => ({ ...p, [beat.id]: audio.currentTime }));
            setIsPlaying(false);
            return;

        } else if (currentId === beat.id) {
            // Resume
            audio.currentTime = existingPos;
            await audio.play();
            setIsPlaying(true);
            return;
        }

        // Switch to new beat
        setCurrentId(beat.id);
        setIsPlaying(true);

        // Set source (encode key for safety)
        const streamUrl = `/api/beats/${encodeURIComponent(beat.s3_key_mp3)}/stream`;

        // To ensure we resume, wait for metadata before setting time
        audio.src = streamUrl;
        audio.load();
        audio.onloadedmetadata = async () => {
            audio.currentTime = existingPos
            try { await audio.play() } catch { }
        }
    }

    return (
        <ul className="space-y-3">
            {beats.map(b => {
                const active = b.id === currentId;
                const playing = active && isPlaying;

                return (
                    <li
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between 
                            gap-2 border-b border-zinc-200 pb-2"
                    >
                        <div className="flex flex-col">
                            <span className="font-medium">{b.title}</span>
                            <span className="text-xs text-zinc-500">{
                                b.artists.join(', ').replace('jj.aholics', 'Joe Anderson')
                                || 'Unknown Artist'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-zinc-600">MP3 Lease</span>
                                <span className="font-medium">{centsToUSD(b.price_mp3_lease_cents)}</span>
                                <span className="text-[10px] text-zinc-500">{b.bpm} BPM</span>
                            </div>
                            <button
                                onClick={() => playPauseBeat(b)}
                                className="px-2 py-1 hover:cursor-pointer transition flex items-center justify-center"
                                aria-label={playing 
                                        ? `Pause ${b.title}` 
                                        : active 
                                    && !playing 
                                        ? `Resume ${b.title}` 
                                        : `Play ${b.title}`}
                                aria-pressed={playing}
                            >
                                <Image
                                    src={playing ? pauseIcon : playIcon}
                                    alt={playing ? `Pause ${b.title}` : `Play ${b.title}`}
                                    width={24}
                                    height={24}
                                />
                            </button>
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
