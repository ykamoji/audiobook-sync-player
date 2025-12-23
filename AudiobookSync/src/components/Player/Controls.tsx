import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ProgressSlider } from "../../services/ProgressSlider.tsx";
import {
    PlayIcon,
    PauseIcon,
    MoreHorizontalIcon,
    SkipBackIcon,
    SkipForwardIcon,
    LucideMenu
} from 'lucide-react-native';
import {Forward10Icon, Rewind10Icon} from "../../services/Icons.tsx";
import {SharedValue} from "react-native-reanimated";
import {ExclusiveGesture} from "react-native-gesture-handler";
import {useTheme} from "../../utils/themes.ts";

interface ControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    duration: SharedValue<number>;
    segmentMarkers: number[];
    currentTime: SharedValue<number>;
    onSeek: (value: number) => Promise<void>;
    onOpenMetadata: () => void;
    onOpenChapters: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
    registerGesture:(g:ExclusiveGesture) => void;
}

export const Controls: React.FC<ControlsProps> = ({
                                                      isPlaying,
                                                      onPlayPause,
                                                      duration,
                                                      currentTime,
                                                      onSeek,
                                                      onOpenMetadata,
                                                      onOpenChapters,
                                                      onNext,
                                                      segmentMarkers,
                                                      onPrevious,
                                                      onSkipForward,
                                                      onSkipBackward,
                                                      hasNext,
                                                      hasPrevious,
                                                      registerGesture
                                                  }) => {

    const styles = STYLES(useTheme())

    return (
        <View style={styles.root}>

            {/* PROGRESS + TIME */}
            <View style={styles.sliderContainer}>
                <View style={styles.markerContainer}>
                    {duration.value > 0 && segmentMarkers!.map((time, i) =>
                        <View
                            key={i}
                            style={[styles.marker, { left: `${(time / duration.value) * 100 }%` }]}
                        />
                    )}
                </View>
                <ProgressSlider
                    currentTimeSV={currentTime}
                    duration={duration}
                    onSeek={onSeek}
                    registerGesture={registerGesture}
                />
            </View>

            {/* MAIN CONTROLS */}
            <View style={styles.controlsRow}>

                {/* Left – Chapters */}
                <TouchableOpacity onPress={onOpenChapters} style={styles.sideButton}>
                    <LucideMenu size={22} color={styles.sideIcon.color} />
                </TouchableOpacity>

                {/* Previous */}
                <TouchableOpacity
                    disabled={!hasPrevious}
                    onPress={onPrevious}
                    style={[styles.smallControl, {paddingTop:10} , !hasPrevious && styles.disabled]}
                >
                    <SkipBackIcon size={24} style={{marginLeft:10}} color={styles.smallIcon.color} />
                </TouchableOpacity>

                {/* Rewind 10 */}
                <TouchableOpacity onPress={onSkipBackward} style={styles.smallControl}>
                    <Rewind10Icon size={36} stroke="#f97316" />
                </TouchableOpacity>

                {/* Play / Pause */}
                <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
                    {isPlaying ? (
                        <PauseIcon size={30} color={styles.playIcon.color} />
                    ) : (
                        <PlayIcon size={30} color={styles.playIcon.color} />
                    )}
                </TouchableOpacity>

                {/* Forward 10 */}
                <TouchableOpacity onPress={onSkipForward} style={styles.smallControl}>
                    <Forward10Icon size={36} stroke="#f97316" />
                </TouchableOpacity>

                {/* Next */}
                <TouchableOpacity
                    disabled={!hasNext}
                    onPress={onNext}
                    style={[styles.smallControl,  {paddingTop:10}, !hasNext && styles.disabled]}
                >
                    <SkipForwardIcon size={24} color={styles.smallIcon.color} />
                </TouchableOpacity>

                {/* Metadata */}
                <TouchableOpacity onPress={onOpenMetadata} style={styles.sideButton}>
                    <MoreHorizontalIcon size={22} color={styles.sideIcon.color} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const STYLES = (theme:any) => StyleSheet.create({
    root: {
        width: '100%',
        paddingHorizontal: 8,
        paddingTop:5,
    },

    sliderContainer: {
        paddingBottom:15,
        width: '100%',
    },

    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap:8,
        marginTop: 6,
    },

    sideButton: {
        padding: 8,
    },

    sideIcon:{
        color: theme.sideIcon,
    },

    smallControl: {
        padding: 6,
        height: 48,
        width: 48,
    },

    smallIcon:{
        color: theme.smallIcon,
    },

    playButton: {
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: theme.playButton,
        alignItems: 'center',
        justifyContent: 'center',
    },

    playIcon:{
        color: theme.playIcon,
    },

    disabled: {
        opacity: 0.6,
    },
    markerContainer: {
        position: 'relative',
        top: 12.5,
        zIndex: 10,
    },
    marker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        height: 5,
        backgroundColor: '#F86600',
        pointerEvents: 'none',
    }
});