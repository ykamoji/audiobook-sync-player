import React, {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {Dimensions, Text, TouchableOpacity, useColorScheme, View,} from 'react-native';
import {ExclusiveGesture, Gesture, GestureDetector, Pressable,} from 'react-native-gesture-handler';

import Animated, {
    Easing,
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withRepeat, withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Controls} from '../components/Player/Controls.tsx';
import {ChevronDownIcon, PauseIcon, PlayIcon,} from 'lucide-react-native';
import {PlayerMode} from "../AppContent.tsx";
import {miniStyles, PLAYER_STYLE} from "../utils/playerStyles.ts";
import {useStaticData} from "../hooks/useStaticData.ts";
import {usePlayer} from "../hooks/usePlayer.ts";
import {ProgressData, Track} from "../utils/types.ts";
import {PlayerScroll} from "../components/Player/PlayerScroll.tsx";
import {Segments} from "../components/Player/Segments.tsx";
import {Media, MediaHandle} from "../components/Player/Media.tsx";
import {useTheme} from "../utils/themes.ts";

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
    playTrack: (track: Track, index: number, newPlaylist: Track[], option: number,
                updateHistory?:boolean, overridePlay?:boolean) => Promise<void>;
    savePlayerProgress: () => void
}

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
            saveProgress(audioState.name,
                progressMapRef.current[audioState.name].currentTime,
                progressMapRef.current[audioState.name].segmentHistory!);
        }
    }

    const controlSaveProgress = () => {
        saveProgress(audioState.name, progressMapRef.current[audioState.name].currentTime, progressMapRef.current[audioState.name].segmentHistory!)
    }

    useImperativeHandle(ref, () => ({
        playTrack,
        savePlayerProgress,
    }));

    const { getTrackStaticData } = useStaticData()

    const insets = useSafeAreaInsets();

    // UI
    const [showSegments, setShowSegments] = useState(false);
    const [controlsGesture, setControlsGesture] = useState<ExclusiveGesture | null>(null);
    const [fullImage, setFullImage] = useState<boolean>(false);

    const scrollAtTop = useRef(true);
    const { scheme, dims, intro } = getTrackStaticData(audioState.name)

    const miniOffset = SCREEN_HEIGHT - MINI_HEIGHT - insets.bottom - 37;

    // ----- REANIMATED SHARED VALUES -----
    const translateY = useSharedValue(miniOffset);
    const progress = useSharedValue(1);
    const colorScheme = useSharedValue(scheme);
    const fullImageProgress = useSharedValue(0);
    const expandedOnce = useSharedValue(false);
    const panDirection = useSharedValue(1);

    const mediaRef = useRef<MediaHandle>(null);

    const D = 15000;
    const panProgress = useDerivedValue(() => {
        if (fullImageProgress.value < 1) {
            return 0; // ALWAYS centered before and during zoom
        }

        return withRepeat(
            withSequence(
                withTiming(-1, { duration:  D, easing: Easing.linear }),
                withTiming(1, { duration: 2 *  D, easing: Easing.linear }),
                withTiming(0, { duration:  D, easing: Easing.linear })
            ),
            -1,
            false // IMPORTANT: no auto-reverse
        );
    });

    useEffect(() => {
        colorScheme.value = scheme
    }, [audioState.name]);

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
        else{
            if(audioState.mediaPath && fullImage){
                setFullImage(false);
            }
        }

    }, [playerMode, audioState.name]);


    const onRegisterControlsGesture = (gesture: ExclusiveGesture) => {
        setControlsGesture(gesture);
    };

    const gestureStartY = useSharedValue(0);

    // ----- APPLE-MUSIC-STYLE DRAG -----
    const dragGesture = useMemo(() => {
        const pan = Gesture.Pan()
            // .requireExternalGestureToFail(controlsGestureRef.current! as any)
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
                        ? {stiffness: 38, damping: 16, mass: 1.25}  // smooth upward slide
                        : {stiffness: 70, damping: 25, mass: 1.1}   // snappy collapse
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
                        {duration: 300},
                        (finished) => {
                            if (finished) {
                                expandedOnce.value = false;
                            }
                        }
                    );
                }

                runOnJS(onBack)(target === 0 ? "full" : "mini");

            });

        if (controlsGesture) {
            pan.requireExternalGestureToFail(controlsGesture as any);
        }

        return pan
    },[controlsGesture]);

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

    const systemScheme = useColorScheme();

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
            ["rgb(0,0,0)", `rgba(${colorScheme.value},${ systemScheme === 'light' ? 1: 0.65 })`],
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

    const trackIntroPlayerMode = useAnimatedStyle(() => {
        return {
            color: interpolateColor(
                progress.value,
                [0, 1],
                ["#e5e7eb", "#000"]
            ),
            fontSize: interpolate(progress.value,
                [0, 0.5, 0.6, 1],
                [14, 14, 12, 11]
            )
        }
    });

    const controlsPlayerMode = useFadeWithProgress(progress, {start: 1, end: 0.95})

    const toggleFullImage = () => {
        const expanding = fullImageProgress.value === 0;

        if (expanding) {
            // Randomize direction ONCE per expand
            panDirection.value = Math.random() > 0.5 ? 1 : -1;
        }

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

        const imgW = dims?.[0] ?? SCREEN_WIDTH;
        const imgH = dims?.[1] ?? SCREEN_WIDTH;

        const imageAspect = imgW / imgH;
        const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;

        let targetWidth;
        let targetHeight;

        if (imageAspect > screenAspect) {
            // Image is wider than screen → cover height (crop top/bottom)
            targetHeight = SCREEN_HEIGHT;
            targetWidth = SCREEN_HEIGHT * imageAspect;
        } else {
            // Image is taller than screen → cover width (crop sides)
            targetWidth = SCREEN_WIDTH;
            targetHeight = SCREEN_WIDTH / imageAspect;
        }

        const height = interpolate(
            fullImageProgress.value,
            [0, 1],
            [SCREEN_WIDTH, targetHeight]       // square → full height
        );

        const width = interpolate(
            fullImageProgress.value,
            [0, 1],
            [SCREEN_WIDTH, targetWidth]    // square → portrait width
        );

        return {
            width,
            height,
            alignSelf: "center",
        };
    });

    const animatedImageStyle = useAnimatedStyle(() => {
        if (fullImageProgress.value < 1) {
            return {
                width: "100%",
                height: "100%",
                transform: [{ translateX: 0 }, { translateY: 0 }],
            };
        }

        const imgW = dims?.[0] ?? SCREEN_WIDTH;
        const imgH = dims?.[1] ?? SCREEN_WIDTH;

        const imageAspect = imgW / imgH;
        const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;

        let overflowX = 0;
        let overflowY = 0;

        const targetWidth = SCREEN_HEIGHT * imageAspect;
        const targetHeight = SCREEN_WIDTH / imageAspect;
        if (imageAspect > screenAspect) {
            overflowX = targetWidth - SCREEN_WIDTH;
        } else {
            overflowY = targetHeight - SCREEN_HEIGHT;
        }

        const translateX = overflowX
            ? interpolate(
                panProgress.value * panDirection.value,
                [-1, 1],
                [-overflowX / 2, overflowX / 2]
            )
            : 0;

        const translateY = overflowY
            ? interpolate(
                panProgress.value * panDirection.value,
                [-1, 1],
                [-overflowY / 2, overflowY / 2]
            )
            : 0;

        return {
            width: "100%",
            height: "100%",
            transform: [{ translateX }, { translateY }],
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
    const playerStyles = PLAYER_STYLE(useTheme())

    if(!audioState.name){
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
                    pointerEvents={showSegments ? "none" : "auto"}
                >
                    <Animated.View style={[miniStyles.progressTrack, progressPlayerMode]}>
                        <Animated.View
                            style={[
                                miniStyles.progressFill,
                                progressPlayerModeStyle,
                            ]}
                        />
                    </Animated.View>
                    <View pointerEvents={showSegments ? "none" : "auto"}>
                        {/* COVER ART */}
                        {playerMode === 'mini' && (
                            <GestureDetector gesture={tapToExpandGesture}>
                                <View style={miniStyles.miniOverlay} pointerEvents="box-only" />
                            </GestureDetector>
                        )}
                        <Animated.View style={[[], bgStyle]}>
                            <Animated.View style={[playerStyles.coverContainer, artworkStyle]} pointerEvents={showSegments ? "none" : "auto"}>
                                {audioState.coverPath || audioState.mediaPath ? (
                                    <>
                                    <Pressable
                                        onPress={() => {
                                            toggleFullImage();
                                            if(audioState.mediaPath){
                                                setFullImage(prevState => !prevState);
                                            }
                                        }}
                                        onLongPress={() => {
                                            mediaRef.current?.togglePlayback();
                                        }}
                                        style={[playerStyles.coverWrapper]}
                                    >
                                        {audioState.mediaPath &&
                                            <Animated.View style={[
                                                {display: (playerMode === 'full' && !fullImage) ? 'flex': 'none' },
                                                animatedWrapperStyle
                                            ]}>
                                                <Media
                                                    ref={mediaRef}
                                                    uri={audioState.mediaPath}
                                                    isPlaying={isPlaying}
                                                    style={animatedImageStyle}/>
                                            </Animated.View>
                                        }
                                        <Animated.View style={[
                                            { display: (playerMode === 'mini' || !audioState.mediaPath || fullImage) ? 'flex' : 'none' },
                                            animatedWrapperStyle
                                        ]}>
                                            <Animated.Image
                                                source={{uri: audioState.coverPath!}}
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
                                    <Animated.Text style={[playerStyles.trackTitle, trackNameColorPlayerMode ]} numberOfLines={1}>
                                        {audioState.name.replace(/\s*\(Chapter\s+\d+\)\s*$/, '')}
                                    </Animated.Text>
                                    <Animated.Text style={[playerStyles.trackIntro, trackIntroPlayerMode ]} numberOfLines={2}>
                                        {intro}
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
                        <Animated.View style={[playerStyles.subtitlesContainer, scrollHiddenStyle]}>
                            <PlayerScroll
                                displayedCues={subtitleState.cues}
                                currentTimeSV={currentTimeSV}
                                jumpToTime={jumpToTime}
                                togglePlay={togglePlay}
                            />
                        </Animated.View>

                        {/* CONTROLS */}
                        <View style={playerStyles.controlsContainer}>
                            <Controls
                                isPlaying={isPlaying}
                                currentTime={currentTimeSV}
                                duration={duration}
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
                                onOpenChapters={() => setShowSegments(true)}
                                segmentMarkers={subtitleState.markers}
                                hasNext={currentTrackIndex < playlist.length - 1}
                                hasPrevious={currentTrackIndex > 0}
                                registerGesture={onRegisterControlsGesture}
                            />
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>
            <Segments
                changeSegment={changeSegment}
                setShowSegments={setShowSegments}
                duration={duration.value}
                segmentHistory={progressMapRef.current[audioState.name]?.segmentHistory!}
                currentTime={currentTimeSV.value}
                showSegments={showSegments}
                subtitleState={subtitleState}
                trackName={audioState.name}
            />
        </>
    )
});
