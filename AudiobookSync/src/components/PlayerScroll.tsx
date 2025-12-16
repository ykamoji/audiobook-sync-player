import Animated, {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    useAnimatedScrollHandler,
    useSharedValue,
} from "react-native-reanimated";
import { Switch } from 'react-native-paper';
import {Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import {FC, useCallback, useRef, useState} from "react";
import {playerStyles} from "../utils/playerStyles.ts";
import {findCueIndex} from "../utils/mediaLoader.ts";
import {SubtitleCue} from "../utils/types.ts";
import {Cue} from "./Cue.tsx";
import {removeSubtitleEdit, saveSubtitleEdit} from "../utils/subtitleEdits.ts";
import {modelStyles} from "../utils/modelStyles.ts";
import {Pressable} from "react-native-gesture-handler";
import {usePlayerContext} from "../services/PlayerContext.tsx";

export interface PlayerScrollProps {
    displayedCues: SubtitleCue[];
    currentTimeSV:SharedValue<number>;
    jumpToTime: (time: number) => void;
    showChapters: boolean;
    togglePlay: (override?:boolean) => void;
}

export const PlayerScroll: FC<PlayerScrollProps> = ({
                                displayedCues,
                                currentTimeSV,
                                jumpToTime,
                                showChapters,
                                togglePlay
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

    const { state, dispatch } = usePlayerContext()

    const [showModal, setShowModal] = useState<boolean>(false);
    const cueIdRef = useRef<number>(-1);
    const cueTextRef = useRef<string>("");
    const previousPlayingRef = useRef(false);


    const onCueUpdate = useCallback(async (cueId: number, text:string) => {
        cueIdRef.current = cueId;
        cueTextRef.current = text.trim();
        if(state.isPlaying){
            previousPlayingRef.current = true;
            togglePlay(false);
        }
        setShowModal(true);
    },[state.isPlaying, togglePlay])

    const updateCueHandler = async () => {

        await saveSubtitleEdit(state.audioState.name, cueIdRef.current, cueTextRef.current);

        dispatch({
            type: "UPDATE_CUE",
            cueId: cueIdRef.current,
            text: cueTextRef.current,
            isPlaying: previousPlayingRef.current,
            isEdited:true,
        });

        if (previousPlayingRef.current) {
            togglePlay(true);
        }

        // Clean up
        previousPlayingRef.current = false
        setShowModal(false);
        setTimeout(()=> {
            cueIdRef.current = -1;
            cueTextRef.current = "";
        }, 100)

    }

    const removeCueHandler = async () => {

        await removeSubtitleEdit(state.audioState.name, cueIdRef.current);

        dispatch({
            type: "UPDATE_CUE",
            cueId: cueIdRef.current,
            text: cueTextRef.current,
            isPlaying: state.isPlaying,
            isEdited:false,
        });

        if (previousPlayingRef.current) {
            togglePlay(true);
        }

        // Clean up
        previousPlayingRef.current = false
        setShowModal(false);
        setTimeout(()=> {
            cueIdRef.current = -1;
            cueTextRef.current = "";
        }, 100)

    }




    return (
        <>
        <Animated.ScrollView
            ref={scrollRef}
            style={playerStyles.subtitlesScroll}
            onScroll={scrollHandler}
            pointerEvents={showChapters ? 'none' : 'auto'}
            contentContainerStyle={playerStyles.subtitlesContent}
            scrollEventThrottle={16}
        >
            {displayedCues.map((cue, index) => (
                <Cue
                    key={cue.id}
                    cue={cue}
                    index={index}
                    currentCueIndexSV={currentCueIndexSV}
                    jumpToTime={jumpToTime}
                    onUpdate={onCueUpdate}
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
        <Modal visible={showModal} transparent animationType="fade">
            <View style={modelStyles.wrapper}>
                <Pressable style={modelStyles.backdropWrapper}
                           onPress={() => {
                               if(previousPlayingRef.current){
                                   togglePlay(true);
                               }
                               previousPlayingRef.current = false
                               setShowModal(false);
                               setTimeout(()=> {
                                   cueIdRef.current = -1;
                                   cueTextRef.current = "";
                               }, 100)
                           }}/>
                <View style={modelStyles.modalContainer}>
                    <View style={modelStyles.headerRow}>
                        <Text style={modelStyles.headerText}>Edit Cue #{cueIdRef.current}</Text>
                        <TouchableOpacity onPress={() => {
                            if(previousPlayingRef.current){
                                togglePlay(true);
                            }
                            previousPlayingRef.current = false
                            setShowModal(false)
                            setTimeout(()=> {
                                cueIdRef.current = -1;
                                cueTextRef.current = "";
                            }, 100)
                        }
                        }>
                            <Text style={modelStyles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        defaultValue={cueTextRef.current}
                        multiline
                        placeholder="Playlist Name"
                        placeholderTextColor="#888"
                        onChangeText={(val) => cueTextRef.current = val}
                        style={[modelStyles.input, { height: 120, }]}
                    />

                    <View style={modelStyles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowModal(false)
                                if(previousPlayingRef.current){
                                    togglePlay(true);
                                }
                                previousPlayingRef.current = false
                                setTimeout(()=> {
                                    cueIdRef.current = -1;
                                    cueTextRef.current = "";
                                }, 100)
                            }}
                            style={[modelStyles.secondaryButton, { marginTop: 10, paddingVertical: 12 }]}>
                            <Text style={[modelStyles.secondaryButtonText, { paddingTop:1}]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={updateCueHandler}
                            style={[
                                modelStyles.primaryButton,
                                { flex: 1 },
                            ]}>
                            <Text style={modelStyles.primaryButtonText}>Update</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
        </>
    );
};

