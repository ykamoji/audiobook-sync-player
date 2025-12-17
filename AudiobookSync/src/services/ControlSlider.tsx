import React, {FC, useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {
    GestureDetector,
    Gesture, ExclusiveGesture,
} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle, withTiming, useDerivedValue, SharedValue, useAnimatedReaction, runOnJS,
} from 'react-native-reanimated';

const HANDLE_SIZE = 50;
const INNER_HANDLE_SIZE = 15;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TRACK_WIDTH = SCREEN_WIDTH - HANDLE_SIZE
const MAX_VALUE = TRACK_WIDTH - HANDLE_SIZE;


export interface ControlSliderProps {
    registerGesture:(g: ExclusiveGesture) => void,
    progressSV: SharedValue<number>;
    isSeekingSV: SharedValue<boolean>;
    onSeek: (progress: number) => void;
}

export const ControlSlider: FC<ControlSliderProps> = ({registerGesture, progressSV, onSeek, isSeekingSV}) => {

    const offset = useSharedValue(0);
    const isInteracting = useSharedValue(false);

    const progress = useDerivedValue(() => {
        return MAX_VALUE === 0 ? 0 : offset.value / MAX_VALUE;
    });

    useAnimatedReaction(
        () => progressSV.value,
        (next, prev) => {
            if (next === prev) return;
            if (isInteracting.value || isSeekingSV.value) return;

            const clamped = Math.max(0, Math.min(1, next));
            offset.value = clamped * MAX_VALUE;
        },
        []
    );

    const pan = Gesture.Pan()
        .onBegin(() => {
            isInteracting.value = true;
            isSeekingSV.value = true;
        })
        .onChange((event) => {
            const next = offset.value + event.changeX;
            offset.value =
                next < 0 ? 0 :
                    next > MAX_VALUE ? MAX_VALUE :
                        next;
        }).onEnd(() => {
            isInteracting.value = false;
            const progress = MAX_VALUE === 0 ? 0 : offset.value / MAX_VALUE;
            runOnJS(onSeek)(progress * 100);
        });

    const tap = Gesture.Tap()
        .maxDistance(2)
        .onEnd((event) => {
            isInteracting.value = true;
            isSeekingSV.value = true;
            // Clamp to slider bounds
            let newOffset = event.x - HANDLE_SIZE / 2;

            if (newOffset < 0) newOffset = 0;
            if (newOffset > MAX_VALUE) newOffset = MAX_VALUE;

            offset.value = withTiming(newOffset, { duration: 50 }, () => {
                isInteracting.value = false;

                const progress = MAX_VALUE === 0 ? 0 : newOffset / MAX_VALUE;
                runOnJS(onSeek)(progress * 100);
            });
    });

    const filledTrackStyle = useAnimatedStyle(() => {
        const filledWidth = progress.value * TRACK_WIDTH;
        return {
            width: filledWidth,
        };
    });

    const innerThumbStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: progress.value * TRACK_WIDTH
                }
            ]
        };
    });

    const sliderGesture = Gesture.Exclusive(tap, pan);

    useEffect(() => {
        registerGesture?.(sliderGesture);
    }, []);

    return (<>
        <View style={styles.container}>
            <GestureDetector gesture={sliderGesture}>
                <View style={styles.sliderOuterTrack}>
                    <View style={styles.sliderInterTrack}>
                        <Animated.View style={[styles.sliderFilledTrack, filledTrackStyle]} />
                        <Animated.View style={[styles.sliderHandleInner, innerThumbStyle]}/>
                    </View>
                </View>
            </GestureDetector>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 10,
        marginTop: 10,
    },
    sliderOuterTrack: {
        width: TRACK_WIDTH,
        height: 80,
        // backgroundColor: 'gray',
        // borderRadius: 25,
        justifyContent: 'center',

    },
    sliderFilledTrack: {
        position: 'absolute',
        left: 0,
        height: 5,
        backgroundColor: '#F86600',
    },
    sliderInterTrack:{
        width: TRACK_WIDTH,
        height: 5,
        backgroundColor: '#555',
        // borderRadius: 25,
        justifyContent: 'center',
    },
    sliderHandleOuter: {
        width: HANDLE_SIZE,
        height: 80,
        // backgroundColor: 'white',
        position: 'absolute',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sliderHandleInner:{
        width: INNER_HANDLE_SIZE,
        height: INNER_HANDLE_SIZE,
        borderRadius:INNER_HANDLE_SIZE,
        backgroundColor: '#F86600',
        position: 'absolute',
        left: 0
    }
});