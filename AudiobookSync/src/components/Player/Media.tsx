import Video from 'react-native-video';
import {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import {StyleProp, ViewStyle} from "react-native";
import Animated, {
    cancelAnimation,
    runOnJS,
    useAnimatedProps, useAnimatedReaction,
    useSharedValue,
    withDelay,
    withTiming
} from "react-native-reanimated";


export interface MediaHandle {
    togglePlayback: () => void;
}

export interface MediaProps {
    uri: string;
    isPlaying: boolean;
    style?: StyleProp<ViewStyle>;
}

const PAUSE_AFTER_END = 5000;

const AnimatedVideo = Animated.createAnimatedComponent(Video);

export const Media = forwardRef<MediaHandle, MediaProps>(({uri, isPlaying, style}, ref) => {

    const paused = useSharedValue(true);
    const restartTrigger = useSharedValue(0);

    // @ts-ignore
    const videoRef = useRef<Video>(null);
    const lastPositionRef = useRef(0);
    const didEndRef = useRef(false);

    const handleProgress = (data: { currentTime: number }) => {
        lastPositionRef.current = data.currentTime;
    };

    const animatedProps = useAnimatedProps(() => ({
        paused: paused.value,
    }));

    useImperativeHandle(ref, () => ({
        togglePlayback() {
            paused.value = !paused.value;
        },
    }));

    useEffect(() => {
        if (!isPlaying) {
            paused.value = true;
            cancelAnimation(restartTrigger);
            return;
        }

        if (didEndRef.current) {
            didEndRef.current = false;
            videoRef.current?.seek(lastPositionRef.current);
        } else {
            videoRef.current?.seek(lastPositionRef.current);
        }

        paused.value = false;
    }, [isPlaying]);

    const restartFromBeginning = () => {
        if (!isPlaying) return;

        videoRef.current?.seek(0);
        lastPositionRef.current = 0;
        didEndRef.current = false;
        paused.value = false;
    };

    useAnimatedReaction(
        () => restartTrigger.value,
        (value) => {
            if (value === 1) {
                restartTrigger.value = 0;
                runOnJS(restartFromBeginning)();
            }
        }
    );

    const handleEnd = () => {
        didEndRef.current = true;
        paused.value = true;

        restartTrigger.value = withDelay(
            PAUSE_AFTER_END,
            withTiming(1, { duration: 0 })
        );
    };

    return (
            <AnimatedVideo
                ref={videoRef}
                source={{ uri }}
                style={[style,]}
                muted={true}
                volume={0.0}
                resizeMode="cover"
                repeat
                onEnd={handleEnd}
                onProgress={handleProgress}
                animatedProps={animatedProps}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
            />
    );
});

