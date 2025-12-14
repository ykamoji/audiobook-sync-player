import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Dimensions, Text, TouchableOpacity, View,} from 'react-native';
import {getSegmentIndex} from '../utils/mediaLoader';
import {Gesture, GestureDetector, Pressable,} from 'react-native-gesture-handler';

import Animated, {
    Easing,
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Controls} from './Controls';
import {ChevronDownIcon, PauseIcon, PlayIcon, XIcon,} from 'lucide-react-native';
import {SlideWindow} from "./SlideWindow.tsx";
import {PlayerMode} from "../AppContent.tsx";
import {miniStyles, playerStyles} from "../utils/playerStyles.ts";
import {useStaticData} from "../hooks/useStaticData.tsx";
import {usePlayer} from "../hooks/usePlayer.ts";
import {ProgressData, Track} from "../utils/types.ts";
import {PlayerScroll} from "./PlayerScroll.tsx";

interface PlayerViewProps {
    playerMode: PlayerMode;
    onBack: (state:PlayerMode) => void;
    onOpenMetadata: (name:string) => void;
    progressMapRef:  React.MutableRefObject<Record<string, ProgressData>>;
    saveProgress: (
        trackName: string,
        currentTime: number,
        segmentHistory: Record<number, number>
    ) => void;

}

export interface PlayerViewRef {
    playTrack: (track: Track, index: number, newPlaylist: Track[], option: number) => Promise<void>;
    savePlayerProgress: () => void
}

const CUES_PER_SEGMENT = 100;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MINI_HEIGHT = 80;

