import {useEffect, useRef, useState} from 'react';
import TrackPlayer, {
    Event,
    State,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents,
} from 'react-native-track-player';

import {releaseSecureAccess} from 'react-native-document-picker'

import {AudioFileState, ProgressData, SubtitleCue, SubtitleFileState, Track} from '../utils/types';
import {loadTrackMedia} from '../utils/mediaLoader';

const CUES_PER_SEGMENT = 100;

interface UsePlayerProps {
    progressMap: Record<string, ProgressData>;
    saveProgress: (
        trackName: string,
        currentTime: number,
        duration: number,
        segmentHistory: Record<number, number>
    ) => void;
}

export const usePlayer = ({
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
        cueIndexMap: null,
        bucketSize: 0.25,
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


    function buildCueIndexMap(cues:SubtitleCue[], duration:number, bucketSize = 0.5) {
        const bucketCount = Math.ceil(duration / bucketSize);
        const map = new Array(bucketCount).fill(-1);

        let cueIndex = 0;

        for (let i = 0; i < bucketCount; i++) {
            const time = i * bucketSize;

            // advance cueIndex until cue covers this time
            while (
                cueIndex < cues.length - 1 &&
                !(time >= cues[cueIndex].start && time <= cues[cueIndex].end)
                ) {
                // if this cue ends before time → move to next
                if (time > cues[cueIndex].end) cueIndex++;
                else break;
            }

            map[i] = cueIndex;
        }

        return { map, bucketSize };
    }

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

        /** TrackPlayer loading */
        await TrackPlayer.reset();

        await TrackPlayer.add({
            id: track.id,
            url: audioMeta.path!,
            title: audioMeta.name,
            artwork: audioMeta.coverUrl || undefined,
        });

        const trackDuration = await TrackPlayer.getDuration();

        let cueIndexMap = null;
        let bucketSize = 0.5;

        if (subMeta.cues.length > 0 && trackDuration > 0) {
            const result = buildCueIndexMap(subMeta.cues, trackDuration, 0.25);
            cueIndexMap = result.map;
            bucketSize = result.bucketSize;
        }

        setSubtitleState({
            ...subMeta,
            cueIndexMap,
            bucketSize,
        });

        /** Resume saved position */
        if (resumeRef.current > 0) {
            await TrackPlayer.seekTo(resumeRef.current);
            resumeRef.current = 0;
        }

    };

    useEffect(() => {
        if(!!audioState.path) releaseSecureAccess([audioState.path!]).then();
    }, [audioState.path]);


    /** ─────────────────────────────────────────────
     *  SAVE PROGRESS LOOP
     *  ───────────────────────────────────────────── */
    useTrackPlayerEvents([Event.PlaybackProgressUpdated], () => {
        const t = position;
        const d = duration;

        if (!audioState.name || d === 0) return;
        let cueIndex = 0;

        if (subtitleState.cueIndexMap && subtitleState.bucketSize) {
            const bucket = Math.floor(t / subtitleState.bucketSize);
            cueIndex = subtitleState.cueIndexMap[bucket] ?? 0;
        }

        const currentSeg = Math.floor(cueIndex / CUES_PER_SEGMENT);

        segmentHistoryRef.current[currentSeg] = t;

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

        let cueIndex = 0;

        if (subtitleState.cueIndexMap && subtitleState.bucketSize) {
            const bucket = Math.floor(newTime / subtitleState.bucketSize);
            cueIndex = subtitleState.cueIndexMap[bucket] ?? 0;
        }

        const seg = Math.floor(cueIndex / CUES_PER_SEGMENT);

        segmentHistoryRef.current[seg] = newTime;

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
