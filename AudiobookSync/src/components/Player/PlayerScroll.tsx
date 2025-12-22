import {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    useSharedValue,
} from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import {Keyboard, Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import {FC, useRef, useState} from "react";
import {playerStyles} from "../../utils/playerStyles.ts";
import {findCueIndex} from "../../utils/mediaLoader.ts";
import {SubtitleCue} from "../../utils/types.ts";
import {Cue} from "./Cue.tsx";
import {removeSubtitleEdit, saveSubtitleEdit} from "../../utils/subtitleEdits.ts";
import {MODEL_STYLES} from "../../utils/modelStyles.ts";
import {Pressable} from "react-native-gesture-handler";
import {usePlayerContext} from "../../context/PlayerContext.tsx";
import {Toggle} from "../../services/Toggle.tsx";
import { TextInput as PaperInput } from "react-native-paper"
import {useTheme} from "../../utils/themes.ts";

export interface PlayerScrollProps {
    displayedCues: SubtitleCue[];
    currentTimeSV:SharedValue<number>;
    jumpToTime: (time: number) => void;
    togglePlay: (override?:boolean) => void;
}

export const PlayerScroll: FC<PlayerScrollProps> = ({
                                displayedCues,
                                currentTimeSV,
                                jumpToTime,
                                togglePlay
                            }) => {

    const isUserScrolling = useSharedValue(false);;
    const listRef = useRef<FlashList<SubtitleCue>>(null);
    const currentCueIndexSV = useSharedValue(findCueIndex(displayedCues, currentTimeSV.value))
    const previousPlayingRef = useRef(false);

    const scrollToActiveCue = (animated = true) => {
        if (!displayedCues.length) return;

        const index = currentCueIndexSV.value;
        if (index < 0) return;

        listRef.current?.scrollToIndex({
            index,
            animated,
            viewPosition: 0.6,
        });
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
            if(isUserScrolling.value) return;
            if (prev === value) return;
            runOnJS(onTimeUpdate)(value);
        }
    );

    const { state, dispatch } = usePlayerContext()

    const [showModal, setShowModal] = useState<boolean>(false);

    const cueIdRef = useRef<number>(-1);
    const cueTextRef = useRef<string>("");
    const cueEditedRef = useRef<boolean>(false);


    const onCueUpdate = async (cueId: number, text:string) => {
        cueIdRef.current = cueId;
        cueTextRef.current = text.trim();
        cueEditedRef.current = displayedCues.find(dc => dc.id == cueId)?.isEdited ?? false
        if(state.isPlaying){
            previousPlayingRef.current = true;
            togglePlay(false);
        }
        setShowModal(true);
    };

    const updateCueHandler = async () => {

        if(cueEditedRef.current) {
            await saveSubtitleEdit(state.audioState.name, cueIdRef.current, cueTextRef.current);
        }
        else {
            await removeSubtitleEdit(state.audioState.name, cueIdRef.current);
        }

        dispatch({
            type: "UPDATE_CUE",
            cueId: cueIdRef.current,
            text: cueTextRef.current,
            isPlaying: previousPlayingRef.current,
            isEdited:cueEditedRef.current,
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

    const dismissKeyboard = () => {
        TextInput.State.currentlyFocusedInput()?.blur();
        Keyboard.dismiss();
    };

    const modelStyles = MODEL_STYLES(useTheme())

    return (
        <>
            <FlashList
                ref={listRef}
                data={displayedCues}
                keyExtractor={(item) => String(item.id)}
                estimatedItemSize={48}
                onScrollBeginDrag={() => {
                    isUserScrolling.value = true;
                }}
                onMomentumScrollEnd={() => {
                    isUserScrolling.value = false;
                }}
                onScrollEndDrag={() => {
                    isUserScrolling.value = false;
                }}
                renderItem={({ item, index }) => (
                    <Cue
                        cue={item}
                        index={index}
                        currentCueIndexSV={currentCueIndexSV}
                        jumpToTime={jumpToTime}
                        onUpdate={onCueUpdate}
                    />
                )}
                ListEmptyComponent={
                    <View style={playerStyles.noTextContainer}>
                        <Text style={playerStyles.noText}>
                            No text content for this section.
                        </Text>
                    </View>
                }
            />
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
                    <PaperInput
                        label="Cue"
                        defaultValue={cueTextRef.current}
                        multiline
                        dense
                        activeOutlineColor={"#ff8300"}
                        placeholder="Playlist Name"
                        // placeholderTextColor="#888"
                        onChangeText={(val) => cueTextRef.current = val}
                        style={[modelStyles.input, { height: 120, }]}
                    />
                    <Toggle
                        label={""}
                        defaultValue={cueEditedRef.current}
                        onChange={(checked)=>{
                            dismissKeyboard()
                            cueEditedRef.current = checked;
                        }}
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

