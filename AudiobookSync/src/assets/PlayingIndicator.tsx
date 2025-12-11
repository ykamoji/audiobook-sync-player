import React, {useEffect} from "react";
import Animated, {useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming} from "react-native-reanimated";
import {StyleSheet, View} from "react-native";

const Bar = ({ delay }: { delay: number }) => {
    const height = useSharedValue(6);

    useEffect(() => {
        height.value = withDelay(
            delay,
            withRepeat(
                withTiming(15, { duration: 400 }),
                -1,
                true
            )
        );
    }, [delay]);

    const style = useAnimatedStyle(() => ({
        height: height.value,
    }));

    return <Animated.View style={[styles.bar, style]} />;
};

export const PlayingIndicator = () => (
    <View style={styles.equalizer}>
        <Bar delay={0} />
        <Bar delay={150} />
        <Bar delay={300} />
    </View>
);

const styles = StyleSheet.create({
    equalizer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
        height: 22,
    },
    bar: {
        width: 2,
        backgroundColor: '#ff8300',
        // borderRadius: 2,
    },
})