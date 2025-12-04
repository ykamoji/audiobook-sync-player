import React, { FC, ReactNode, useEffect, useMemo } from "react";
import {
    StyleSheet,
    ViewStyle,
    useWindowDimensions,
    TouchableWithoutFeedback,
    Animated,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type Side = "bottom" | "right" | "left" | "auto";

interface SlideWindowProps {
    open: boolean;
    onClose: () => void;
    side?: Side;
    width?: number | string;
    height?: number | string;
    children: ReactNode;
    style?: ViewStyle;
    showBackdrop?: boolean;
    closeOnBackdropPress?: boolean;
}

const DEFAULT_FRACTION = 0.4;
const BACKDROP_MAX_OPACITY = 0.6;
const CLOSE_VELOCITY_THRESHOLD = 800;
const PULL_TO_CLOSE_FRACTION = 0.25;

// Converts width/height like "40%", "300", "50vh"
const resolveSize = (
    raw: number | string | undefined,
    axisLength: number,
    fallbackFraction = DEFAULT_FRACTION
): number => {
    if (typeof raw === "number") return raw;

    if (typeof raw === "string") {
        const m = raw.match(/^(\d+(\.\d+)?)(.*)$/);
        if (m) {
            const value = parseFloat(m[1]);
            const unit = (m[3] || "").toLowerCase();

            if (
                unit.includes("%") ||
                unit.includes("vh") ||
                unit.includes("vw") ||
                unit.includes("dvh") ||
                unit.includes("dvw")
            ) {
                return (axisLength * value) / 100;
            }

            return value;
        }
    }

    return axisLength * fallbackFraction;
};

export const SlideWindow: FC<SlideWindowProps> = ({
                                                      open,
                                                      onClose,
                                                      side = "bottom",
                                                      width,
                                                      height,
                                                      children,
                                                      style,
                                                      showBackdrop = true,
                                                      closeOnBackdropPress = true,
                                                  }) => {
    const { width: screenW, height: screenH } = useWindowDimensions();

    const orientation = screenW < screenH ? "portrait" : "landscape";

    const resolvedSide: Exclude<Side, "auto"> = useMemo(() => {
        if (side === "auto") {
            return orientation === "portrait" ? "left" : "bottom";
        }
        return side as Exclude<Side, "auto">;
    }, [side, orientation]);

    // Sheet size depending on direction
    const sheetSize = useMemo(() => {
        return resolvedSide === "bottom"
            ? resolveSize(height, screenH)
            : resolveSize(width, screenW);
    }, [resolvedSide, width, height, screenW, screenH]);

    // Animated values replacing sharedValue
    const offset = React.useRef(new Animated.Value(open ? 0 : sheetSize)).current;
    const backdropOpacity = React.useRef(new Animated.Value(open ? BACKDROP_MAX_OPACITY : 0))
        .current;

    // Animate open/close
    useEffect(() => {
        if (open) {
            Animated.spring(offset, {
                toValue: 0,
                useNativeDriver: true,
            }).start();

            Animated.timing(backdropOpacity, {
                toValue: BACKDROP_MAX_OPACITY,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(offset, {
                toValue: sheetSize,
                duration: 220,
                useNativeDriver: true,
            }).start();

            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }).start();
        }
    }, [open, sheetSize]);

    // Gesture Handler version of pan
    const pan = Gesture.Pan()
        .onUpdate((e) => {
            let drag = 0;

            if (resolvedSide === "bottom") {
                if (e.translationY < 0) return;
                drag = e.translationY;
            } else if (resolvedSide === "right") {
                if (e.translationX < 0) return;
                drag = e.translationX;
            } else {
                if (e.translationX > 0) return;
                drag = Math.abs(e.translationX);
            }

            drag = Math.min(Math.max(0, drag), sheetSize);
            offset.setValue(drag);

            const op = drag / sheetSize;
            backdropOpacity.setValue(BACKDROP_MAX_OPACITY * (1 - op));
        })
        .onEnd((e) => {
            const dragged = (offset as any)._value;
            const pulledEnough = dragged > sheetSize * PULL_TO_CLOSE_FRACTION;

            let flick = false;
            if (resolvedSide === "bottom") flick = e.velocityY > CLOSE_VELOCITY_THRESHOLD;
            else if (resolvedSide === "right") flick = e.velocityX > CLOSE_VELOCITY_THRESHOLD;
            else flick = e.velocityX < -CLOSE_VELOCITY_THRESHOLD;

            const shouldClose = flick || pulledEnough;

            if (shouldClose) {
                Animated.timing(offset, {
                    toValue: sheetSize,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => onClose());

                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            } else {
                Animated.spring(offset, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();

                Animated.timing(backdropOpacity, {
                    toValue: BACKDROP_MAX_OPACITY,
                    duration: 180,
                    useNativeDriver: true,
                }).start();
            }
        });

    // Animated Sheet Style
    const sheetAnimatedStyle = {
        transform:
            resolvedSide === "bottom"
                ? [{ translateY: offset }]
                : resolvedSide === "right"
                    ? [{ translateX: offset }]
                    : [{ translateX: Animated.multiply(offset, -1) }],
    };

    // Animated Backdrop Style
    const backdropAnimatedStyle = {
        opacity: backdropOpacity,
    };

    // Positioning for different sides
    const placementStyle: ViewStyle =
        resolvedSide === "bottom"
            ? { left: 0, right: 0, bottom: 0, height: sheetSize, width: "100%" }
            : resolvedSide === "right"
                ? { top: 0, bottom: 0, right: 0, width: sheetSize, height: "100%" }
                : { top: 0, bottom: 0, left: 0, width: sheetSize, height: "100%" };

    return (
        <>
            {/* Backdrop */}
            {showBackdrop && (
                <TouchableWithoutFeedback
                    onPress={() => {
                        if (!closeOnBackdropPress) return;

                        Animated.timing(offset, {
                            toValue: sheetSize,
                            duration: 200,
                            useNativeDriver: true,
                        }).start(() => onClose());

                        Animated.timing(backdropOpacity, {
                            toValue: 0,
                            duration: 180,
                            useNativeDriver: true,
                        }).start();
                    }}
                >
                    <Animated.View
                        pointerEvents={open ? "auto" : "none"}
                        style={[styles.backdrop, backdropAnimatedStyle]}
                    />
                </TouchableWithoutFeedback>
            )}

            {/* Sliding Sheet */}
            <GestureDetector gesture={pan}>
                <Animated.View
                    pointerEvents={open ? "auto" : "none"}
                    style={[
                        styles.container,
                        placementStyle,
                        sheetAnimatedStyle,
                        style as any,
                    ]}
                >
                    {children}
                </Animated.View>
            </GestureDetector>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 90,
    },
    container: {
        position: "absolute",
        backgroundColor: "#1a1a1a",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.06)",
        zIndex: 100,
        overflow: "hidden",
    },
});
