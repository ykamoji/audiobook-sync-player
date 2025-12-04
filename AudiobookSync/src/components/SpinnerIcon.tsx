import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export const SpinnerIcon = ({
                                size = 24,
                                color = "#ffffff",
                            }: {
    size?: number;
    color?: string;
}) => {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={color}
                    strokeWidth={4}
                    opacity={0.25}
                />
                <Path
                    fill={color}
                    opacity={0.75}
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
            </Svg>
        </Animated.View>
    );
};
