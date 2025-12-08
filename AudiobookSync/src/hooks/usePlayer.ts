import {useCallback, useEffect, useRef, useState} from 'react';
import TrackPlayer, {
    State,
    Event,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents,
} from 'react-native-track-player';


import { releaseSecureAccess } from 'react-native-document-picker'

import { AudioFileState, SubtitleFileState, Track, ProgressData } from '../utils/types';
import { loadTrackMedia, getSegmentIndex, getSegmentBounds, findCueIndex  } from '../utils/mediaLoader';

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
        markers:[],
        totalSegments:0
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


    /* Release access when audio path changes */
    useEffect(() => {
        if (audioState.path) {
            releaseSecureAccess([audioState.path]).catch(() => {});
        }
    }, [audioState.path]);


    /** ─────────────────────────────────────────────
     *  LOAD + PLAY A TRACK
     *  ───────────────────────────────────────────── */
    const playTrack = useCallback(async (track: Track, index: number, newPlaylist: Track[]) => {

        if(track.name === audioState.name) {
            return;
        }

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

        // console.log(subMeta.markers)

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

    }, [audioState.name, progressMap]);


    /** ─────────────────────────────────────────────
     *  SAVE PROGRESS LOOP
     *  ───────────────────────────────────────────── */
    useTrackPlayerEvents([Event.PlaybackProgressUpdated], () => {
        const t = position;
        const d = duration;

        if (!audioState.name || d === 0) return;

        /** Segment index calculation from subtitles */
        const cues = subtitleState.cues;

        const cueIndex = findCueIndex(cues, t);
        const segmentIndex = getSegmentIndex(cueIndex);

        segmentHistoryRef.current[segmentIndex] = t;

        /** Save every 1 second */
        if (Date.now() - lastSaveRef.current > 1000) {
            saveProgress(audioState.name, t, d, segmentHistoryRef.current);
            lastSaveRef.current = Date.now();
        }
    });

    /** ─────────────────────────────────────────────
     *  SEEK
     *  ───────────────────────────────────────────── */
    const seek = useCallback(async (percentage: number) => {
        if (duration <= 0) return;

        const newTime = (percentage / 100) * duration;
        await TrackPlayer.seekTo(newTime);

        const cueIndex = findCueIndex(subtitleState.cues, newTime);
        const segment = getSegmentIndex(cueIndex);
        segmentHistoryRef.current[segment] = newTime;

        saveProgress(audioState.name, newTime, duration, segmentHistoryRef.current);

    }, [duration, subtitleState.cues, audioState.name]);

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
    const changeSegment = useCallback(async (index: number) => {

        const { start, end } = getSegmentBounds(subtitleState.cues, index, duration);
        const saved = segmentHistoryRef.current[index];
        const target = (saved && saved >= start && saved <= end) ? saved : start;

        await TrackPlayer.seekTo(target);
        segmentHistoryRef.current[index] = target;

        saveProgress(audioState.name, target, duration, segmentHistoryRef.current);

    },[duration, subtitleState.cues, audioState.name]);

    /** ─────────────────────────────────────────────
     *  BASIC CONTROLS
     *  ───────────────────────────────────────────── */
    const togglePlay = () => {
        isPlaying ? TrackPlayer.pause() : TrackPlayer.play();
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
