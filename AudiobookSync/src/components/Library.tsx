import React, {useState, useMemo, useCallback, useEffect} from 'react';
import { FlashList } from '@shopify/flash-list';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
} from 'react-native';

import { Track, Playlist, ProgressData } from '../utils/types';
import {
    SaveIcon,
    RepeatIcon,
} from './Icons';
import { SpinnerIcon } from './SpinnerIcon.tsx';
import { TrackRow } from './TrackRow';

interface LibraryProps {
    allTracks: Track[];
    playlists: Playlist[];
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    progressMap: Record<string, ProgressData>;
    handleAlbumActions: (track: Track[]) => void;
    setShowModal: (showModal: boolean) => void;
    onExportData: () => void;
    exportSuccess: boolean;
    onViewMetadata: (track: Track) => void;
}

const ROW_HEIGHT = 88;

export const Library: React.FC<LibraryProps> = ({
                                                    allTracks,
                                                    playlists,
                                                    onSelectTrack,
                                                    progressMap,
                                                    handleAlbumActions,
                                                    setShowModal,
                                                    onExportData,
                                                    exportSuccess,
                                                    onViewMetadata,
                                                }) => {



    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

    const handleSelectAll = () => {
        if (selectedTrackIds.size === allTracks.length) {
            setSelectedTrackIds(new Set()); // unselect all
        } else {
            const allIds = allTracks.map((t) => t.id);
            setSelectedTrackIds(new Set(allIds)); // select all
        }
    };

    const toggleSelection = (trackId: string) => {
        setSelectedTrackIds((prev) => {
            const copy = new Set(prev);
            if (copy.has(trackId)) copy.delete(trackId);
            else copy.add(trackId);
            return copy;
        });
    };

    useEffect(() => {
        if(!isSelectionMode){
            setSelectedTrackIds(new Set());
        }
    }, [isSelectionMode]);

    // ----- Renderers -----
    const renderTrackItem = useCallback(
        ({ item, index }: { item: Track; index: number }) => (
            <TrackRow
                track={item}
                index={index}
                list={allTracks}
                isInsidePlaylist={false}
                isSelected={selectedTrackIds.has(item.id)}
                isSelectionMode={isSelectionMode}
                progressMap={progressMap}
                associatedPlaylists={playlists.filter((p) => p.trackNames.includes(item.name))}
                onSelectTrack={onSelectTrack}
                onToggleSelection={toggleSelection}
                onAddToPlaylist={(track: Track) => {
                    setShowModal(true);
                    handleAlbumActions([track])
                }}
                onLongPress={() => setIsSelectionMode(prev => !prev)}
                onViewMetadata={onViewMetadata}
                style={{ height: ROW_HEIGHT }}
            />
        ),
        [selectedTrackIds,
            isSelectionMode,
            progressMap,
            playlists,
            onSelectTrack,
            onViewMetadata,
            handleAlbumActions,
            setShowModal,
            allTracks]
    );


    // ----- Main render -----

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => {
                        setIsSelectionMode((prev) => !prev)}
                    }>
                        <Text style={styles.selectToggleText}>
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </Text>
                    </TouchableOpacity>
                    {isSelectionMode && (
                        <TouchableOpacity onPress={handleSelectAll}>
                            <Text style={styles.selectAllText}>
                                {selectedTrackIds.size === allTracks.length ? 'Unselect All' : 'Select All'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        onPress={onExportData}
                        activeOpacity={0.8}
                        style={styles.saveButton}
                    >
                        {exportSuccess ? (
                            <SpinnerIcon size={20} color="#22c55e" />
                        ) : (
                            <SaveIcon size={20} color="#9ca3af" />
                        )}
                        <Text
                            style={[
                                styles.saveText,
                                exportSuccess ? styles.saveTextSuccess : undefined,
                            ]}
                        >
                            Save Data
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Content */}
            <View style={styles.content}>
                <View style={styles.emptyFull}>
                    {allTracks.length === 0 ?
                        <Text style={styles.emptyText}>None</Text> :
                        <FlashList
                            data={allTracks}
                            estimatedItemSize={ROW_HEIGHT}
                            keyExtractor={(item) => item.id}
                            renderItem={renderTrackItem}
                            extraData={{
                                isSelectionMode,
                                selectedTrackIds
                            }}
                            contentContainerStyle={styles.listContent}
                        />
                    }
                </View>
            </View>
            {/* Bulk Action */}
            <View style={[
                styles.bulkBar,
                selectedTrackIds.size === 0 && styles.bulkHidden
            ]}>
                <Text style={styles.bulkText}>{selectedTrackIds.size} selected</Text>
                <TouchableOpacity
                    onPress={() => {
                        const selected = allTracks.filter((t) => selectedTrackIds.has(t.id));
                        setShowModal(true);
                        // setIsSelectionMode((prev) => !prev);
                        // setSelectedTrackIds(new Set());
                        handleAlbumActions(selected);
                    }}
                    style={styles.bulkAddButton}
                >
                    <Text style={styles.bulkAddText}>Edit Playlist</Text>
                </TouchableOpacity>
            </View>
        </View>

    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#050505',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#050505',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    } as any,
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    } as any,
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
    saveText: {
        fontSize: 13,
        color: '#9ca3af',
    },
    saveTextSuccess: {
        color: '#22c55e',
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 80,
        paddingHorizontal: 12,
    },
    detailContainer: {
        flex: 1,
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
    iconButton: {
        padding: 6,
    },
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
    bulkHidden:{
        opacity: 0,
        pointerEvents: "none",
        position: "absolute",
    }
});
