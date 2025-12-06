import React, {FC, useCallback, useEffect, useState} from "react";
import {Playlist, ProgressData, Track} from "../utils/types.ts";
import {ActionSheetIOS, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {ChevronLeftIcon, PencilIcon} from "./Icons.tsx";
import {TrackRow} from "./TrackRow.tsx";
import {FlashList} from "@shopify/flash-list";
import {TrashIcon} from "./Icons.tsx";

interface AlbumContentProps {
    playlistTracks?: Track[];
    selectedPlaylist?: Playlist;
    onBack?: () => void;
    playlistNameChange: () => void;
    onViewMetadata: (track: Track) => void;
    progressMap: Record<string, ProgressData>;
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    onRemoveTrack: (track: Track, callback:()=>void) => void;
    handleBulkRemove: (tracksNames: string[]) => void;
    handlePlaylistDelete: () => void;
}

const ROW_HEIGHT = 88;

export const AlbumContent: FC<AlbumContentProps> = ({
                                                        playlistTracks,
                                                        onBack,
                                                        progressMap,
                                                        playlistNameChange,
                                                        onSelectTrack,
                                                        onViewMetadata,
                                                        onRemoveTrack,
                                                        handleBulkRemove,
                                                        handlePlaylistDelete,
                                                        selectedPlaylist
                                                    }) => {


    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

    const handleSelectAll = () => {
        if (selectedTrackIds.size === playlistTracks?.length) {
            setSelectedTrackIds(new Set()); // unselect all
        } else {
            const allIds = playlistTracks?.map((t) => t.id);
            setSelectedTrackIds(new Set(allIds)); // select all
        }
    };

    const toggleSelection = (trackId: string) => {
        setSelectedTrackIds((prev) => {
            const copy = new Set(prev);
            if (copy.has(trackId)) copy.delete(trackId);
            else copy.add(trackId);

            if(copy.size === 0){
                setIsSelectionMode(false)
            }
            return copy;
        });
    };

    useEffect(() => {
        if (!isSelectionMode) {
            setSelectedTrackIds(new Set());
        }
    }, [isSelectionMode]);


    const handleBulkAction = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['', 'Clear playlist', 'Cancel'],
                cancelButtonIndex: 0,
                destructiveButtonIndex: 1,
                userInterfaceStyle: 'dark',
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                    const selectedTrackNames = playlistTracks?.filter((t) => selectedTrackIds.has(t.id)).map(t => t.name)!;
                    handleBulkRemove(selectedTrackNames);
                    setSelectedTrackIds(new Set());
                    setIsSelectionMode(prev => !prev);
                }
            }
        );
    };


    const renderTrackItem = useCallback(
        ({item, index}: { item: Track; index: number }) => (
            <TrackRow
                track={item}
                index={index}
                list={playlistTracks!}
                isInsidePlaylist={true}
                isSelected={selectedTrackIds.has(item.id)}
                isSelectionMode={isSelectionMode}
                progressMap={progressMap}
                associatedPlaylists={[]}
                onSelectTrack={onSelectTrack}
                onToggleSelection={toggleSelection}
                onLongPress={() => setIsSelectionMode(prev => !prev)}
                onViewMetadata={onViewMetadata}
                onEditToPlaylist={onRemoveTrack}
                style={{height: ROW_HEIGHT}}
            />
        ),
        [
            selectedTrackIds,
            isSelectionMode,
            progressMap,
            onSelectTrack,
            onViewMetadata,
            playlistTracks,
            onRemoveTrack]
    );

    return (
        <>
            <View style={styles.detailContainer}>
                <View style={styles.detailHeader}>
                    <View style={styles.detailTitleRow}>
                        <TouchableOpacity
                            onPress={onBack}
                            style={styles.iconButton}
                        >
                            <ChevronLeftIcon size={20} color="#ffffff"/>
                        </TouchableOpacity>
                        <Text
                            style={styles.detailTitle}
                            numberOfLines={1}
                        >
                            {selectedPlaylist?.name}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                playlistNameChange();
                            }}
                            style={styles.iconButton}
                        >
                            <PencilIcon size={18} color="#9ca3af"/>
                        </TouchableOpacity>
                    </View>


                    <View style={styles.detailRightRow}>
                        {selectedTrackIds.size > 0 && isSelectionMode && (
                                <TouchableOpacity onPress={handleSelectAll}>
                                    <Text style={styles.selectAllText}>
                                        {selectedTrackIds.size === playlistTracks?.length ? 'Unselect All' : 'Select All'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        {selectedTrackIds.size > 0 && (
                            <TouchableOpacity
                                onPress={() => setIsSelectionMode((prev) => !prev)}
                            >
                                <Text style={styles.selectToggleText}>
                                    {isSelectionMode ? 'Cancel' : 'Select'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    <TouchableOpacity
                        onPress={handlePlaylistDelete}
                        style={styles.iconButton}
                    >
                        <TrashIcon size={18} color="#9ca3af"/>
                    </TouchableOpacity>
                    </View>
                </View>

                {playlistTracks?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>This playlist is empty.</Text>
                    </View>
                ) : (
                    <FlashList
                        data={playlistTracks}
                        estimatedItemSize={ROW_HEIGHT}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTrackItem}
                        extraData={{
                            isSelectionMode,
                            selectedTrackIds
                        }}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
            <View style={[
                styles.bulkBar,
                selectedTrackIds.size === 0 && styles.bulkHidden
            ]}>
                <Text style={styles.bulkText}>{selectedTrackIds.size} selected</Text>
                <TouchableOpacity
                    onPress={() => handleBulkAction}
                    style={styles.bulkRemoveButton}
                >
                    <Text style={styles.bulkRemoveText}>Remove from Playlist</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    detailContainer: {
        flex: 1,
    },
    iconButton: {
        padding: 6,
    },
    detailHeader: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 1,
    } as any,
    detailTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        maxWidth: 220,
    },
    detailRightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    } as any,
    selectText: {
        fontSize: 13,
        color: '#f97316',
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
    emptyFull: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    listContent: {
        paddingBottom: 80,
        paddingHorizontal: 12,
    },
    selectAllText: {
        fontSize: 13,
        color: '#9ca3af',
    },
    selectToggleText: {
        fontSize: 13,
        color: '#f97316',
        fontWeight: '600',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    } as any,
    bulkBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#1f2933',
        borderTopWidth: 1,
        borderTopColor: 'rgba(148,163,184,0.4)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bulkText: {
        color: '#ffffff',
        fontWeight: '500',
    },
    bulkRemoveButton: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(248,113,113,0.12)',
    },
    bulkRemoveText: {
        color: '#f87171',
        fontWeight: '600',
        fontSize: 13,
    },
    bulkAddButton: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#f97316',
    },
    bulkAddText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 13,
    },
    bulkHidden: {
        opacity: 0,
        pointerEvents: "none",
        position: "absolute",
    }
})