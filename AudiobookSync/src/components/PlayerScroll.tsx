import Animated, {
    SharedValue, useAnimatedScrollHandler,
    useAnimatedStyle,
    withTiming
} from "react-native-reanimated";
import {ScrollView, Text, View} from "react-native";
import {FC, RefObject, MutableRefObject, ComponentRef} from "react";
import {playerStyles} from "../utils/playerStyles.ts";

export interface PlayerScrollProps {
    displayedCues: Array<{
        id: string;
        start: number;
        text: string;
    }>;
    isUserScrolling:SharedValue<boolean>;
    currentCueIndexSV: SharedValue<number>;
    jumpToTime: (time: number) => void;
    cueRefs: MutableRefObject<
        Record<string, ComponentRef<typeof Animated.View> | null>
    >;
    showChapters: boolean;
    scrollRef: RefObject<Animated.ScrollView>;
}

export interface CueRowProps {
    cue: {
        id: string;
        start: number;
        text: string;
    };

    index: number;
    currentCueIndexSV: SharedValue<number>;
    jumpToTime: (time: number) => void;
    cueRefs: MutableRefObject<
        Record<string, ComponentRef<typeof Animated.View> | null>
    >;
}
const CueRow: FC<CueRowProps> = ({
                    cue,
                    index,
                    currentCueIndexSV,
                    jumpToTime,
                    cueRefs
                }) => {

    const animatedTextStyle = useAnimatedStyle(() => {
        const isActive = index === currentCueIndexSV.value;
        return {
            color: withTiming(isActive ? '#f97316' : '#9ca3af', { duration: 10 }),
            fontFamily: isActive ? 'CabinCondensed-Semibold' : 'CabinCondensed-Medium',
        };
    });

    return (
        <Animated.View
            ref={(ref) => { cueRefs.current[cue.id] = ref }}
            style={playerStyles.cueContainer}
        >
            <Animated.Text
                onPress={() => jumpToTime(cue.start)}
                style={[playerStyles.cueText, animatedTextStyle]}
            >
                {cue.text}
            </Animated.Text>
        </Animated.View>
    );
};


export const PlayerScroll: FC<PlayerScrollProps> = ({
                                displayedCues,
                                currentCueIndexSV,
                                jumpToTime,
                                cueRefs,
                                showChapters,
                                scrollRef,
                                isUserScrolling
                            }) => {


    const scrollHandler = useAnimatedScrollHandler({
        onBeginDrag: () => {
            isUserScrolling.value = true
        },
        onEndDrag: () => {
            isUserScrolling.value = false
        },
        onMomentumEnd: () => {
            isUserScrolling.value = false
        },
    });


    return (
        <Animated.ScrollView
            ref={scrollRef}
            style={playerStyles.subtitlesScroll}
            onScroll={scrollHandler}
            pointerEvents={showChapters ? 'none' : 'auto'}
            contentContainerStyle={playerStyles.subtitlesContent}
            scrollEventThrottle={16}
        >
            {displayedCues.map((cue, index) => (
                <CueRow
                    key={cue.id}
                    cue={cue}
                    index={index}
                    currentCueIndexSV={currentCueIndexSV}
                    jumpToTime={jumpToTime}
                    cueRefs={cueRefs}
                />
            ))}

            {displayedCues.length === 0 && (
                <View style={playerStyles.noTextContainer}>
                    <Text style={playerStyles.noText}>
                        No text content for this section.
                    </Text>
                </View>
            )}
        </Animated.ScrollView>
    );
};

