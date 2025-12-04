import React, { useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';

export function useSwipeDown(
    onClose: () => void,
    scrollOffset: { value: number },
    threshold = 120
) {
    const screenHeight = Dimensions.get('window').height;

    // replaces useSharedValue
    const translateY = useRef(new Animated.Value(0)).current;

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            // block upward swipe & block if scrolled
            if (e.translationY < 0) return;
            if (scrollOffset.value > 0) return;

            translateY.setValue(e.translationY);
        })
        .onEnd((e) => {
            const currentY = (translateY as any)._value;

            const shouldClose =
                currentY > threshold || e.velocityY > 800;

            if (shouldClose) {
                Animated.timing(translateY, {
                    toValue: screenHeight,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => onClose());
            } else {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        });

    const GestureView = ({ children }: any) => (
        <GestureDetector gesture={panGesture}>
            {children}
        </GestureDetector>
    );

    return {
        translateY,
        GestureView,
    };
}
