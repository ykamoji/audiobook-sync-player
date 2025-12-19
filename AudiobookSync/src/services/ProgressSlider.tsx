import React, {useState, FC, forwardRef, useRef, useImperativeHandle} from 'react';
import {useAnimatedReaction, useSharedValue, SharedValue, runOnJS, runOnUI, withDelay} from 'react-native-reanimated';
import {StyleSheet, Text, View} from "react-native";
import {ControlSlider} from "./ControlSlider.tsx";
import {ExclusiveGesture} from "react-native-gesture-handler";

type Props = {
    currentTimeSV: SharedValue<number>;
    duration: SharedValue<number>;
    onSeek: (v: number) => Promise<void>;
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

    return <Text style={[styles.textTime, styles.leftTime]}>{formatTime(time)}</Text>
});

const SEEK_EPSILON = 0.15;

export const ProgressSlider: FC<Props> = ({
                                              currentTimeSV,
                                              duration,
                                              onSeek,
                                              registerGesture,
                                          }) => {
    const progressSV = useSharedValue(0);
    const isScrubbingSV = useSharedValue(false);
    const lastScrubbedProgressSV = useSharedValue<number | null>(null);

    const currentTimeRef = useRef<CurrentTimeRef>(null);

    const updateCurrentTime = (time: number) => {
        currentTimeRef.current?.setTime(time);
    };

    useAnimatedReaction(
        () => {
            if (duration.value === 0) return 0;
            if (isScrubbingSV.value) {
                return progressSV.value;
            }

            if (lastScrubbedProgressSV.value !== null &&
                Math.abs(currentTimeSV.value - lastScrubbedProgressSV.value * duration.value) > SEEK_EPSILON){
                    return lastScrubbedProgressSV.value;
            }

            return currentTimeSV.value / duration.value;
        },
        (next) => {
            if (isScrubbingSV.value) {
                lastScrubbedProgressSV.value = next;
            }
            if (lastScrubbedProgressSV.value !== null
                && Math.abs(currentTimeSV.value - lastScrubbedProgressSV.value * duration.value) <= SEEK_EPSILON) {
                lastScrubbedProgressSV.value = null;
            }

            progressSV.value = next;
        },
        []
    );

    useAnimatedReaction(
        () => {

            if (isScrubbingSV.value) {
                return progressSV.value * duration.value;
            }

            if(lastScrubbedProgressSV.value !== null) {
                return lastScrubbedProgressSV.value * duration.value;
            }
            return currentTimeSV.value
        },
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
             isScrubbingSV={isScrubbingSV}
             progressSV={progressSV}
             registerGesture={registerGesture}
         />
        <View style={styles.timeRow}>
            <CurrentTime ref={currentTimeRef} currentTime={currentTimeSV.value} />
            <Text style={[styles.textTime, styles.rightTime]}>{formatTime(duration.value)}</Text>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    timeRow: {
        flex:1,
    },
    textTime:{
        position: 'absolute',
        height: 10,
        top: 5,
        color: '#aaa',
        fontSize: 11,
        fontWeight: '500',
    },
    leftTime:{
        left: 0,
    },
    rightTime: {
        right: 0,
    },
})
