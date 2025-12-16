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

interface ControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    duration: number;
    segmentMarkers: number[];
    currentTime: SharedValue<number>;
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
                                                      hasPrevious
                                                  }) => {

    return (
        <View style={styles.root}>

            {/* PROGRESS + TIME */}
            <View style={styles.sliderContainer}>
                {/*<Slider*/}
                {/*    value={progress}*/}
                {/*    minimumValue={0}*/}
                {/*    maximumValue={100}*/}
                {/*    onSlidingComplete={(values) => onSeek(values[0])}*/}
                {/*    minimumTrackTintColor="#f97316"*/}
                {/*    maximumTrackTintColor="#555"*/}
                {/*    thumbTintColor="#F86600"*/}
                {/*    trackStyle={{*/}
                {/*        zIndex:0*/}
                {/*    }}*/}
                {/*/>*/}
                <ProgressSlider
                    currentTimeSV={currentTime}
                    duration={duration}
                    onSeek={onSeek}
                />
                <View style={styles.markerContainer}>
                    {duration > 0 && segmentMarkers!.map((time, i) =>
                            <View
                                key={i}
                                style={[styles.marker, { left: `${(time / duration) * 100 }%` }]}
                            />
                    )}
                </View>
            </View>

            {/* MAIN CONTROLS */}
            <View style={styles.controlsRow}>

                {/* Left – Chapters */}
                <TouchableOpacity onPress={onOpenChapters} style={styles.sideButton}>
                    <LucideMenu size={22} color="#aaa" />
                </TouchableOpacity>

                {/* Previous */}
                <TouchableOpacity
                    disabled={!hasPrevious}
                    onPress={onPrevious}
                    style={[styles.smallControl, {paddingTop:10} , !hasPrevious && styles.disabled]}
                >
                    <SkipBackIcon size={24} style={{marginLeft:10}} color="#ddd" />
                </TouchableOpacity>

                {/* Rewind 10 */}
                <TouchableOpacity onPress={onSkipBackward} style={styles.smallControl}>
                    <Rewind10Icon size={36} stroke="#f97316" />
                </TouchableOpacity>

                {/* Play / Pause */}
                <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
                    {isPlaying ? (
                        <PauseIcon size={30} color="#000" />
                    ) : (
                        <PlayIcon size={30} color="#000" />
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
                    <SkipForwardIcon size={24} color="#ddd" />
                </TouchableOpacity>

                {/* Metadata */}
                <TouchableOpacity onPress={onOpenMetadata} style={styles.sideButton}>
                    <MoreHorizontalIcon size={22} color="#aaa" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        width: '100%',
        // paddingVertical: 12,
        paddingHorizontal: 8,
    },

    sliderContainer: {
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
        // backgroundColor:"white"
    },

    smallControl: {
        padding: 6,
        height: 48,
        width: 48,
        // backgroundColor:"white"
    },

    playButton: {
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },

    disabled: {
        opacity: 0.6,
    },
    markerContainer: {
        position: 'absolute',
        top: 18,
        bottom: 0,
        width: '100%',
    },
    marker: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 4,
        height: 4,
        backgroundColor: '#F86600',
        pointerEvents: 'none',
    }
});