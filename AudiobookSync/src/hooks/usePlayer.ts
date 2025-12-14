import React, {useCallback, useEffect, useRef} from 'react';
import TrackPlayer, {Event, usePlaybackState, useTrackPlayerEvents,} from 'react-native-track-player';
import {releaseSecureAccess} from 'react-native-document-picker'
import {usePlayerContext} from "../services/PlayerContext";

import {ProgressData, Track} from '../utils/types';
import {getSegmentIndex, loadTrackMedia} from '../utils/mediaLoader';
import {useStaticData} from "./useStaticData.tsx";
import {useSharedValue} from "react-native-reanimated";

interface UsePlayerProps {
    progressMapRef:  React.MutableRefObject<Record<string, ProgressData>>;
}

export const usePlayer = ({
                              progressMapRef,
                          }: UsePlayerProps) => {

    /** ─────────────────────────────────────────────
     *  UI STATE
     *  ───────────────────────────────────────────── */

    const { getDuration } = useStaticData()

    const { state, dispatch } = usePlayerContext();

    const { playlist, currentTrackIndex, audioState, subtitleState, isPlaying } = state;

    // console.log('outside', audioState.name, isPlaying)

    /** Resume + history tracking */
    const durationRef = useRef<number>(0);
    const currentTimeSV = useSharedValue(0)

    // console.log(isPlaying, audioState.name)


    /* Release access when audio path changes */
    useEffect(() => {
        if (!!audioState.path) {
            releaseSecureAccess([audioState.path]).catch(() => {});
        }

    }, [audioState.path]);

    useEffect(() => {
        if(!!audioState.name){
            const { duration } =  getDuration(audioState.name)
            durationRef.current = duration

            if(!!progressMapRef.current[audioState.name])
                currentTimeSV.value = progressMapRef.current[audioState.name].currentTime
        }

    }, [audioState.name]);



    /** ─────────────────────────────────────────────
     *  LOAD + PLAY A TRACK
     *  ───────────────────────────────────────────── */
    const playTrack = useCallback(async (
                                            track: Track,
                                            index: number,
                                            newPlaylist: Track[],
                                            option:number
                                    ) => {

        if(track.name === audioState.name) {
            // console.log('playTrack', option, isPlaying)
            if(option == 2) return
            if (isPlaying) {
                dispatch({
                    type: "SET_PLAYING",
                    isPlaying: false,
                });
                await TrackPlayer.pause()
            }
            else {
                dispatch({
                    type: "SET_PLAYING",
                    isPlaying: true,
                });
                await TrackPlayer.play()
            }
            return
        }

        if(isPlaying){
            await TrackPlayer.pause()
        }

        /** Restore progress */
        const saved = progressMapRef.current[track.name];
        let resumed_position = 0;
        if (saved) {
            resumed_position =
                saved.currentTime > 0 && saved.currentTime < durationRef.current - 1
                    ? saved.currentTime
                    : 0;
        }

        /** Load local media */
        const { audioState: audioMeta, subtitleState: subMeta } = await loadTrackMedia(track);

        /** TrackPlayer loading */
        await TrackPlayer.reset();

        await TrackPlayer.add({
            id: track.id,
            url: audioMeta.path!,
            title: audioMeta.name,
            artwork: audioMeta.coverUrl || undefined,
        });

        /** Resume saved position */
        if (resumed_position > 0) {
            await TrackPlayer.seekTo(resumed_position);
        }


        dispatch({
            type: "LOAD_TRACK",
            playlist: newPlaylist,
            index,
            audio: audioMeta,
            subtitle: subMeta,
            isPlaying:true
        });

        // if(playingRef.current) {
            await TrackPlayer.play()
        // }

    }, [audioState.name, isPlaying]);


    /** ─────────────────────────────────────────────
     *  SAVE PROGRESS LOOP
     *  ───────────────────────────────────────────── */
    useTrackPlayerEvents([Event.PlaybackProgressUpdated], (event) => {
        if (!audioState.name || durationRef.current === 0) return;

        // console.log('useTrackPlayerEvents', event.position)
        if(!!progressMapRef.current[audioState.name])
            progressMapRef.current[audioState.name].currentTime = event.position

        const segmentIndex = getSegmentIndex(event.position, state.subtitleState.markers);

        if(!!progressMapRef.current[audioState.name])
        progressMapRef.current[audioState.name].segmentHistory![segmentIndex] = event.position;

        currentTimeSV.value = event.position;
    });

    /** ─────────────────────────────────────────────
     *  SEEK
     *  ───────────────────────────────────────────── */
    const seek = useCallback(async (percentage: number) => {

        if (durationRef.current <= 0) return;

        const newTime = (percentage / 100) * durationRef.current;
        await TrackPlayer.seekTo(newTime);

        const segmentIndex = getSegmentIndex(newTime, state.subtitleState.markers);

        progressMapRef.current[audioState.name].segmentHistory![segmentIndex] = newTime;

    }, [subtitleState.cues, audioState.name]);

    /** ─────────────────────────────────────────────
     *  SUBTITLE CLICK
     *  ───────────────────────────────────────────── */
    const jumpToTime = async (time: number) => {
        seek((time / durationRef.current) * 100);
    };

    /** ─────────────────────────────────────────────
     *  SEGMENT CHANGE
     *  ───────────────────────────────────────────── */
    const changeSegment = useCallback(async (index: number) => {

        const start = index == 0 ? 0 : subtitleState.markers[index - 1]
        const end = index === subtitleState.markers.length  ? durationRef.current : subtitleState.markers[index]

        const saved = progressMapRef.current[audioState.name].segmentHistory![index];
        const target = (saved && saved >= start && saved <= end) ? saved : start;

        await TrackPlayer.seekTo(target);
        progressMapRef.current[audioState.name].segmentHistory![index] = target;

    },[subtitleState.cues, audioState.name]);

    /** ─────────────────────────────────────────────
     *  BASIC CONTROLS
     *  ───────────────────────────────────────────── */
    const togglePlay = () => {
        isPlaying ? TrackPlayer.pause() : TrackPlayer.play();
        dispatch({
            type: "SET_PLAYING",
            isPlaying: !isPlaying,
        });
    };

    const next = async () => {
        const nextIndex = currentTrackIndex + 1;
        if (nextIndex < playlist.length) {
            await playTrack(playlist[nextIndex], nextIndex, playlist, 1);
        }
    };

    const previous = async () => {
        const t = progressMapRef.current[audioState.name].currentTime;

        // If > 3 seconds, rewind to start
        if (t > 3) {
            await TrackPlayer.seekTo(0);
            return;
        }

        const prevIndex = currentTrackIndex - 1;

        if (prevIndex >= 0) {
            await playTrack(playlist[prevIndex], prevIndex, playlist, 1);
        } else {
            await TrackPlayer.seekTo(0);
        }
    };

    const skipForward = async () => {
        const currentTime = progressMapRef.current[audioState.name].currentTime
        const new_position = Math.min(currentTime + 10, durationRef.current)
        await seek((new_position/durationRef.current) * 100);
    };

    const skipBackward = async () => {
        const currentTime = progressMapRef.current[audioState.name].currentTime
        const new_position = Math.max(currentTime - 10, 0)
        await seek((new_position/durationRef.current) * 100);
    };

    /** ─────────────────────────────────────────────
     *  EXPORTED API
     *  ───────────────────────────────────────────── */

    return {
        audioState,
        subtitleState,
        playlist,
        currentTrackIndex,
        duration: durationRef.current,

        currentTimeSV,
        state,
        playTrack,
        togglePlay,
        seek,
        changeSegment,
        jumpToTime,
        next,
        previous,
        skipForward,
        skipBackward,
    };
};
