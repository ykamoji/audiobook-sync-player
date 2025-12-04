import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    LayoutChangeEvent,
    Dimensions,
    Animated,
} from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Controls } from './Controls';
import { XIcon, ListIcon, ChevronDownIcon } from './Icons.tsx';

import { AudioFileState, SubtitleFileState, SubtitleCue } from '../utils/types';

interface PlayerViewProps {
    audioState: AudioFileState;
    subtitleState: SubtitleFileState;
    displayedCues: SubtitleCue[];
    currentCueIndex: number;
    currentTime: number;
    duration: number;

    currentSegmentIndex: number;
    totalSegments: number;
    segmentMarkers: number[];
    onSegmentChange: (index: number) => void;

    isPlaying: boolean;
    onBack: () => void;
    onTogglePlay: () => void;
    onSeek: (percentage: number) => void;
    onSubtitleClick: (time: number) => void;
    onNext: () => void;
    onPrevious: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onOpenMetadata: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

const CUES_PER_SEGMENT = 100;

export const PlayerView: React.FC<PlayerViewProps> = ({
                                                          audioState,
                                                          subtitleState,
                                                          displayedCues,
                                                          currentCueIndex,
                                                          currentTime,
                                                          duration,
                                                          segmentMarkers,
                                                          currentSegmentIndex,
                                                          totalSegments,
                                                          onSegmentChange,
                                                          isPlaying,
                                                          onBack,
                                                          onTogglePlay,
                                                          onSeek,
                                                          onSubtitleClick,
                                                          onNext,
                                                          onPrevious,
                                                          onSkipForward,
                                                          onSkipBackward,
                                                          onOpenMetadata,
                                                          hasNext,
                                                          hasPrevious,
                                                      }) => {
    const insets = useSafeAreaInsets();

    // UI State
    const [showChapters, setShowChapters] = useState(false);

    // Scroll + subtitle layout refs
    const scrollRef = useRef<ScrollView | null>(null);
    const cuePositionsRef = useRef<Record<string, number>>({});
    const containerHeightRef = useRef<number>(0);

    // Track when list is at the top (to allow swipe-down)
    const scrollAtTop = useRef(true);

    // Animated vertical drag
    const translateY = useRef(new Animated.Value(0)).current;

    // ---------------------------
    // GESTURE HANDLER SWIPE-DOWN
    // ---------------------------
    const dragGesture = useMemo(() => {
        return Gesture.Pan()
            .onUpdate((event) => {
                if (event.translationY > 0 && scrollAtTop.current) {
                    translateY.setValue(event.translationY);
                }
            })
            .onEnd((event) => {
                const shouldClose =
                    event.translationY > 120 || event.velocityY > 600;

                if (shouldClose) {
                    onBack();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            })
            .runOnJS(true);
    }, [onBack]);

    // Animated style
    const swipeStyle = {
        transform: [{ translateY }],
    };

    // ---------------------------
    // AUTO-SCROLL TO ACTIVE CUE
    // ---------------------------
    const scrollToActiveCue = () => {
        if (!scrollRef.current || !displayedCues.length) return;
        if (currentCueIndex < 0 || currentCueIndex >= displayedCues.length) return;

        const cue = displayedCues[currentCueIndex];
        const y = cuePositionsRef.current[cue.id];
        if (y == null) return;

        const containerHeight =
            containerHeightRef.current || Dimensions.get('window').height * 0.4;

        const targetY = Math.max(0, y - containerHeight * 0.4);

        scrollRef.current.scrollTo({
            y: targetY,
            animated: true,
        });
    };

    useEffect(() => {
        scrollToActiveCue();
    }, [currentCueIndex, currentSegmentIndex, displayedCues]);

    // Layout tracking
    const onSubtitleLayout = (cueId: string) => (e: LayoutChangeEvent) => {
        cuePositionsRef.current[cueId] = e.nativeEvent.layout.y;
    };

    const onSubtitleContainerLayout = (e: LayoutChangeEvent) => {
        containerHeightRef.current = e.nativeEvent.layout.height;
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // ----------------------------------------------------
    // RENDER
    // ----------------------------------------------------
    return (
        <>
            <GestureDetector gesture={dragGesture}>
                <Animated.View
                    style={[
                        styles.root,
                        swipeStyle,
                        { paddingTop: insets.top, paddingBottom: insets.bottom },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <TouchableOpacity onPress={onBack} style={styles.headerBackButton}>
                            <ChevronDownIcon />
                        </TouchableOpacity>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.nowPlayingLabel}>Now Playing</Text>
                            <Text style={styles.trackTitle}>{audioState.name}</Text>
                        </View>
                    </View>

                    {/* COVER ART */}
                    <View style={styles.coverContainer}>
                        {audioState.coverPath ? (
                            <View style={styles.coverWrapper}>
                                <Image source={{ uri: audioState.coverPath }} style={styles.coverImage} />
                                <View style={styles.coverBorder} />
                            </View>
                        ) : (
                            <View style={styles.coverPlaceholder}>
                                <Text style={styles.coverPlaceholderText}>
                                    {audioState.name.substring(0, 2).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* SUBTITLES */}
                    <View style={styles.subtitlesContainer} onLayout={onSubtitleContainerLayout}>
                        <ScrollView
                            ref={scrollRef}
                            style={styles.subtitlesScroll}
                            contentContainerStyle={styles.subtitlesContent}
                            scrollEventThrottle={16}
                            onScroll={({ nativeEvent }) => {
                                const y = nativeEvent.contentOffset.y;
                                scrollAtTop.current = y <= 0;
                            }}
                        >
                            {displayedCues.map((cue, index) => {
                                const isActive = index === currentCueIndex;
                                return (
                                    <View
                                        key={cue.id}
                                        onLayout={onSubtitleLayout(cue.id)}
                                        style={[styles.cueContainer, isActive && styles.cueContainerActive]}
                                    >
                                        <Text
                                            onPress={() => onSubtitleClick(cue.start)}
                                            style={[
                                                styles.cueText,
                                                isActive ? styles.cueTextActive : styles.cueTextInactive,
                                            ]}
                                        >
                                            {cue.text}
                                        </Text>
                                    </View>
                                );
                            })}

                            {displayedCues.length === 0 && (
                                <View style={styles.noTextContainer}>
                                    <Text style={styles.noText}>No text content for this section.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    {/* CONTROLS */}
                    <View style={styles.controlsContainer}>
                        <Controls
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            duration={duration}
                            progress={duration > 0 ? (currentTime / duration) * 100 : 0}
                            onPlayPause={onTogglePlay}
                            onSeek={onSeek}
                            onNext={onNext}
                            onPrevious={onPrevious}
                            onSkipForward={onSkipForward}
                            onSkipBackward={onSkipBackward}
                            onOpenMetadata={onOpenMetadata}
                            onOpenChapters={() => setShowChapters(true)}
                            segmentMarkers={segmentMarkers}
                            hasNext={hasNext}
                            hasPrevious={hasPrevious}
                        />
                    </View>

                    <View style={styles.ambientGlow} pointerEvents="none" />
                </Animated.View>
            </GestureDetector>

            {/* CHAPTERS MODAL */}
            {showChapters && (
                <View style={styles.chaptersOverlayRoot} pointerEvents="box-none">
                    <TouchableOpacity
                        style={styles.chaptersBackdrop}
                        onPress={() => setShowChapters(false)}
                    />

                    <View style={[styles.chaptersSheet, { paddingBottom: insets.bottom }]}>
                        <View style={styles.chaptersHeader}>
                            <View style={styles.chaptersHeaderLeft}>
                                <ListIcon />
                                <Text style={styles.chaptersTitle}>{audioState.name}</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setShowChapters(false)}
                                style={styles.chaptersCloseButton}
                            >
                                <XIcon />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.chaptersList}
                            contentContainerStyle={styles.chaptersListContent}
                        >
                            {Array.from({ length: totalSegments }).map((_, i) => {
                                let dynDuration = 0;

                                if (subtitleState.cues.length > 0) {
                                    const startIdx = i * CUES_PER_SEGMENT;
                                    const endIdx = Math.min(
                                        (i + 1) * CUES_PER_SEGMENT - 1,
                                        subtitleState.cues.length - 1
                                    );

                                    if (startIdx < subtitleState.cues.length && endIdx >= startIdx) {
                                        dynDuration =
                                            subtitleState.cues[endIdx].end -
                                            subtitleState.cues[startIdx].start;
                                    }
                                } else if (duration > 0) {
                                    dynDuration = duration;
                                }

                                const isActive = currentSegmentIndex === i;

                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.chapterItem, isActive && styles.chapterItemActive]}
                                        onPress={() => {
                                            onSegmentChange(i);
                                            setShowChapters(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.chapterIndex,
                                                isActive && styles.chapterIndexActive,
                                            ]}
                                        >
                                            1.{i + 1}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.chapterDuration,
                                                isActive && styles.chapterDurationActive,
                                            ]}
                                        >
                                            {formatTime(dynDuration)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            )}
        </>
    );
};

// ------------------ ORIGINAL FULL STYLES ------------------

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'black',
        flexDirection: 'column',
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBackButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 999,
    },
    headerTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    nowPlayingLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: '#f97316',
        letterSpacing: 1.5,
        fontWeight: '600',
    },
    trackTitle: {
        marginTop: 2,
        fontSize: 14,
        fontWeight: '700',
        color: '#e5e7eb',
    },
    coverContainer: {
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: Dimensions.get('window').height * 0.4,
        minHeight: 260,
    },
    coverWrapper: {
        width: '60%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    coverPlaceholder: {
        width: '50%',
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: '#1f2933',
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverPlaceholderText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#6b7280',
    },
    subtitlesContainer: {
        flex: 1,
        marginTop: 8,
    },
    subtitlesScroll: {
        flex: 1,
    },
    subtitlesContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 140,
    },
    cueContainer: {
        marginBottom: 18,
    },
    cueContainerActive: {},
    cueText: {
        fontSize: 20,
        lineHeight: 28,
        textAlign: 'center',
        fontWeight: '600',
    },
    cueTextActive: {
        color: '#f97316',
        fontWeight: '700',
    },
    cueTextInactive: {
        color: '#9ca3af',
    },
    noTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    noText: {
        color: '#6b7280',
    },
    controlsContainer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 8,
        paddingHorizontal: 8,
        paddingBottom: 4,
    },
    ambientGlow: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(249,115,22,0.15)',
        top: '40%',
        left: '50%',
        marginLeft: -200,
        marginTop: -200,
    },
    chaptersOverlayRoot: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    chaptersBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    chaptersSheet: {
        backgroundColor: '#111111',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
    },
    chaptersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    chaptersHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    chaptersTitle: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    chaptersCloseButton: {
        padding: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    chaptersList: {
        maxHeight: Dimensions.get('window').height * 0.4,
    },
    chaptersListContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chapterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chapterItemActive: {
        backgroundColor: '#f97316',
    },
    chapterIndex: {
        fontSize: 13,
        color: '#e5e7eb',
        fontWeight: '600',
    },
    chapterIndexActive: {
        color: '#111827',
    },
    chapterDuration: {
        fontSize: 11,
        color: '#6b7280',
    },
    chapterDurationActive: {
        color: '#111827',
    },
});

export default PlayerView;
