import {ComponentRef, FC, memo, MutableRefObject, useRef} from "react";
import Animated, {SharedValue, useAnimatedStyle, withTiming} from "react-native-reanimated";
import {playerStyles} from "../../utils/playerStyles.ts";
import {SubtitleCue} from "../../utils/types.ts";
import {Pencil} from "lucide-react-native";

export interface CueProps {
    cue: SubtitleCue;
    onUpdate: (id: number, text:string) => void;
    index: number;
    currentCueIndexSV: SharedValue<number>;
    jumpToTime: (time: number) => void;
}


export const Cue: FC<CueProps> = ({
                                     cue,
                                     index,
                                     currentCueIndexSV,
                                     jumpToTime,
                                     onUpdate,
                                 }) => {



        const animatedTextStyle =  useAnimatedStyle(() => {
            const isActive = index === currentCueIndexSV.value;
            return {
                color: withTiming(isActive ? '#f97316' : '#9ca3af', { duration: 50 }),
                fontFamily: isActive ? 'CabinCondensed-Semibold' : 'CabinCondensed-Medium',
                marginLeft: withTiming(isActive ? 5 : 0, { duration: 50})
            };
        });


    const animatedPencilStyle = useAnimatedStyle(()=> {
            return {
                opacity: cue.isEdited ? 1 : 0,
            }
        })

    const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
    const didLongPress = useRef(false);

    return (
            <Animated.View
                style={playerStyles.cueContainer}
                onTouchStart={() => {
                    didLongPress.current = false;

                    longPressTimeout.current = setTimeout(() => {
                        didLongPress.current = true;
                        onUpdate(cue.id, cue.text)
                    }, 400);
                }}
                onTouchEnd={() => {
                    clearTimeout(longPressTimeout.current!);
                    // Only treat as tap if long-press did NOT happen
                    if (!didLongPress.current) {
                        jumpToTime(cue.start);
                    }
                }}
                onTouchMove={() => {
                    clearTimeout(longPressTimeout.current!);
                }}
                onTouchCancel={() => {
                    clearTimeout(longPressTimeout.current!);
                }}
            >
                <Animated.Text style={[playerStyles.cueText, animatedTextStyle]}>
                    {cue.text}
                </Animated.Text>
                <Animated.View style={[playerStyles.edited, animatedPencilStyle]}>
                    <Pencil size={"8"} stroke={"orange"}/>
                </Animated.View>
            </Animated.View>
    );
};