export const PlayerView = forwardRef<PlayerViewRef, PlayerViewProps>(({
                                                                     playerMode,
                                                                     onBack,
                                                                     saveProgress,
                                                                     progressMapRef,
                                                                     onOpenMetadata,
                                                                 }, ref) => {

    const {currentTimeSV, duration, changeSegment, next, previous, seek, togglePlay, state,
        jumpToTime, skipBackward, skipForward, playTrack } = usePlayer({progressMapRef});

    const { currentTrackIndex, playlist, isPlaying, audioState, subtitleState } = state

    const savePlayerProgress = () => {
        if(!!audioState.name){
            // console.log('inside savePlayerProgress', progressMapRef.current[audioState.name].currentTime);
            saveProgress(audioState.name,
                progressMapRef.current[audioState.name].currentTime,
                progressMapRef.current[audioState.name].segmentHistory!);
        }
    }

    const controlSaveProgress = () => {
        // console.log('inside controlSaveProgress', progressMapRef.current[audioState.name].currentTime);
        saveProgress(audioState.name, progressMapRef.current[audioState.name].currentTime, progressMapRef.current[audioState.name].segmentHistory!)
    }

    useImperativeHandle(ref, () => ({
        playTrack,
        savePlayerProgress,
    }));

    const { getScheme } = useStaticData()

    const insets = useSafeAreaInsets();

    // UI
    const [showChapters, setShowChapters] = useState(false);

    // const containerHeightRef = useRef<number>(0);
    const scrollAtTop = useRef(true);

    const {scheme} = getScheme(audioState.name)


    const miniOffset = SCREEN_HEIGHT - MINI_HEIGHT - insets.bottom - 37;

    // ----- REANIMATED SHARED VALUES -----
    const translateY = useSharedValue(miniOffset);
    const progress = useSharedValue(1);
    const colorScheme = useSharedValue(scheme);
    const fullImageProgress = useSharedValue(0);
    const expandedOnce = useSharedValue(false);

    useEffect(() => {
        colorScheme.value = scheme
    }, [audioState.name]);

    let currentSegmentIndex = getSegmentIndex(currentTimeSV.value, subtitleState.markers)

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {

        if (playerMode === "full") {
            translateY.value = withSpring(
                0,
                { stiffness: 38, damping: 16, mass: 1.25 }
            );

            progress.value = withSpring(0, {
                stiffness: 38,
                damping: 16,
                mass: 1.25,
            });

            return;
        }
    }, [playerMode, audioState.name]);

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
            progress.value = Math.min(Math.max(rawY / miniOffset, 0), 1);
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

            if (target === miniOffset) {
                // Going into MINI mode → collapse the fullscreen artwork
                // collapse artwork smoothly
                fullImageProgress.value = withTiming(
                    0,
                    { duration: 300 },
                    (finished) => {
                        if (finished) {
                            expandedOnce.value = false;
                        }
                    }
                );
            }

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
            [0.60, 1],
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

    const progressPlayerMode = useFadeWithProgress(progress, {start: 1, end: 0.98})


    const progressPlayerModeStyle = useAnimatedStyle(() => {

        const progress = duration.value > 0 ? (currentTimeSV.value / duration.value) * 100 : 0;

        return {
            width: `${Math.max(0, Math.min(progress, 100))}%`,
        };
    });

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

    const controlsPlayerMode = useFadeWithProgress(progress, {start: 1, end: 0.95})

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
            alignSelf: "center",
        };
    });

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            width: "100%",
            height: "100%",
        };
    });

    const easing = Easing.bezierFn(0.25, 0.1, 0.25, 1)

    const scrollHiddenStyle = useAnimatedStyle(() => {


        let easedProgress = easing(fullImageProgress.value);

        let translateY = interpolate(
            easedProgress,
            [0, 1],
            [0, SCREEN_HEIGHT],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp",}
        );

        if (expandedOnce.value) {

            translateY = interpolate(
                easedProgress,
                [0.1, 1],
                [0, SCREEN_HEIGHT],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
        }

        const opacity = interpolate(
            fullImageProgress.value,
            [0, 1],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const collapseToMini = () => {
        "worklet";

        fullImageProgress.value = withTiming(
            0,
            {
                duration: 450,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1), // perfect “ease-in-out”
            },
            () => {
                expandedOnce.value = false;
            }
        );

        translateY.value = withSpring(
            miniOffset,
            { stiffness: 70, damping: 25, mass: 1.1 }
        );

        progress.value = withSpring(1, {
            stiffness: 70,
            damping: 25,
            mass: 1.1,
        });

        // notify app side
        runOnJS(onBack)("mini");
    };

    const tapToExpandGesture = Gesture.Tap()
        .onEnd((_, success) => {
            if (!success) return;
            if (playerMode === 'mini') {
                runOnJS(onBack)("full");
                translateY.value = withSpring(
                    0,
                    { stiffness: 38, damping: 16, mass: 1.25 }
                );

                progress.value = withSpring(0, { stiffness: 38, damping: 16, mass: 1.25 });
            }
        });


    // ----------------------------------------------------
    // RENDER
    // ----------------------------------------------------

    if(!(!!audioState.name)){
        return <></>
    }

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
                        <Animated.View
                            style={[
                                miniStyles.progressFill,
                                progressPlayerModeStyle,
                            ]}
                        />
                    </Animated.View>
                    <View pointerEvents={showChapters ? "none" : "auto"}>
                        {/* COVER ART */}
                        {playerMode === 'mini' && (
                            <GestureDetector gesture={tapToExpandGesture}>
                                <View style={miniStyles.miniOverlay} pointerEvents="box-only" />
                            </GestureDetector>
                        )}
                        <Animated.View style={[[], bgStyle]}>
                            <Animated.View style={[playerStyles.coverContainer, artworkStyle]} pointerEvents={showChapters ? "none" : "auto"}>
                                {audioState.coverPath ? (
                                    <>
                                    <Pressable
                                        onPress={() => toggleFullImage()}
                                        style={[playerStyles.coverWrapper,]}
                                    >
                                        <Animated.View style={animatedWrapperStyle}>
                                        <Animated.Image
                                            source={{ uri: audioState.coverPath }}
                                            style={[playerStyles.coverImage, animatedImageStyle]}
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
                        <View style={[playerStyles.headerContainer, { paddingTop:insets.top }]}>
                            <Animated.View style={headerPlayerMode}>
                                <TouchableOpacity
                                    onPress={() => {
                                        runOnJS(collapseToMini)();
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
                                                // savePlayerProgress()
                                                controlSaveProgress()
                                                togglePlay();
                                            }
                                        }}
                                        activeOpacity={0.8}
                                        style={[
                                            miniStyles.playButton,
                                            playerMode === 'full' && { opacity: 0 },
                                        ]}>
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
                        >
                            <PlayerScroll
                                displayedCues={subtitleState.cues}
                                currentTimeSV={currentTimeSV}
                                jumpToTime={jumpToTime}
                                showChapters={showChapters}
                            />
                        </Animated.View>

                        {/* CONTROLS */}
                        <View style={playerStyles.controlsContainer}>
                            <Controls
                                isPlaying={isPlaying}
                                currentTime={currentTimeSV}
                                duration={duration.value}
                                onPlayPause={()=>{
                                    controlSaveProgress()
                                    togglePlay()
                                }}
                                onSeek={seek}
                                onNext={next}
                                onPrevious={previous}
                                onSkipForward={skipForward}
                                onSkipBackward={skipBackward}
                                onOpenMetadata={()=>{
                                    onOpenMetadata(audioState.name)
                                }}
                                onOpenChapters={() => setShowChapters(true)}
                                segmentMarkers={subtitleState.markers}
                                hasNext={currentTrackIndex < playlist.length - 1}
                                hasPrevious={currentTrackIndex > 0}
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
                        {Array.from({length: subtitleState.totalSegments}).map((_, i) => {
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
                            } else if (duration.value > 0) {
                                dynDuration = duration.value;
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
                                        changeSegment(i).then();
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
    )
});
