import Video from 'react-native-video';
import {FC, forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import {StyleProp, ViewStyle} from "react-native";
import Animated, {useAnimatedProps, useSharedValue} from "react-native-reanimated";


export interface MediaHandle {
    togglePlayback: () => void;
}

export interface MediaProps {
    uri: string;
    isPlaying: boolean;
    style?: StyleProp<ViewStyle>;
}

const PAUSE_AFTER_END = 10000;

const AnimatedVideo = Animated.createAnimatedComponent(Video);

export const Media = forwardRef<MediaHandle, MediaProps>(({uri, isPlaying, style}, ref) => {

    const paused = useSharedValue(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            paused.value = !paused.value;
        },
    }));

    useEffect(() => {
        if (!isPlaying) {
            paused.value = true;

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            return;
        }

        if (!didEndRef.current) {
            videoRef.current?.seek(lastPositionRef.current);
        }

        paused.value = false;
    }, [isPlaying]);

    const handleEnd = () => {
        didEndRef.current = true;
        paused.value = true;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (!isPlaying) return;

            // restart from beginning ONLY after end
            videoRef.current?.seek(0);
            lastPositionRef.current = 0;
            didEndRef.current = false;

            paused.value = false;
        }, PAUSE_AFTER_END);
    };

    return (
            <AnimatedVideo
                ref={videoRef}
                source={{ uri }}
                style={[style,]}
                muted={true}
                volume={0.0}
                resizeMode="cover"
                repeat={false}
                onEnd={handleEnd}
                onProgress={handleProgress}
                animatedProps={animatedProps}
                // paused={!paused.value}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
            />
    );
});

