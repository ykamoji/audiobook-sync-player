import React, {useState, useMemo, useCallback, useRef, useEffect} from "react";
import {
    View,
    Text,
    Image,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ViewStyle
} from "react-native";

import {
    MusicIcon,
    MoreHorizontalIcon,
    CheckCircleIcon,
    CircleIcon,
    InfoIcon, PencilIcon, TrashIcon,
} from "lucide-react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Track, Playlist, ProgressData } from "../utils/types";

import {usePlayerContext} from "../services/PlayerContext.tsx";
import {PlayingIndicator} from "../services/PlayingIndicator.tsx";
import {runOnJS} from "react-native-reanimated";

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
    onEditToPlaylist: (track: Track, callback:() => void) => void;
    onViewMetadata: (name: string) => void;
    style?: ViewStyle;
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
                                                   onEditToPlaylist,
                                                   onViewMetadata,
                                                   style,
                                               }) => {
    const [menuVisible, setMenuVisible] = useState(false);

    const rowRef = useRef<View>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 20 });


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
            setMenuPos({
                top: y + height / 2,
                right: 20
            });
            setMenuVisible(true);
        });
    }, []);

    const closeMenu = useCallback(() => setMenuVisible(false), []);

    const handleEdit = useCallback(() => {
        onEditToPlaylist(track, () => {
            closeMenu();
        });
    }, [onEditToPlaylist, track, closeMenu]);

    const handleMetadata = useCallback(() => {
        onViewMetadata(track.name);
        closeMenu();
    }, [onViewMetadata, closeMenu, track.name]);


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
                activeOpacity={0.5}
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
                        <MusicIcon size={28} color="#ccc" />
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
                    { showLive ?
                        <View style={styles.live}>
                            <PlayingIndicator />
                        </View>
                        :
                        (!isSelectionMode && percentage > 0 && (
                            <View style={styles.metaRow}>
                                <View style={styles.progressBarBackground}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            isCompleted && styles.completedBar,
                                            {width: `${percentage}%`},
                                        ]}/>
                                </View><View style={styles.metaDetails}>
                                {isCompleted ? (
                                    <Text style={styles.completedLabel}>Completed</Text>
                                ) : percentage > 0 ? (
                                    <Text style={styles.mediumText}>
                                        {Math.floor(percentage)}%
                                    </Text>
                                ) : (
                                    // 👇 placeholder to keep layout identical
                                    <Text style={[styles.mediumText, {opacity: 0}]}>
                                        100%
                                    </Text>
                                )}
                                {playlistBadges}
                            </View>
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
                    <MoreHorizontalIcon size={22} color="#aaa" />
                </TouchableOpacity>
            )}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={closeMenu}
            >
                <TouchableOpacity style={styles.backdrop} onPress={closeMenu} />
                <View style={[styles.menuContainer, { top: menuPos.top, right: menuPos.right }]} >
                    <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                        {isInsidePlaylist ? <TrashIcon size={18} color={"#fff"} /> : <PencilIcon size={18} color="#fff" />}
                        <Text style={styles.menuText}>{ isInsidePlaylist ? 'Remove' : "Edit Playlist"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleMetadata}
                    >
                        <InfoIcon size={18} color="#fff" />
                        <Text style={styles.menuText}>View Metadata</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};


const styles = StyleSheet.create({
    rowContainer: {
        width: "100%",
        paddingVertical: 4,
    },

    mainRow: {
        flexDirection: "row",
        alignItems: "center",
        // backgroundColor: "#1a1a1a",
        padding: 12,
        borderRadius: 10,
    },

    selectedRow: {
        backgroundColor: "rgba(255,131,0,0.15)",
    },

    thumbnailBox: {
        width: 65,
        height: 65,
        borderRadius: 6,
        backgroundColor: "#333",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginRight: 12,
    },

    thumbnail: {
        width: "100%",
        height: "100%",
    },

    infoBox: {
        flex: 1,
    },

    trackTitle: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },

    selectedText: {
        color: "#FF8300",
    },

    metaRow: {
        marginTop: 6,
    },

    progressBarBackground: {
        height: 1,
        backgroundColor: "#444",
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
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    completedLabel: {
        color: "#4CAF50",
        fontWeight: "600",
        fontSize: 16,
    },

    mediumText: {
        color: "#aaa",
        fontSize: 10,
    },

    badgesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        position: "relative",
        marginTop: 10,
        maxWidth: "60%",
    },

    playlistBadge: {
        color: "#FF8300",
        opacity: 0.6,
        fontSize: 10,
        marginLeft: 6,
    },

    menuButton: {
        padding: 10,
        position: "absolute",
        right: 4,
        top: "35%",
    },

    backdrop: {
        flex: 1,
    },

    menuContainer: {
        position: "absolute",
        right: 20,
        top: 120,
        backgroundColor: "#2a2a2a",
        borderRadius: 0,
        paddingVertical: 6,
        width: 200,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },

    menuText: {
        color: "white",
        marginLeft: 10,
        fontSize: 16,
    },
    live:{
        marginTop: 10,
    }
});
