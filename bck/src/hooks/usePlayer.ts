import { useEffect, useRef, useState } from 'react';
import TrackPlayer, {
    State,
    Event,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents,
} from 'react-native-track-player';

import { AudioFileState, SubtitleFileState, Track, ProgressData } from '../utils/types';
import { loadTrackMedia } from '../utils/mediaLoader';

const CUES_PER_SEGMENT = 100;

interface UsePlayerProps {
    isAutoPlay: boolean;
    progressMap: Record<string, ProgressData>;
    saveProgress: (
        trackName: string,
        currentTime: number,
        duration: number,
        segmentHistory: Record<number, number>
    ) => void;
}

export const usePlayer = ({
                              isAutoPlay,
                              progressMap,
                              saveProgress,
                          }: UsePlayerProps) => {

    /** ─────────────────────────────────────────────
     *  TRACK PLAYER HOOKS
     *  ───────────────────────────────────────────── */
    const playback = usePlaybackState();
    const { position, duration } = useProgress(250);

    /** ─────────────────────────────────────────────
     *  UI STATE
     *  ───────────────────────────────────────────── */
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);

    const [audioState, setAudioState] = useState<AudioFileState>({
        path: null,
        name: '',
        coverUrl: null,
    });

    const [subtitleState, setSubtitleState] = useState<SubtitleFileState>({
        path: null,
        cues: [],
        name: '',
    });

    const [isPlaying, setIsPlaying] = useState(false);

    /** Resume + history tracking */
    const lastSaveRef = useRef(0);
    const resumeRef = useRef(0);
    const segmentHistoryRef = useRef<Record<number, number>>({});

    /** Sync RNTP → UI */
    useEffect(() => {
        // @ts-ignore
        setIsPlaying(playback === State.Playing);
    }, [playback]);

    /** ─────────────────────────────────────────────
     *  LOAD + PLAY A TRACK
     *  ───────────────────────────────────────────── */
    const playTrack = async (track: Track, index: number, newPlaylist: Track[]) => {
        segmentHistoryRef.current = {};
        setCurrentTrackIndex(index);
        setPlaylist(newPlaylist);

        /** Restore progress */
        const saved = progressMap[track.name];
        if (saved) {
            resumeRef.current =
                saved.currentTime > 0 && saved.currentTime < saved.duration - 1
                    ? saved.currentTime
                    : 0;

            if (saved.segmentHistory) {
                segmentHistoryRef.current = { ...saved.segmentHistory };
            }
        } else {
            resumeRef.current = 0;
        }

        /** Load local media */
        const { audioState: audioMeta, subtitleState: subMeta } = await loadTrackMedia(track);

        setAudioState(audioMeta);
        setSubtitleState(subMeta);

        /** TrackPlayer loading */
        await TrackPlayer.reset();

        await TrackPlayer.add({
            id: track.id,
            url: audioMeta.path!,            // IMPORTANT: use `.url`
            title: audioMeta.name,
            artwork: audioMeta.coverUrl || undefined,
        });

        /** Resume saved position */
        if (resumeRef.current > 0) {
            await TrackPlayer.seekTo(resumeRef.current);
            resumeRef.current = 0;
        }

        if (isAutoPlay) {
            await TrackPlayer.play();
        }
    };

    /** ─────────────────────────────────────────────
     *  SAVE PROGRESS LOOP
     *  ───────────────────────────────────────────── */
    useTrackPlayerEvents([Event.PlaybackProgressUpdated], () => {
        const t = position;
        const d = duration;

        if (!audioState.name || d === 0) return;

        /** Segment index calculation from subtitles */
        let currentSeg = 0;

        if (subtitleState.cues.length > 0) {
            const cueIndex = subtitleState.cues.findIndex(
                (c) => t >= c.start && t <= c.end
            );

            let targetIndex = cueIndex;

            if (targetIndex === -1) {
                const next = subtitleState.cues.findIndex((c) => c.start > t);
                if (next > 0) targetIndex = next - 1;
                else if (next === 0) targetIndex = 0;
                else targetIndex = subtitleState.cues.length - 1;
            }

            currentSeg = Math.floor(targetIndex / CUES_PER_SEGMENT);
        }

        segmentHistoryRef.current[currentSeg] = t;

        /** Save every 1 second */
        if (Date.now() - lastSaveRef.current > 1000) {
            saveProgress(audioState.name, t, d, segmentHistoryRef.current);
            lastSaveRef.current = Date.now();
        }
    });

    /** ─────────────────────────────────────────────
     *  SEEK
     *  ───────────────────────────────────────────── */
    const seek = async (percentage: number) => {
        if (duration <= 0) return;

        const newTime = (percentage / 100) * duration;
        await TrackPlayer.seekTo(newTime);

        /** Update history */
        if (subtitleState.cues.length > 0) {
            let cueIndex = subtitleState.cues.findIndex(
                (c) => newTime >= c.start && newTime <= c.end
            );

            if (cueIndex === -1) {
                const next = subtitleState.cues.findIndex((c) => c.start > newTime);
                cueIndex = next > 0 ? next - 1 : subtitleState.cues.length - 1;
            }

            const seg = Math.floor(cueIndex / CUES_PER_SEGMENT);
            segmentHistoryRef.current[seg] = newTime;
        }

        saveProgress(audioState.name, newTime, duration, segmentHistoryRef.current);
    };

    /** ─────────────────────────────────────────────
     *  SUBTITLE CLICK
     *  ───────────────────────────────────────────── */
    const jumpToTime = async (time: number) => {
        await TrackPlayer.seekTo(time);
        if (!isPlaying) TrackPlayer.play();
        seek((time / duration) * 100);
    };

    /** ─────────────────────────────────────────────
     *  SEGMENT CHANGE
     *  ───────────────────────────────────────────── */
    const changeSegment = async (index: number) => {
        const cues = subtitleState.cues;

        let start = 0;
        let end = duration;

        if (cues.length > 0) {
            const s = index * CUES_PER_SEGMENT;
            const e = Math.min((index + 1) * CUES_PER_SEGMENT - 1, cues.length - 1);

            if (s < cues.length) start = cues[s].start;
            if (e < cues.length) end = cues[e].end;
        }

        const saved = segmentHistoryRef.current[index];

        const newTime = saved && saved >= start && saved <= end ? saved : start;

        await TrackPlayer.seekTo(newTime);

        segmentHistoryRef.current[index] = newTime;

        saveProgress(audioState.name, newTime, duration, segmentHistoryRef.current);
    };

    /** ─────────────────────────────────────────────
     *  BASIC CONTROLS
     *  ───────────────────────────────────────────── */
    const togglePlay = () => {
        if (isPlaying) TrackPlayer.pause();
        else TrackPlayer.play();
    };

    const pause = () => TrackPlayer.pause();

    const next = async () => {
        const nextIndex = currentTrackIndex + 1;
        if (nextIndex < playlist.length) {
            await playTrack(playlist[nextIndex], nextIndex, playlist);
        }
    };

    const previous = async () => {
        const t = position;

        // If > 3 seconds, rewind to start
        if (t > 3) {
            await TrackPlayer.seekTo(0);
            return;
        }

        const prevIndex = currentTrackIndex - 1;

        if (prevIndex >= 0) {
            await playTrack(playlist[prevIndex], prevIndex, playlist);
        } else {
            await TrackPlayer.seekTo(0);
        }
    };

    const skipForward = async () => {
        await TrackPlayer.seekTo(Math.min(position + 10, duration));
    };

    const skipBackward = async () => {
        await TrackPlayer.seekTo(Math.max(position - 10, 0));
    };

    /** ─────────────────────────────────────────────
     *  EXPORTED API
     *  ───────────────────────────────────────────── */
    return {
        audioState,
        subtitleState,
        playlist,
        currentTrackIndex,
        isPlaying,
        currentTime: position,
        duration,

        playTrack,
        togglePlay,
        pause,
        seek,
        changeSegment,
        jumpToTime,
        next,
        previous,
        skipForward,
        skipBackward,
    };
};
