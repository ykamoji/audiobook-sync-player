import React, { useState } from "react";
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
    PlusIcon,
    InfoIcon,
} from "./Icons";

import { Track, Playlist, ProgressData } from '../utils/types';

interface TrackRowProps {
    track: Track;
    index: number;
    list: Track[];
    isInsidePlaylist: boolean;
    isSelected: boolean;
    isSelectionMode: boolean;
    progressMap: Record<string, ProgressData>;
    associatedPlaylists: Playlist[];
    activeMenuTrackId: string | null;
    onSelectTrack: (track: Track, index: number, list: Track[]) => void;
    onToggleSelection: (trackId: string) => void;
    onOpenMenu: (trackId: string | null) => void;
    onAddToPlaylist: (track: Track) => void;
    onViewMetadata: (track: Track) => void;
    onRemoveFromPlaylist: (trackName: string) => void;
    style?  : ViewStyle;
}


export const TrackRow: React.FC<TrackRowProps> = ({
                             track,
                             index,
                             list,
                             isInsidePlaylist,
                             isSelected,
                             isSelectionMode,
                             progressMap,
                             associatedPlaylists,
                             activeMenuTrackId,
                             onSelectTrack,
                             onToggleSelection,
                             onOpenMenu,
                             onAddToPlaylist,
                             onViewMetadata,
                             style,
                         }) => {
    const progress = progressMap[track.name];
    const percentage = progress ? Math.min(progress.percentage, 100) : 0;
    const isCompleted = percentage >= 99;

    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => {
        setMenuVisible(true);
        onOpenMenu(track.id);
    };

    const closeMenu = () => {
        setMenuVisible(false);
        onOpenMenu(null);
    };

    const coverSource =
        track.coverFile || track.coverPath
            ? { uri: track.coverFile || track.coverPath }
            : null;

    return (
        <View style={[styles.rowContainer, style]}>
            <TouchableOpacity
                style={[
                    styles.mainRow,
                    isSelected ? styles.selectedRow : null,
                ]}
                onPress={() => {
                    if (isSelectionMode) {
                        onToggleSelection(track.id);
                    } else {
                        onSelectTrack(track, index, list);
                    }
                }}
                activeOpacity={0.7}
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
                            isSelected ? styles.selectedText : null,
                        ]}
                        numberOfLines={1}
                    >
                        {track.name.replace(/\s*\(.*?\)/g, "").trim()}
                    </Text>

                    <View style={styles.metaRow}>
                        {/* Progress Bar */}
                        {!isSelectionMode && percentage > 0 && (
                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        isCompleted ? styles.completedBar : null,
                                        { width: `${percentage}%` },
                                    ]}
                                />
                            </View>
                        )}

                        {/* Progress label OR playlist badges */}
                        <View style={styles.metaDetails}>
                            {isCompleted ? (
                                <Text style={styles.completedLabel}>Completed</Text>
                            ) : percentage > 0 ? (
                                <Text style={styles.mediumText}>{Math.floor(percentage)}%</Text>
                            ) : null}

                            {!isInsidePlaylist && associatedPlaylists.length > 0 && (
                                <View style={styles.badgesRow}>
                                    {associatedPlaylists.map((p) => (
                                        <Text key={p.id} style={styles.playlistBadge}>
                                            {p.name}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Options Button (disabled in selection mode) */}
            {!isSelectionMode && (
                <TouchableOpacity style={styles.menuButton} onPress={openMenu}>
                    <MoreHorizontalIcon size={22} color="#aaa" />
                </TouchableOpacity>
            )}

            {/* Context Menu Modal */}
            <Modal
                visible={menuVisible && activeMenuTrackId === track.id}
                transparent
                animationType="fade"
                onRequestClose={closeMenu}
            >
                <TouchableOpacity style={styles.backdrop} onPress={closeMenu} />

                <View style={styles.menuContainer}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            onAddToPlaylist(track);
                            closeMenu();
                        }}
                    >
                        <PlusIcon size={18} color="#fff" />
                        <Text style={styles.menuText}>Add to Playlist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            onViewMetadata(track);
                            closeMenu();
                        }}
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
        backgroundColor: "#1a1a1a",
        padding: 12,
        borderRadius: 10,
    },

    selectedRow: {
        backgroundColor: "rgba(255,131,0,0.15)",
    },

    thumbnailBox: {
        width: 60,
        height: 60,
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
        fontSize: 16,
        fontWeight: "600",
    },

    selectedText: {
        color: "#FF8300",
    },

    metaRow: {
        marginTop: 6,
    },

    progressBarBackground: {
        height: 4,
        backgroundColor: "#444",
        borderRadius: 2,
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
        fontSize: 12,
    },

    mediumText: {
        color: "#aaa",
        fontSize: 12,
    },

    badgesRow: {
        flexDirection: "row",
        flexWrap: "wrap",
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
        borderRadius: 10,
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
        fontSize: 14,
    },
});
