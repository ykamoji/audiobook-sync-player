import React, {FC} from "react";
import {playerStyles} from "../../utils/playerStyles.ts";
import {Text, TouchableOpacity, View} from "react-native";
import {XIcon} from "lucide-react-native";
import {SlideWindow} from "../../services/SlideWindow.tsx";
import {SubtitleFileState} from "../../utils/types.ts";
import {findCueIndex, getSegmentIndex} from "../../utils/mediaLoader.ts";

interface SegmentProps {
    showSegments: boolean;
    setShowSegments: (showSegments: boolean) => void;
    changeSegment: (index: number) => Promise<void>;
    subtitleState:SubtitleFileState;
    trackName:string;
    duration:number;
    currentTime:number;
    segmentHistory: Record<number, number>;
}

const CUES_PER_SEGMENT = 100;

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const Segments:FC<SegmentProps> = ({
                                              showSegments,
                                              setShowSegments,
                                              changeSegment,
                                              subtitleState,
                                              trackName,
                                              duration,
                                              currentTime,
                                              segmentHistory,
                                            }) => {

    let currentSegmentIndex = getSegmentIndex(currentTime, subtitleState.markers)

    const segmentData = Object.entries(segmentHistory).map(([k, v]) => {
        const index = Number(k)

        const segment_duration = index < subtitleState.markers.length ?
            (subtitleState.markers[index] - ( index > 0 ? subtitleState.markers[index-1] : 0)):
            (duration - subtitleState.markers[index-1])

        const segment_progress = v - (index > 0 ? subtitleState.markers[index-1] : 0)

        return {
            progress : (segment_progress / segment_duration),
            text: subtitleState.cues[findCueIndex(subtitleState.cues, v)].text.substring(0, 150).trim() + ' ...'
        }
    });

    return (
        <SlideWindow style={playerStyles.chaptersOverlayRoot}
                     open={showSegments}
                     side={"bottom"}
                     height={"60%"}
                     onClose={() => setShowSegments(false)}>

            <View style={[playerStyles.chaptersSheet, {}]}>
                <View style={playerStyles.chaptersHeader}>
                    <View style={playerStyles.chaptersHeaderLeft}>
                        <Text style={playerStyles.chaptersTitle}>{trackName}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowSegments(false)}
                        style={playerStyles.chaptersCloseButton}
                    >
                        <XIcon size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <View style={[playerStyles.chaptersList, playerStyles.chaptersListContent]}>
                    {Array.from({length: subtitleState.totalSegments}).map((_, i) => {
                        let dynDuration = 0;

                        if (subtitleState.cues.length > 0) {
                            const startIdx = i * CUES_PER_SEGMENT;
                            const endIdx = Math.min(
                                (i + 1) * CUES_PER_SEGMENT - 1,
                                subtitleState.cues.length - 1
                            );

                            if (startIdx < subtitleState.cues.length && endIdx >= startIdx) {
                                dynDuration =
                                    subtitleState.cues[endIdx].end -
                                    subtitleState.cues[startIdx].start;
                            }
                        } else if (duration > 0) {
                            dynDuration = duration;
                        }

                        const isActive = currentSegmentIndex === i;

                        return (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    playerStyles.chapterItem,
                                    isActive && playerStyles.chapterItemActive,
                                ]}
                                onPress={() => {
                                    changeSegment(i).then();
                                    setShowSegments(false);
                                }}
                                activeOpacity={0.2}
                            >
                                <View style={[
                                    {
                                        position:"absolute",
                                        backgroundColor:'rgba(255,131,0,0.2)',
                                        width:300,
                                        height:60,
                                    },
                                    { width: (segmentData[i]  ? segmentData[i].progress : 0) * 380 }
                                ]} />
                                <Text
                                    style={[
                                        playerStyles.chapterIndex,
                                        isActive && playerStyles.chapterIndexActive,
                                    ]}
                                >
                                    1.{i + 1}
                                </Text>
                                <View style={{ width: 300}}>
                                    <Text style={{color:'#aaa', paddingStart:5}}>
                                        {segmentData[i] ? segmentData[i].text :
                                            subtitleState.cues[i*CUES_PER_SEGMENT].text }
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        playerStyles.chapterDuration,
                                        isActive && playerStyles.chapterDurationActive,
                                    ]}
                                >
                                    {formatTime(dynDuration)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </SlideWindow>
    );
};