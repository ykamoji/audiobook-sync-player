import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    LayoutChangeEvent,
    Dimensions,
} from 'react-native';
import { findCueIndex } from '../utils/mediaLoader';
import {
    Gesture,
    GestureDetector, Pressable,
} from 'react-native-gesture-handler';

import Animated, {
    Easing,
    interpolate, interpolateColor,
    runOnJS, useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controls } from './Controls';
import {
    XIcon,
    ChevronDownIcon, PauseIcon, PlayIcon,
} from 'lucide-react-native';
import {SlideWindow} from "./SlideWindow.tsx";
import {usePlayerContext} from "../services/PlayerContext.tsx";
import {PlayerMode} from "../AppContent.tsx";
import {miniStyles, playerStyles} from "../utils/playerStyles.ts";

interface PlayerViewProps {
    currentTime: number;
    duration: number;
    onSegmentChange: (index: number) => void;
    playerMode: PlayerMode;
    onBack: (state:PlayerMode) => void;
    onTogglePlay: () => void;
    onSeek: (percentage: number) => void;
    onSubtitleClick: (time: number) => void;
    onNext: () => void;
    onPrevious: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onOpenMetadata: () => void;
}

const CUES_PER_SEGMENT = 100;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MINI_HEIGHT = 80;

export const PlayerView: React.FC<PlayerViewProps> = ({
                                                          currentTime,
                                                          duration,
                                                          onSegmentChange,
                                                          playerMode,
                                                          onBack,
                                                          onTogglePlay,
                                                          onSeek,
                                                          onSubtitleClick,
                                                          onNext,
                                                          onPrevious,
                                                          onSkipForward,
                                                          onSkipBackward,
                                                          onOpenMetadata,
                                                      }) => {

    const { state } =  usePlayerContext()

    const { currentTrackIndex, playlist, isPlaying, audioState, subtitleState } = state

    const displayedCues = subtitleState.cues
    const totalSegments = subtitleState.totalSegments
    const segmentMarkers = subtitleState.markers
    const hasNext = currentTrackIndex < playlist.length - 1
    const hasPrevious = currentTrackIndex > 0


    const insets = useSafeAreaInsets();

    const firstLoad = useRef(true);

    // UI
    const [showChapters, setShowChapters] = useState(false);

    // Scroll refs
    const scrollRef = useRef<ScrollView | null>(null);
    const containerHeightRef = useRef<number>(0);
    const scrollAtTop = useRef(true);
    const cueRefs = useRef<Record<string, View | null>>({});

    const currentProgress = duration > 0 ? (currentTime / duration) * 100 : 0

    // ----- REANIMATED SHARED VALUES -----
    const translateY = useSharedValue(0);
    const progress = useSharedValue(0);
    const colorScheme = useSharedValue(audioState.colorScheme);
    const fullImageProgress = useSharedValue(0);
    const expandedOnce = useSharedValue(false);


    const currentCueIndex = findCueIndex(subtitleState.cues, currentTime)

    let currentSegmentIndex = 0;

    if (currentCueIndex !== -1) {
        currentSegmentIndex = Math.floor(currentCueIndex / CUES_PER_SEGMENT);
    } else if (subtitleState.cues.length > 0) {
        const nextCue = subtitleState.cues.findIndex(c => c.start > currentTime);
        const fallbackIndex =
            nextCue > 0
                ? nextCue - 1
                : nextCue === 0
                    ? 0
                    : subtitleState.cues.length - 1;

        currentSegmentIndex = Math.floor(fallbackIndex / CUES_PER_SEGMENT);
    }

    // ----- AUTO-SCROLL TO ACTIVE CUE -----
    const scrollToActiveCue = (animated = true) => {
        if (!scrollRef.current || !displayedCues.length) return;
        if (currentCueIndex < 0) return;

        const cue = displayedCues[currentCueIndex];
        const ref = cueRefs.current[cue.id];
        if (!ref) return;

        ref.measureLayout(
            scrollRef.current.getInnerViewNode(),
            (x, y, w, h) => {
                const targetY = Math.max(0, y - 150);
                scrollRef.current?.scrollTo({ y: targetY, animated: animated });
            },
            () => {}
        );
    };

    useEffect(() => {
        firstLoad.current = true;
    }, [audioState.name]);

    useEffect(() => {
        if (currentCueIndex < 0) return;

        if (firstLoad.current) {
            firstLoad.current = false;
            scrollToActiveCue(false);
        } else {
            scrollToActiveCue(true);
        }
        scrollToActiveCue();
    }, [currentCueIndex, currentSegmentIndex, displayedCues]);


    const onSubtitleContainerLayout = (e: LayoutChangeEvent) => {
        containerHeightRef.current = e.nativeEvent.layout.height;
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };


    const miniOffset = SCREEN_HEIGHT - MINI_HEIGHT - insets.bottom - 37;

    const gestureStartY = useSharedValue(0);

    // ----- APPLE-MUSIC-STYLE DRAG -----
    const dragGesture = Gesture.Pan()
        .onStart(() => {
            // capture current sheet position when gesture starts
            gestureStartY.value = translateY.value;
        })
        .onUpdate((e) => {
            if (!scrollAtTop.current) return;

            // combine the gesture translation with the starting sheet position
            const rawY = gestureStartY.value + e.translationY;

            // clamp actual visual sheet position between full (0) and miniOffset
            translateY.value = Math.min(Math.max(rawY, 0), miniOffset);

            // use unclamped rawY for progress so artwork morph still triggers properly
            const effectiveProgress = Math.min(Math.max(rawY / miniOffset, 0), 1);

            progress.value = effectiveProgress;
        })
        .onEnd((e) => {
            const currentY = translateY.value;

            // How much user moved upward or downward relative to starting
            const dragUpAmount = gestureStartY.value - currentY; // positive when dragging UP
            const dragDownAmount = currentY - gestureStartY.value;

            const flickUp = e.velocityY < -600;
            const flickDown = e.velocityY > 600;

            let target = 0;

            // MINI → FULL (drag up)
            if (dragUpAmount > 30 || flickUp) {
                target = 0;
            }
            // FULL → MINI (drag down)
            else if (dragDownAmount > 120 || flickDown) {
                target = miniOffset;
            }
            // If neither strong enough → go to nearest
            else {
                target = currentY < miniOffset / 2 ? 0 : miniOffset;
            }

            if (target === miniOffset) {
                // Going into MINI mode → collapse the fullscreen artwork
                fullImageProgress.value = 0;
                expandedOnce.value = false;
            }

            translateY.value = withSpring(
                target,
                target === 0
                    ? { stiffness: 38, damping: 16, mass: 1.25 }  // smooth upward slide
                    : { stiffness: 70, damping: 25, mass: 1.1 }   // snappy collapse
            );

            progress.value = withSpring(target === 0 ? 0 : 1, {
                stiffness: 38,
                damping: 16,
                mass: 1,
            });

            runOnJS(onBack)(target === 0 ? "full" : "mini");

        });

    // ----- ANIMATED STYLES -----
    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    // Artwork morph (scale + transition)
    const artworkStyle = useAnimatedStyle(() => {
        const shrinkProgress = interpolate(
            progress.value,
            [0.60, 0.97],
            [0, 1],
            {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );

        // @ts-ignore
        const fastShrink = interpolate(
            shrinkProgress,
            [0, 1],
            [0, 1],
            {  // @ts-ignore
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );

        const scale = interpolate(
            fastShrink,
            [0, 1],
            [1, 0.16], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });

        const translateX = interpolate(
            fastShrink,
            [0, 1],
            [0, -SCREEN_WIDTH * 0.39], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });

        const translateY = interpolate(
            fastShrink,
            [0, 1],
            [0, -SCREEN_HEIGHT * 0.185],
            {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );

        return {
            transform: [{ translateX }, { translateY }, { scale }]
        };
    });


    useEffect(() => {
        colorScheme.value = audioState.colorScheme;
    }, [audioState.colorScheme]);


    // Main header/subtitle/controls fade in theme color as it collapses
    const bgStyle = useAnimatedStyle(() => {
        // Same shrink math you already trust
        const shrinkProgress = interpolate(
            progress.value,
            [0.60, 0.97],
            [0, 1],
            {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );


        const fastShrink = interpolate(
            shrinkProgress,
            [0, 1],
            [0, 1],
            {  // @ts-ignore
                easing: Easing.bezier(0.25, 0.1, 0.25, 1), // symmetric ease-in-out
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            }
        );

        const bgColor = interpolateColor(
            fastShrink,
            [0.8, 1],
            ["rgb(0,0,0)", `rgba(${colorScheme.value},0.65)`],
        )

        return {
           backgroundColor: bgColor,
        };
    });

    const useFadeWithProgress = (progress:any, config = { start: 0, end: 1 }) => {
        return useAnimatedStyle(() => {
            const opacity = interpolate(
                progress.value,
                [config.start, config.end],
                [1, 0],
                {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp"
                }
            );

            return { opacity };
        });
    };

    const useSlideRight = (progress: any, x = 80, y = 80) => {
        return useAnimatedStyle(() => {
            const translateX = interpolate(
                progress.value,
                [0.90, 1.0],
                [0, x],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            const translateY = interpolate(
                progress.value,
                [0.90, 1.0],
                [0, y],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return {
                transform: [{ translateX }, { translateY }]
            };
        });
    };

    const progressPlayerMode = useFadeWithProgress(progress, {start: 1, end: 0})

    const headerPlayerMode = useFadeWithProgress(progress)

    const trackNamePosPlayerMode = useSlideRight(progress, 25, -60)

    const trackNameColorPlayerMode = useAnimatedStyle(() => {
        return {
            color: interpolateColor(
                progress.value,
                [0, 1],
                ["#e5e7eb", "#000"]
            )
        };
    });

    const controlsPlayerMode = useFadeWithProgress(progress, {start: 1, end: 0.9})



    const toggleFullImage = () => {
        fullImageProgress.value = withTiming(
            fullImageProgress.value === 0 ? 1 : 0,
            {
                duration: 450,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1), // perfect “ease-in-out”
            }
        );

        if(expandedOnce.value){
            expandedOnce.value = false;
        }
        else{
            expandedOnce.value = true;
        }

    };


    const animatedWrapperStyle = useAnimatedStyle(() => {
        const fullHeight = SCREEN_HEIGHT;
        const portraitWidth = fullHeight *  9 / 16;

        const height = interpolate(
            fullImageProgress.value,
            [0, 1],
            [SCREEN_WIDTH, fullHeight]       // square → full height
        );

        const width = interpolate(
            fullImageProgress.value,
            [0, 1],
            [SCREEN_WIDTH, portraitWidth]    // square → portrait width
        );

        return {
            width,
            height,
            alignSelf: "center", // centers when width shrinks
        };
    });

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            width: "100%",
            height: "100%",
            // resizeMode: "cover",
        };
    });

    const scrollHiddenStyle = useAnimatedStyle(() => {

        if (!expandedOnce.value) {
            return { opacity: 1, transform: [{ translateY: 0 }] };
        }

        const translateY = interpolate(
            fullImageProgress.value,
            [0.97, 1],
            [0, SCREEN_HEIGHT]  // slide fully offscreen
        );

        const opacity = interpolate(
            fullImageProgress.value,
            [0, 1],      // 0 = square mode, 1 = full image
            [1, 0],      // fade out
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );


        return {
            opacity,
            transform: [{ translateY }],
        };
    });


    // ----------------------------------------------------
    // RENDER
    // ----------------------------------------------------
    return (
        <>
            <GestureDetector gesture={dragGesture}>
                <Animated.View
                    style={[
                        playerStyles.root,
                        containerStyle,
                    ]}
                    pointerEvents={showChapters ? "none" : "auto"}
                >
                    <Animated.View style={[miniStyles.progressTrack, progressPlayerMode]}>
                        <View
                            style={[
                                miniStyles.progressFill,
                                {width: `${Math.max(0, Math.min(currentProgress, 100))}%`},
                            ]}
                        />
                    </Animated.View>
                    <View pointerEvents={showChapters ? "none" : "auto"}>
                        {/* COVER ART */}
                        <Animated.View style={[[], bgStyle]}>
                            <Animated.View style={[playerStyles.coverContainer, artworkStyle]} pointerEvents={showChapters ? "none" : "auto"}>
                                {audioState.coverPath ? (
                                    <>
                                    <Pressable
                                        onPress={() => toggleFullImage()}
                                        style={[
                                            playerStyles.coverWrapper,
                                            // fullImage && {
                                            //     aspectRatio: 9/16,
                                            //     height:'100%',
                                            // }
                                        ]}
                                    >
                                        <Animated.View style={animatedWrapperStyle}>
                                        <Animated.Image
                                            source={{ uri: audioState.coverPath }}
                                            style={[
                                                playerStyles.coverImage,
                                                // fullImage && {}
                                                animatedImageStyle
                                            ]}
                                        />
                                        </Animated.View>
                                    </Pressable>
                                    </>
                                ) : (
                                    <View style={playerStyles.coverPlaceholder}>
                                        <Text style={playerStyles.coverPlaceholderText}>
                                            {audioState.name.substring(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </Animated.View>
                        </Animated.View>

                        {/* Header */}
                        <View
                            pointerEvents={playerMode === "full" ? "none" : "auto"}
                            style={[playerStyles.headerContainer, { paddingTop:insets.top }]}
                        >
                            <Animated.View style={headerPlayerMode}>
                                <TouchableOpacity
                                    onPress={() => {
                                        // runOnJS(onBack)('mini');
                                    }}
                                    style={playerStyles.headerBackButton}>
                                    <ChevronDownIcon stroke={"#fff"} />
                                </TouchableOpacity>
                            </Animated.View>

                            <View style={playerStyles.headerTextContainer}>
                                <Animated.View style={headerPlayerMode}>
                                    <Text style={playerStyles.nowPlayingLabel}>Now Playing</Text>
                                </Animated.View>
                                <Animated.View style={trackNamePosPlayerMode}>
                                    <Animated.Text style={[playerStyles.trackTitle, trackNameColorPlayerMode ]} numberOfLines={2}>
                                        {audioState.name}
                                    </Animated.Text>
                                </Animated.View>
                                <Animated.View
                                    style={[miniStyles.controlsContainer, controlsPlayerMode]}>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            if(playerMode === 'mini') {
                                                e.stopPropagation();
                                                onTogglePlay();
                                            }
                                        }}
                                        activeOpacity={0.8}
                                        style={miniStyles.playButton}
                                    >
                                        {isPlaying ? (
                                            <PauseIcon size={30} color="#fff"/>
                                        ) : (
                                            <PlayIcon size={30} color="#fff"/>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        </View>

                        {/* SUBTITLES */}
                        <Animated.View
                            style={[playerStyles.subtitlesContainer,
                                scrollHiddenStyle
                            ]}
                            onLayout={onSubtitleContainerLayout}
                        >
                            <ScrollView
                                ref={scrollRef}
                                key={audioState.name}
                                style={playerStyles.subtitlesScroll}
                                pointerEvents={showChapters  ? 'none' : 'auto'}
                                contentContainerStyle={playerStyles.subtitlesContent}
                                scrollEventThrottle={16}
                                onScroll={({ nativeEvent }) => {
                                    if (showChapters) return;
                                    const y = nativeEvent.contentOffset.y;
                                    scrollAtTop.current = y <= 0;
                                }}
                            >
                                {displayedCues.map((cue, index) => {
                                    const isActive = index === currentCueIndex;
                                    return (
                                        <View
                                            key={cue.id}
                                            ref={(ref) => { cueRefs.current[cue.id] = ref }}
                                            style={[
                                                playerStyles.cueContainer,
                                                isActive && playerStyles.cueContainerActive,
                                            ]}
                                        >
                                            <Text
                                                onPress={() => onSubtitleClick(cue.start)}
                                                style={[
                                                    playerStyles.cueText,
                                                    isActive
                                                        ? playerStyles.cueTextActive
                                                        : playerStyles.cueTextInactive,
                                                ]}
                                            >
                                                {cue.text}
                                            </Text>
                                        </View>
                                    );
                                })}

                                {displayedCues.length === 0 && (
                                    <View style={playerStyles.noTextContainer}>
                                        <Text style={playerStyles.noText}>
                                            No text content for this section.
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        </Animated.View>

                        {/* CONTROLS */}
                        <View style={playerStyles.controlsContainer}>
                            <Controls
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                                duration={duration}
                                progress={currentProgress}
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
                    </View>
                </Animated.View>
            </GestureDetector>

            <SlideWindow style={playerStyles.chaptersOverlayRoot}
                         open={showChapters}
                         side={"bottom"}
                         height={"60%"}
                         onClose={() => setShowChapters(false)}>

                <View style={[playerStyles.chaptersSheet, {}]}>
                    <View style={playerStyles.chaptersHeader}>
                        <View style={playerStyles.chaptersHeaderLeft}>
                            <Text style={playerStyles.chaptersTitle}>{audioState.name}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowChapters(false)}
                            style={playerStyles.chaptersCloseButton}
                        >
                            <XIcon size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <View style={[playerStyles.chaptersList, playerStyles.chaptersListContent]}>
                        {Array.from({length: totalSegments}).map((_, i) => {
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
                                    style={[
                                        playerStyles.chapterItem,
                                        isActive && playerStyles.chapterItemActive,
                                    ]}
                                    onPress={() => {
                                        onSegmentChange(i);
                                        setShowChapters(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            playerStyles.chapterIndex,
                                            isActive && playerStyles.chapterIndexActive,
                                        ]}
                                    >
                                        1.{i + 1}
                                    </Text>

                                    <Text
                                        style={[
                                            playerStyles.chapterDuration,
                                            isActive && playerStyles.chapterDurationActive,
                                        ]}
                                    >
                                        {formatTime(dynDuration)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </SlideWindow>
        </>
    );
};
