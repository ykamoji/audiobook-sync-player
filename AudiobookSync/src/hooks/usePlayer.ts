import React, {useCallback, useEffect, useRef} from 'react';
import TrackPlayer, {
    Event,
    State, TrackType,
    useTrackPlayerEvents,
} from 'react-native-track-player';
import {releaseSecureAccess} from 'react-native-document-picker'
import {usePlayerContext} from "../context/PlayerContext.tsx";

import {ProgressData, Track} from '../utils/types';
import {getSegmentIndex, loadTrackMedia} from '../utils/mediaLoader';
import {useStaticData} from "./useStaticData.ts";
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

    const { getTrackStaticData } = useStaticData()

    const { state, dispatch } = usePlayerContext();

    const { playlist, currentTrackIndex, audioState, subtitleState, isPlaying } = state;

    // console.log('outside', audioState.name, isPlaying)

    /** Resume + history tracking */
    const durationSV = useSharedValue(0);
    const currentTimeSV = useSharedValue(0)
    const isAutoUpdatingRef = useRef(true);

    // console.log(isPlaying, audioState.name)


    /* Release access when audio path changes */
    useEffect(() => {
        if (!!audioState.path) {
            releaseSecureAccess([audioState.path]).catch(() => {});
        }
    }, [audioState.path]);

    useEffect(() => {
        if(!!audioState.name){
            const { duration } = getTrackStaticData(audioState.name)
            durationSV.value = duration

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
                                            option:number,
                                            updateHistory?:boolean,
                                            overridePlay?:boolean,
                                    ) => {

        if(track.name === audioState.name) {
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
            dispatch({
                type: "SET_PLAYING",
                isPlaying: false,
            });
            await TrackPlayer.pause()
        }

        const {duration} = getTrackStaticData(track.name)

        /** Restore progress */
        const saved = progressMapRef.current[track.name];
        let resumed_position = 0;
        if (saved) {
            resumed_position =
                saved.currentTime > 0 && saved.currentTime < duration - 1
                    ? saved.currentTime
                    : 0;
        }

        durationSV.value = duration;

        /** Load local media */
        const { audioState: audioMeta, subtitleState: subMeta } = await loadTrackMedia(track);

        const { intro, duration:track_duration } = getTrackStaticData(audioMeta.name)

        /** TrackPlayer loading */
        await TrackPlayer.reset();

        await TrackPlayer.add({
            id: track.id,
            url: audioMeta.path!,
            title: audioMeta.name.replace(/\s*\(Chapter\s+\d+\)\s*$/, ''),
            artwork: audioMeta.coverPath || undefined,
            artist: intro,
            duration: track_duration
        });

        /** Resume saved position */
        if (resumed_position > 0) {
            await seek(resumed_position/duration * 100, updateHistory)
        }

        dispatch({
            type: "LOAD_TRACK",
            playlist: newPlaylist,
            index,
            audio: audioMeta,
            subtitle: subMeta,
            isPlaying: overridePlay == undefined || overridePlay,
        });

        if(overridePlay == undefined || overridePlay) {
            await TrackPlayer.play()
        }

    }, [audioState.name, isPlaying]);


    /** ─────────────────────────────────────────────
     *  SAVE PROGRESS LOOP
     *  ───────────────────────────────────────────── */
    useTrackPlayerEvents([Event.PlaybackProgressUpdated], (event) => {
        if (!audioState.name || durationSV.value === 0) return;

        currentTimeSV.value = event.position;

        if (!isAutoUpdatingRef.current) return;

        if(!!progressMapRef.current[audioState.name]){
            progressMapRef.current[audioState.name].currentTime = event.position

            const segmentIndex = getSegmentIndex(event.position, state.subtitleState.markers);
            progressMapRef.current[audioState.name].segmentHistory![segmentIndex] = event.position;
        }

    });

    useTrackPlayerEvents([Event.PlaybackState], (event) => {
        if (event.state === State.Playing) {
            isAutoUpdatingRef.current = true;
        }
    });

    /** ─────────────────────────────────────────────
     *  SEEK
     *  ───────────────────────────────────────────── */
    const seek = useCallback(async (percentage: number, updateHistory?:boolean) => {

        let duration = durationSV.value;
        if(duration <= 0){
            if(!audioState.name) return
            duration = getTrackStaticData(audioState.name).duration
            durationSV.value = duration
        }

        const newTime = (percentage / 100) * duration;
        await TrackPlayer.seekTo(newTime);

        if(updateHistory !== undefined && updateHistory) {
            const segmentIndex = getSegmentIndex(newTime, state.subtitleState.markers);
            progressMapRef.current[audioState.name].segmentHistory![segmentIndex] = newTime;
        }

    }, [subtitleState.cues, audioState.name]);

    /** ─────────────────────────────────────────────
     *  SUBTITLE CLICK
     *  ───────────────────────────────────────────── */
    const jumpToTime = useCallback(async (time: number) => {
        if(isPlaying) await TrackPlayer.pause()
        await seek((time / durationSV.value) * 100, true);
        if(isPlaying) await TrackPlayer.play()
    },[isPlaying]);

    /** ─────────────────────────────────────────────
     *  SEGMENT CHANGE
     *  ───────────────────────────────────────────── */
    const changeSegment = useCallback(async (index: number) => {

        const start = index == 0 ? 0 : subtitleState.markers[index - 1]
        const end = index === subtitleState.markers.length  ? durationSV.value : subtitleState.markers[index]

        const saved = progressMapRef.current[audioState.name].segmentHistory![index];
        const target = (saved && saved >= start && saved <= end) ? saved : start;

        // await TrackPlayer.seekTo(target);
        await seek(target / durationSV.value * 100, false);
        progressMapRef.current[audioState.name].segmentHistory![index] = target;

    },[subtitleState.cues, audioState.name]);

    /** ─────────────────────────────────────────────
     *  BASIC CONTROLS
     *  ───────────────────────────────────────────── */
    const togglePlay = useCallback((override?:boolean) => {

        if(override === undefined){
            isPlaying ? TrackPlayer.pause() : TrackPlayer.play();
            dispatch({
                type: "SET_PLAYING",
                isPlaying: !isPlaying,
            });
        }else{
            !override ? TrackPlayer.pause() : TrackPlayer.play();
        }

    },[isPlaying, dispatch]);

    const next = async () => {
        isAutoUpdatingRef.current = false;
        const nextIndex = currentTrackIndex + 1;
        if (nextIndex < playlist.length) {
            if(isPlaying) await TrackPlayer.pause()
            await playTrack(playlist[nextIndex], nextIndex, playlist, 1, false, isPlaying);
            if(isPlaying) await TrackPlayer.play()
        }
    };

    const previous = async () => {
        isAutoUpdatingRef.current = false;
        const prevIndex = currentTrackIndex - 1;
        if (prevIndex >= 0) {
            if(isPlaying) await TrackPlayer.pause()
            await playTrack(playlist[prevIndex], prevIndex, playlist, 1, false, isPlaying);
            if(isPlaying) await TrackPlayer.play()
        }
    };

    const skipForward = async () => {
        const currentTime = progressMapRef.current[audioState.name].currentTime
        const new_position = Math.min(currentTime + 10, durationSV.value)
        await seek((new_position/durationSV.value) * 100, true);
    };

    const skipBackward = async () => {
        const currentTime = progressMapRef.current[audioState.name].currentTime
        const new_position = Math.max(currentTime - 10, 0)
        await seek((new_position/durationSV.value) * 100, true);
    };

    /** ─────────────────────────────────────────────
     *  EXPORTED API
     *  ───────────────────────────────────────────── */

    return {
        audioState,
        subtitleState,
        playlist,
        currentTrackIndex,
        duration: durationSV,

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
