import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';

import {
    PlayIcon,
    PauseIcon,
    MoreHorizontalIcon,
    SkipBackIcon,
    SkipForwardIcon, RewindIcon, ForwardIcon, MenuIcon, LucideMenu,
} from 'lucide-react-native';
import {Forward10Icon, Rewind10Icon} from "./Icons.tsx";

interface ControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    progress: number;
    duration: number;
    segmentMarkers?: number[];
    currentTime: number;
    onSeek: (value: number) => void;
    onOpenMetadata: () => void;
    onOpenChapters: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const Controls: React.FC<ControlsProps> = ({
                                                      isPlaying,
                                                      onPlayPause,
                                                      progress,
                                                      duration,
                                                      currentTime,
                                                      onSeek,
                                                      onOpenMetadata,
                                                      onOpenChapters,
                                                      onNext,
                                                      onPrevious,
                                                      onSkipForward,
                                                      onSkipBackward,
                                                      hasNext,
                                                      hasPrevious
                                                  }) => {
    return (
        <View style={styles.root}>

            {/* PROGRESS + TIME */}
            <View style={styles.sliderContainer}>
                <Slider
                    value={progress}
                    minimumValue={0}
                    maximumValue={100}
                    onSlidingComplete={(values) => onSeek(values[0])}
                    minimumTrackTintColor="#f97316"
                    maximumTrackTintColor="#555"
                    thumbTintColor="#fff"
                />

                <View style={styles.timeRow}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>

            {/* MAIN CONTROLS */}
            <View style={styles.controlsRow}>

                {/* Left – Chapters */}
                <TouchableOpacity onPress={onOpenChapters} style={styles.sideButton}>
                    <LucideMenu size={26} color="#aaa" />
                </TouchableOpacity>

                {/* Previous */}
                <TouchableOpacity
                    disabled={!hasPrevious}
                    onPress={onPrevious}
                    style={[styles.smallControl, !hasPrevious && styles.disabled]}
                >
                    <SkipBackIcon size={32} color="#ddd" />
                </TouchableOpacity>

                {/* Rewind 10 */}
                <TouchableOpacity onPress={onSkipBackward} style={styles.smallControl}>
                    <Rewind10Icon size={32} stroke="#f97316" />
                </TouchableOpacity>

                {/* Play / Pause */}
                <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
                    {isPlaying ? (
                        <PauseIcon size={42} color="#000" />
                    ) : (
                        <PlayIcon size={42} color="#000" />
                    )}
                </TouchableOpacity>

                {/* Forward 10 */}
                <TouchableOpacity onPress={onSkipForward} style={styles.smallControl}>
                    <Forward10Icon size={32} stroke="#f97316" />
                </TouchableOpacity>

                {/* Next */}
                <TouchableOpacity
                    disabled={!hasNext}
                    onPress={onNext}
                    style={[styles.smallControl, !hasNext && styles.disabled]}
                >
                    <SkipForwardIcon size={32} color="#ddd" />
                </TouchableOpacity>

                {/* Metadata */}
                <TouchableOpacity onPress={onOpenMetadata} style={styles.sideButton}>
                    <MoreHorizontalIcon size={26} color="#aaa" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 14,
    },

    sliderContainer: {
        width: '100%',
        marginBottom: 8,
    },

    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -6,
    },

    timeText: {
        color: '#aaa',
        fontSize: 11,
        fontWeight: '500',
    },

    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 6,
    },

    sideButton: {
        padding: 6,
    },

    smallControl: {
        padding: 6,
        borderRadius: 30,
    },

    playButton: {
        width: 70,
        height: 70,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    disabled: {
        opacity: 0.3,
    },
});