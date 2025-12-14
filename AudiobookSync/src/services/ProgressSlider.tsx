import React, {useState, useCallback} from 'react';
import { Slider } from '@miblanchard/react-native-slider';
import {useAnimatedReaction, runOnJS, useSharedValue, SharedValue} from 'react-native-reanimated';
import {StyleSheet, Text, View} from "react-native";

type Props = {
    currentTimeSV: SharedValue<number>;
    duration: number;
    onSeek: (v: number) => void;
};

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};


export const ProgressSlider: React.FC<Props> = ({ currentTimeSV, duration, onSeek }) => {
    const [sliderValue, setSliderValue] = useState(0);
    const lastSecond = useSharedValue(-1);
    const isSliding = useSharedValue(false);

    // Update slider once per second (Option B)
    useAnimatedReaction(
        () => Math.floor(currentTimeSV.value),
        (sec) => {
            if (isSliding.value) return;
            // console.log(currentTimeSV.value, duration)
            if (sec !== lastSecond.value) {
                lastSecond.value = sec;
                const progress = duration > 0 ? (sec / duration) * 100 : 0;
                runOnJS(setSliderValue)(progress);
            }
        }
    );

    const handleSlidingStart = useCallback(() => {
        isSliding.value = true;
    }, [isSliding.value]);

    const handleSlidingComplete = useCallback(
        (values: number[]) => {
            isSliding.value = false;
            onSeek(values[0]);
        },
        [onSeek, isSliding.value]
    );

    return (
        <>
        <Slider
            value={sliderValue}
            animateTransitions={false}
            minimumValue={0}
            maximumValue={100}
            onSlidingStart={handleSlidingStart}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor="#f97316"
            maximumTrackTintColor="#555"
            thumbTintColor="#F86600"
        />
        <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTimeSV.value)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -6,
    },

    timeText: {
        color: '#aaa',
        fontSize: 11,
        fontWeight: '500',
    },
})
