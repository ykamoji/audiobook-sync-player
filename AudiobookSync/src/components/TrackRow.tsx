import React, {useMemo, useCallback, useRef} from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ViewStyle
} from "react-native";

import {
    MusicIcon,
    MoreHorizontalIcon,
    CheckCircleIcon,
    CircleIcon,
} from "lucide-react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Track, Playlist, ProgressData } from "../utils/types";
import {PlayingIndicator} from "../services/PlayingIndicator.tsx";
import {runOnJS} from "react-native-reanimated";
import {useStaticData} from "../hooks/useStaticData.ts";
import {useTheme} from "../utils/themes.ts";

interface TrackRowProps {
    track: Track;
    index: number;
    list: Track[];
    isInsidePlaylist: boolean;
    isSelected: boolean;
    isSelectionMode: boolean;
    progressMap: Record<string, ProgressData>;
    showLive: boolean;
    associatedPlaylists: Playlist[];
    onSelectTrack: (track: Track, index: number, list: Track[], option?:number) => void;
    onToggleSelection: (trackId: string) => void;
    onLongPress: () => void;
    style?: ViewStyle;
    onOpenMenu: (
        track: Track,
        isInsidePlaylist: boolean,
        position: { top: number; right: number }
    ) => void;
}



export const TrackRow: React.FC<TrackRowProps> = ({
                                                   track,
                                                   index,
                                                   list,
                                                   isInsidePlaylist,
                                                   isSelected,
                                                   isSelectionMode,
                                                   progressMap,
                                                   showLive,
                                                   associatedPlaylists,
                                                   onSelectTrack,
                                                   onToggleSelection,
                                                   onLongPress,
                                                   style,
                                                   onOpenMenu
                                               }) => {


    const styles = STYLES(useTheme())


    const rowRef = useRef<View>(null);


    const displayName = useMemo(
        () => track.name.replace(/\s*\(.*?\)/g, "").trim(),
        [track.name]
    );

    const progress = progressMap[track.name];
    const percentage = progress ? Math.min(progress.percentage, 100) : 0;
    const isCompleted = percentage >= 99;

    const coverSource = useMemo(() => {
        const uri = track.coverFile || track.coverPath;
        return uri ? { uri } : null;
    }, [track.coverFile, track.coverPath]);

    const playlistBadges = useMemo(() => {
        if (isInsidePlaylist || associatedPlaylists.length === 0) return null;

        return (
            <View style={styles.badgesRow}>
                {associatedPlaylists.map((p) => (
                    <Text key={p.id} style={styles.playlistBadge}>
                        {p.name}
                    </Text>
                ))}
            </View>
        );
    }, [isInsidePlaylist, associatedPlaylists]);


    const handlePress = useCallback((option:number) => {
        if (isSelectionMode) {
            onToggleSelection(track.id);
        } else {
            onSelectTrack(track, index, list, option);
        }
    }, [isSelectionMode, onToggleSelection, onSelectTrack, track, index, list]);

    const openMenu = useCallback(() => {
        if (!rowRef.current) return;

        rowRef.current.measureInWindow((x, y, width, height) => {
            onOpenMenu(track, isInsidePlaylist, {
                top: y + height / 2,
                right: 20,
            });
        });
    }, [track, isInsidePlaylist, onOpenMenu]);


    const singleTap = Gesture.Tap()
        .numberOfTaps(1)
        .onEnd((_e, success) => {
            if(success) runOnJS(handlePress)(1)
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((_e, success) => {
            if(success) runOnJS(handlePress)(2)
        });

    const { getTrackStaticData } = useStaticData()

    const { intro } = getTrackStaticData(track.name)

    return (
        <View ref={rowRef} style={[styles.rowContainer, style]}>
            <GestureDetector gesture={Gesture.Exclusive(doubleTap, singleTap)}>
            <TouchableOpacity
                style={[styles.mainRow, isSelected && styles.selectedRow]}
                // onPress={()=> handlePress(1)}
                onLongPress={() => {
                    onLongPress();
                    onToggleSelection(track.id);
                }}
                activeOpacity={0.8}
            >
                {/* Thumbnail / Checkbox */}
                <View style={styles.thumbnailBox}>
                    {isSelectionMode ? (
                        isSelected ? (
                            <CheckCircleIcon size={32} color="#FF8300" />
                        ) : (
                            <CircleIcon size={32} color="#888" />
                        )
                    ) : coverSource ? (
                        <Image
                            source={coverSource}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <MusicIcon size={28} color={styles.thumbnailMusic.color} />
                    )}
                </View>

                {/* Title + Progress */}
                <View style={styles.infoBox}>
                    <Text
                        style={[
                            styles.trackTitle,
                            isSelected && styles.selectedText,
                        ]}
                        numberOfLines={1}
                    >
                        {displayName}
                    </Text>
                    <Text style={[
                        styles.trackIntro,
                        isSelected && styles.selectedText,
                    ]}
                          numberOfLines={1}>
                        {intro}
                    </Text>
                    <View style={styles.live}>
                        <PlayingIndicator visible={showLive}/>
                    </View>
                    {(!isSelectionMode &&(
                    <View style={styles.metaRow}>
                        <View style={[styles.progressBarBackground, {
                            opacity: progress?.percentage > 0 ? 1 : 0,
                        }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    isCompleted && styles.completedBar,
                                    {
                                        opacity: progress?.percentage > 0 ? 1 : 0,
                                        width: `${percentage}%`
                                    },
                                ]}/>
                        </View>
                        <View style={styles.metaDetails}>
                            <Text style={[styles.mediumText,
                                {   paddingLeft: 5,
                                    opacity: progress?.percentage > 0 ? 1 : 0
                                }
                            ]}>
                                {Math.ceil(percentage)}%
                            </Text>
                        </View>
                        {playlistBadges}
                    </View>
                    ))}
                </View>
            </TouchableOpacity>
            </GestureDetector>

            {!isSelectionMode && (
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={openMenu}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MoreHorizontalIcon size={22} color={styles.moreIcon.color} />
                </TouchableOpacity>
            )}
        </View>
    );
};


const STYLES = (theme:any) => StyleSheet.create({
    rowContainer: {
        width: "100%",
        paddingVertical: 4,
    },

    mainRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 12,
        borderRadius: 10,
    },

    selectedRow: {
        backgroundColor: theme.selectedRow,
    },

    thumbnailBox: {
        width: 65,
        height: 65,
        borderRadius: 6,
        backgroundColor: theme.thumbnailBoxColor,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginRight: 12,
    },

    thumbnail: {
        width: "100%",
        height: "100%",
    },

    thumbnailMusic: {
        color: theme.thumbnailMusic
    },

    infoBox: {
        flex: 1,
    },

    trackTitle: {
        color: theme.trackTitle,
        fontSize: 14,
        fontWeight: "600",
    },

    trackIntro:{
      color: theme.trackIntro,
      marginTop:5,
      fontSize: 10,
    },

    selectedText: {
        color: theme.selectedText,
    },

    metaRow: {
        // backgroundColor: "white",
        flexDirection: "row",
        alignItems: "flex-end",
        // marginTop: 0,
    },

    progressBarBackground: {
        height: 1,
        backgroundColor: theme.progressBarBackground,
        width: "80%",
        overflow: "hidden",
    },

    progressBarFill: {
        height: "100%",
        backgroundColor: "#FF8300",
    },

    completedBar: {
        backgroundColor: "#4CAF50",
    },

    metaDetails: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    completedLabel: {
        fontWeight: "600",
        fontSize: 10,
    },

    mediumText: {
        color: theme.trackIntro,
        fontSize: 10,
    },

    badgesRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap:2,
        top:12,
        left:-7,
        position: "absolute",
    },

    moreIcon:{
        color: theme.libraryMoreColor,
    },

    playlistBadge: {
        color: "#FF8300",
        opacity: theme.playlistBadgeOpacity,
        fontSize: 10,
        marginLeft: 6,
        fontWeight: theme.playlistBadgeWeight,
    },

    menuButton: {
        padding: 10,
        position: "absolute",
        right: 4,
        top: "35%",
    },

    live:{
        position: "absolute",
        bottom: 40,
    }
});
