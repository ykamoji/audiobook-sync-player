import React, {useEffect} from "react";
import Animated, {
    cancelAnimation, useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from "react-native-reanimated";
import {StyleSheet, View} from "react-native";

const Bar = ({ delay, active }: { delay: number, active:boolean }) => {
    const height = useSharedValue(0);
    const isActive = useSharedValue(active ? 1 : 0);

    // Sync JS prop → UI shared value
    useEffect(() => {
        isActive.value = active ? 1 : 0;
    }, [active]);

    // UI-thread reaction (no frame leak possible)
    useAnimatedReaction(
        () => isActive.value,
        (current, previous) => {
            if (current === previous) return;

            if (current === 0) {
                // STOP immediately on UI thread
                cancelAnimation(height);
                height.value = 0
            } else {
                // START animation
                height.value = withDelay(
                    delay,
                    withRepeat(
                        withTiming(25, { duration: 500 }),
                        -1,
                        true
                    )
                );
            }
        }
    );


    const style = useAnimatedStyle(() => ({
        height: height.value,
    }));

    return <Animated.View style={[styles.bar, style]} />;
};

export const PlayingIndicator :React.FC<{visible:boolean}> = ({visible}) => {

    const opacity = useSharedValue(visible ? 1 : 0);
    const scale = useSharedValue(visible ? 1 : 0.95);

    useEffect(() => {
        opacity.value = withTiming(visible ? 1 : 0, {duration: 250});
        scale.value = withTiming(visible ? 1 : 0.95, {duration: 250});
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{scale: scale.value}],
    }));

    return (
        <Animated.View style={[styles.equalizer, containerStyle]}>
            <Bar delay={0} active={visible}/>
            <Bar delay={150} active={visible}/>
            <Bar delay={300} active={visible} />
        </Animated.View>
    )
};

const styles = StyleSheet.create({
    equalizer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
        height: 25,
    },
    bar: {
        width: 2,
        backgroundColor: '#ff8300',
        // borderRadius: 2,
    },
})