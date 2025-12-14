import Animated, {
    runOnJS,
    SharedValue, useAnimatedReaction, useAnimatedScrollHandler,
    useAnimatedStyle, useSharedValue,
    withTiming
} from "react-native-reanimated";
import {Text, View} from "react-native";
import {FC, MutableRefObject, ComponentRef, useRef} from "react";
import {playerStyles} from "../utils/playerStyles.ts";
import {findCueIndex} from "../utils/mediaLoader.ts";
import {SubtitleCue} from "../utils/types.ts";

export interface PlayerScrollProps {
    displayedCues: SubtitleCue[];
    currentTimeSV:SharedValue<number>;
    jumpToTime: (time: number) => void;
    showChapters: boolean;
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
                                currentTimeSV,
                                jumpToTime,
                                showChapters,
                            }) => {

    const isUserScrolling = useSharedValue(false);
    const cueRefs = useRef<Record<string, View | null>>({});
    const scrollRef = useRef<Animated.ScrollView | null>(null);
    const currentCueIndexSV = useSharedValue(findCueIndex(displayedCues, currentTimeSV.value))

    const scrollToActiveCue = (animated = true) => {
        if (!scrollRef.current || !displayedCues.length) return;

        if (currentCueIndexSV.value < 0) return;

        const cue = displayedCues[currentCueIndexSV.value];
        const ref = cueRefs.current[cue.id];
        if (!ref) return;

        ref.measureLayout(
            scrollRef.current.getInnerViewNode(),
            (x, y, w, h) => {
                const targetY = Math.max(0, y - 150);
                scrollRef.current?.scrollTo({ y: targetY, animated: animated });
            },
            () => {}
        );
    };


    const onTimeUpdate = (time:number) => {
        // NOW we may compute cue index (React JS thread)
        currentCueIndexSV.value = findCueIndex(displayedCues, time);

        requestAnimationFrame(() => {
            scrollToActiveCue(true);
        });
    };

    useAnimatedReaction(
        () => currentTimeSV.value,
        (value, prev) => {
            // console.log('currentTimeSV', value, prev);
            if(isUserScrolling.value) return;
            if (prev === value) return;
            runOnJS(onTimeUpdate)(value);
        }
    );


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

