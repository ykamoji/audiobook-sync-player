import React, { FC, ReactNode, useMemo } from "react";
import {
    StyleSheet,
    ViewStyle,
    useWindowDimensions, TouchableWithoutFeedback,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    Easing,
} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

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

// Parse width/height like: "40%", "30vh", 300
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
        return side;
    }, [side]);

    // Determine sliding dimension
    const sheetSize = useMemo(
        () =>
            resolvedSide === "bottom"
                ? resolveSize(height, screenH)
                : resolveSize(width, screenW),
        [resolvedSide, width, height, screenW, screenH]
    );

    // Reanimated Shared Values
    const offset = useSharedValue(open ? 0 : sheetSize);
    const backdropOpacity = useSharedValue(open ? BACKDROP_MAX_OPACITY : 0);

    // Animate on open/close
    React.useEffect(() => {
        if (open) {
            offset.value = withSpring(0, {
                damping: 16,
                stiffness: 38,
                mass: 1.25,
                overshootClamping: false,
            });

            backdropOpacity.value = withSpring(BACKDROP_MAX_OPACITY, {
                damping: 25,
                stiffness: 120,
            });

        } else {
            offset.value = withSpring(sheetSize, {
                damping: 20,
                stiffness: 90,
                mass: 1.0,
            });

            backdropOpacity.value = withTiming(0, {
                duration: 220,
            });
        }
    }, [open, sheetSize]);

    // Gesture Handling
    const pan = Gesture.Pan()
        .onUpdate((e) => {
            if (Math.abs(e.translationY) < 2) return;
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

            drag = Math.min(sheetSize, Math.max(0, drag));
            offset.value = drag;

            const t = drag / sheetSize;
            const eased = Easing.out(Easing.cubic)(1 - t);
            backdropOpacity.value = BACKDROP_MAX_OPACITY * eased;
        })
        .onEnd((e) => {
            const dragged = offset.value;
            const pulledEnough = dragged > sheetSize * PULL_TO_CLOSE_FRACTION;

            let flick = false;
            if (resolvedSide === "bottom") flick = e.velocityY > CLOSE_VELOCITY_THRESHOLD;
            else if (resolvedSide === "right") flick = e.velocityX > CLOSE_VELOCITY_THRESHOLD;
            else flick = e.velocityX < -CLOSE_VELOCITY_THRESHOLD;

            const shouldClose = flick || pulledEnough;

            if (shouldClose) {
                offset.value = withSpring(
                    sheetSize,
                    { stiffness: 120, damping: 22, mass: 1 },
                    () => runOnJS(onClose)()
                );
                backdropOpacity.value = withTiming(0, { duration: 150 });
            } else {
                offset.value = withSpring(0, {
                    stiffness: 140,
                    damping: 18,
                });
                backdropOpacity.value = withTiming(BACKDROP_MAX_OPACITY, { duration: 180 });
            }
        });

    // Animated Styles
    const sheetStyle = useAnimatedStyle(() => {
        let translateX = 0;
        let translateY = 0;

        if (resolvedSide === "bottom") translateY = offset.value;
        else if (resolvedSide === "right") translateX = offset.value;
        else translateX = -offset.value;

        return { transform: [{ translateX }, { translateY }] };
    });

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    // Position container based on direction
    const placementStyle: ViewStyle =
        resolvedSide === "bottom"
            ? { left: 0, right: 0, bottom: 0, height: sheetSize }
            : resolvedSide === "right"
                ? { top: 0, bottom: 0, right: 0, width: sheetSize }
                : { top: 0, bottom: 0, left: 0, width: sheetSize };

    return (
        <>
            {/* Backdrop */}
            {showBackdrop && (
                <TouchableWithoutFeedback
                    onPress={() => {
                        if (!closeOnBackdropPress) return;
                        offset.value = withTiming(sheetSize, { duration: 200 }, () =>
                            runOnJS(onClose)()
                        );
                        backdropOpacity.value = withTiming(0, { duration: 150 });
                    }}
                >
                    <Animated.View
                        pointerEvents={open ? "auto" : "none"}
                        style={[styles.backdrop, backdropStyle]}
                    />
                </TouchableWithoutFeedback>
            )}

            {/* Sheet */}
            <GestureDetector gesture={pan}>
                <Animated.View
                    pointerEvents={open ? "auto" : "none"}
                    style={[styles.container, placementStyle, sheetStyle, style]}
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
        zIndex: 100,
    },
    container: {
        position: "absolute",
        backgroundColor: "#1a1a1a",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderColor: "rgba(255,255,255,0.06)",
        borderLeftWidth: StyleSheet.hairlineWidth,
        zIndex: 100,
        overflow: "hidden",
    },
});