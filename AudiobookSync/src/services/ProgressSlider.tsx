import React, {useState, FC, forwardRef, useRef, useImperativeHandle} from 'react';
import {useAnimatedReaction, useSharedValue, SharedValue, runOnJS} from 'react-native-reanimated';
import {StyleSheet, Text, View} from "react-native";
import {ControlSlider} from "./ControlSlider.tsx";
import {ExclusiveGesture} from "react-native-gesture-handler";

type Props = {
    currentTimeSV: SharedValue<number>;
    duration: SharedValue<number>;
    onSeek: (v: number) => void;
    registerGesture:(g:ExclusiveGesture) => void;
};

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

interface CurrentTimeRef {
    setTime: (time: number) => void;
}

interface CurrentTimeProps {
    currentTime:number
}


export const CurrentTime = forwardRef<CurrentTimeRef, CurrentTimeProps>(({currentTime},
                                                                                               ref) => {

    const [time, setTime] = useState<number>(currentTime);

    useImperativeHandle(ref, () => ({
        setTime,
    }));

    return <Text style={styles.timeText}>{formatTime(time)}</Text>
});

export const ProgressSlider: FC<Props> = ({ currentTimeSV, duration, onSeek, registerGesture }) => {
    const progressSV = useSharedValue(0);
    const isSeekingSV = useSharedValue(false);

    const currentTimeRef = useRef<CurrentTimeRef>(null);

    const updateCurrentTime = (time: number) => {
        currentTimeRef.current?.setTime(time);
    };

    useAnimatedReaction(
        () => {
            if (isSeekingSV.value) return progressSV.value;
            if (duration.value === 0) return 0;
            return currentTimeSV.value / duration.value;
        },
        (next) => {
            if (isSeekingSV.value) return;
            progressSV.value = next;
            isSeekingSV.value = false;
        },
        []
    );

    useAnimatedReaction(
        () => currentTimeSV.value,
        (time, prev) => {
            if (time === prev) return;
            runOnJS(updateCurrentTime)(time);
        },
        []
    );

    return (
        <>
         <ControlSlider
             onSeek={onSeek}
             isSeekingSV={isSeekingSV}
             progressSV={progressSV}
             registerGesture={registerGesture}
         />
        <View style={styles.timeRow}>
            <CurrentTime ref={currentTimeRef} currentTime={currentTimeSV.value} />
            <Text style={styles.timeText}>{formatTime(duration.value)}</Text>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop:10,
        marginBottom:-10,
    },

    timeText: {
        color: '#aaa',
        fontSize: 11,
        fontWeight: '500',
    },
})
