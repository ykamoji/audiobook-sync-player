import {Check} from 'lucide-react-native';
import {Pressable, Text, StyleSheet} from 'react-native';
import {FC, useEffect, useState} from 'react';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";

interface toggleProps {
    label:string,
    defaultValue?:boolean,
    onChange:(value:boolean) => void,
}

export const Toggle:FC<toggleProps> = ({
                                           label,
                                           defaultValue,
                                           onChange,}) => {


    const [checked, setChecked] = useState(defaultValue);
    const progress = useSharedValue(defaultValue ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(checked ? 1 : 0, { duration: 180 });
    }, [checked]);

    const checkStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            {
                scale: interpolate(progress.value, [0, 1], [0.6, 1]),
            },
        ],
    }));

    const toggle = () => {
        setChecked(v => {
            const next = !v;
            onChange?.(next);
            return next;
        });
    };

    return (
        <Pressable onPress={toggle} style={styles.container}>
            <Animated.View style={styles.box}>
                <Animated.View style={checkStyle}>
                    <Check size={18} color="#ff8300" strokeWidth={3}  />
                </Animated.View>
            </Animated.View>
            {label && <Text style={styles.label}>{label}</Text>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "flex-end",
        paddingHorizontal: 5,
        paddingVertical: 10,
    },
    box: {
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,131,0,0.5)',
    },
    label: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '400',
    },
});
