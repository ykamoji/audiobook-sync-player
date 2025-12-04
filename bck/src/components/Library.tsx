import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    ActionSheetIOS,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Track, Playlist, ProgressData } from '../utils/types';
import {
    ChevronLeftIcon,
    PlusIcon,
    TrashIcon,
    SaveIcon,
    RepeatIcon,
    MoreHorizontalIcon,
    PencilIcon,
} from './Icons';
import { SpinnerIcon } from './SpinnerIcon.tsx';
import { PlaylistCard } from './PlaylistCard';
import { TrackRow } from './TrackRow';
import { LibraryModals } from './LibraryModels.tsx';

interface LibraryProps {
    allTracks: Track[];
    playlists: Playlist[];
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    activeTab: string;
    progressMap: Record<string, ProgressData>;
    onCreatePlaylist: (name: string, initialTracks: Track[]) => void;
    onAddToPlaylist: (playlistId: string, track: Track) => void;
    onAddMultipleToPlaylist: (playlistId: string, tracks: Track[]) => void;
    onDeletePlaylist: (id: string) => void;
    onUpdatePlaylistName: (id: string, newName: string) => void;
    onRemoveFromPlaylist: (playlistId: string, trackName: string) => void;
    onRemoveMultipleFromPlaylist: (playlistId: string, trackNames: string[]) => void;
    onExportData: () => void;
    exportSuccess: boolean;
    isAutoPlay: boolean;
    onToggleAutoPlay: () => void;
    onViewMetadata: (track: Track) => void;
}

const ROW_HEIGHT = 88;

export const Library: React.FC<LibraryProps> = ({
                                                    allTracks,
                                                    playlists,
                                                    onSelectTrack,
                                                    activeTab,
                                                    progressMap,
                                                    onCreatePlaylist,
                                                    onAddToPlaylist,
                                                    onAddMultipleToPlaylist,
                                                    onDeletePlaylist,
                                                    onUpdatePlaylistName,
                                                    onRemoveFromPlaylist,
                                                    onRemoveMultipleFromPlaylist,
                                                    onExportData,
                                                    exportSuccess,
                                                    isAutoPlay,
                                                    onToggleAutoPlay,
                                                    onViewMetadata,
                                                }) => {
    const { width: screenWidth } = useWindowDimensions();

    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

    const [showAddModal, setShowAddModal] = useState(false);
    const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
    const [showRenamePlaylistModal, setShowRenamePlaylistModal] = useState(false);

    const [tracksToAdd, setTracksToAdd] = useState<Track[]>([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [createPlaylistName, setCreatePlaylistName] = useState('');
    const [renamePlaylistName, setRenamePlaylistName] = useState('');

    const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

    // swipe-back for playlist detail (Animated instead of Reanimated)
    const detailTranslateX = React.useRef(new Animated.Value(0)).current;

    // reset selection on tab change / playlist exit
    React.useEffect(() => {
        if (activeTab === 'titles' && selectedPlaylistId !== null) {
            setSelectedPlaylistId(null);
        }
        setIsSelectionMode(false);
        setSelectedTrackIds(new Set());
    }, [activeTab, selectedPlaylistId]);

    // ----- Derived state -----

    const currentListTracks = useMemo(() => {
        if (selectedPlaylistId) {
            const playlist = playlists.find((p) => p.id === selectedPlaylistId);
            if (!playlist) return [];
            return playlist.trackNames
                .map((name) => allTracks.find((t) => t.name === name))
                .filter((t): t is Track => t !== undefined);
        }
        if (activeTab === 'titles') {
            return allTracks;
        }
        return [];
    }, [selectedPlaylistId, activeTab, playlists, allTracks]);

    const isAllSelected = useMemo(() => {
        if (currentListTracks.length === 0) return false;
        return currentListTracks.every((t) => selectedTrackIds.has(t.id));
    }, [currentListTracks, selectedTrackIds]);

    // ----- Selection -----

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedTrackIds(new Set());
        } else {
            const allIds = currentListTracks.map((t) => t.id);
            setSelectedTrackIds(new Set(allIds));
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

    const handleBulkRemove = () => {
        if (!selectedPlaylistId || selectedTrackIds.size === 0) return;
        const playlist = playlists.find((p) => p.id === selectedPlaylistId);
        if (!playlist) return;

        const tracksToRemove: string[] = [];
        allTracks.forEach((t) => {
            if (selectedTrackIds.has(t.id)) {
                tracksToRemove.push(t.name);
            }
        });

        onRemoveMultipleFromPlaylist(selectedPlaylistId, tracksToRemove);
        setIsSelectionMode(false);
        setSelectedTrackIds(new Set());
    };

    // ----- Playlist / Modals logic -----

    const handleOpenAddModal = (tracks: Track[]) => {
        setTracksToAdd(tracks);
        setNewPlaylistName('');
        setShowAddModal(true);
        setActiveMenuTrackId(null);
    };

    const handleCreatePlaylist = () => {
        if (!newPlaylistName.trim() || tracksToAdd.length === 0) return;
        onCreatePlaylist(newPlaylistName.trim(), tracksToAdd);
        setShowAddModal(false);
        setIsSelectionMode(false);
        setSelectedTrackIds(new Set());
    };

    const handleCreateEmptyPlaylist = () => {
        if (!createPlaylistName.trim()) return;
        onCreatePlaylist(createPlaylistName.trim(), []);
        setCreatePlaylistName('');
        setShowCreatePlaylistModal(false);
    };

    const handleRenamePlaylist = () => {
        if (!selectedPlaylistId || !renamePlaylistName.trim()) return;
        onUpdatePlaylistName(selectedPlaylistId, renamePlaylistName.trim());
        setRenamePlaylistName('');
        setShowRenamePlaylistModal(false);
    };

    const handleAddToExisting = (playlistId: string) => {
        if (tracksToAdd.length === 0) return;

        if (tracksToAdd.length === 1) {
            onAddToPlaylist(playlistId, tracksToAdd[0]);
        } else {
            onAddMultipleToPlaylist(playlistId, tracksToAdd);
        }

        setShowAddModal(false);
        setIsSelectionMode(false);
        setSelectedTrackIds(new Set());
    };

    const handlePlaylistMoreOptions = (playlist: Playlist) => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Cancel', 'Rename Playlist', 'Delete Playlist'],
                cancelButtonIndex: 0,
                destructiveButtonIndex: 2,
                userInterfaceStyle: 'dark',
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                    setRenamePlaylistName(playlist.name);
                    setShowRenamePlaylistModal(true);
                } else if (buttonIndex === 2) {
                    Alert.alert(
                        'Delete Playlist',
                        'Are you sure you want to delete this playlist?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => {
                                    onDeletePlaylist(playlist.id);
                                    setSelectedPlaylistId(null);
                                },
                            },
                        ]
                    );
                }
            }
        );
    };

    // ----- Swipe-back for playlist detail (gesture-handler + Animated) -----

    const detailAnimatedStyle = {
        transform: [{ translateX: detailTranslateX }],
    };

    const detailPan = Gesture.Pan()
        .onUpdate((e) => {
            if (e.translationX > 0) {
                detailTranslateX.setValue(e.translationX);
            }
        })
        .onEnd((e) => {
            const shouldGoBack =
                e.translationX > 80 || e.velocityX > 800;

            if (shouldGoBack) {
                Animated.spring(detailTranslateX, {
                    toValue: screenWidth,
                    useNativeDriver: true,
                }).start(() => {
                    setSelectedPlaylistId(null);
                    detailTranslateX.setValue(0);
                });
            } else {
                Animated.spring(detailTranslateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        });

    // ----- Renderers -----

    const renderTrackItem = useCallback(
        ({ item, index }: { item: Track; index: number }) => (
            <TrackRow
                track={item}
                index={index}
                list={currentListTracks}
                isInsidePlaylist={!!selectedPlaylistId}
                isSelected={selectedTrackIds.has(item.id)}
                isSelectionMode={isSelectionMode}
                progressMap={progressMap}
                associatedPlaylists={
                    selectedPlaylistId
                        ? []
                        : playlists.filter((p) => p.trackNames.includes(item.name))
                }
                activeMenuTrackId={activeMenuTrackId}
                onSelectTrack={onSelectTrack}
                onToggleSelection={toggleSelection}
                onOpenMenu={setActiveMenuTrackId}
                onAddToPlaylist={(track: Track) => handleOpenAddModal([track])}
                onViewMetadata={onViewMetadata}
                onRemoveFromPlaylist={
                    selectedPlaylistId
                        ? (trackName: string) => onRemoveFromPlaylist(selectedPlaylistId, trackName)
                        : () => {}
                }
                style={{ height: ROW_HEIGHT }}
            />
        ),
        [
            currentListTracks,
            selectedPlaylistId,
            selectedTrackIds,
            isSelectionMode,
            progressMap,
            playlists,
            activeMenuTrackId,
            onSelectTrack,
            onViewMetadata,
            onRemoveFromPlaylist,
        ]
    );

    const renderPlaylistDetail = () => {
        const playlist = playlists.find((p) => p.id === selectedPlaylistId);
        if (!playlist) return null;

        return (
            <GestureDetector gesture={detailPan}>
                <Animated.View style={[styles.detailContainer, detailAnimatedStyle]}>
                    <View style={styles.detailHeader}>
                        <View style={styles.detailTitleRow}>
                            <TouchableOpacity
                                onPress={() => setSelectedPlaylistId(null)}
                                style={styles.iconButton}
                            >
                                <ChevronLeftIcon size={20} color="#ffffff" />
                            </TouchableOpacity>
                            <Text
                                style={styles.detailTitle}
                                numberOfLines={1}
                            >
                                {playlist.name}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setRenamePlaylistName(playlist.name);
                                    setShowRenamePlaylistModal(true);
                                }}
                                style={styles.iconButton}
                            >
                                <PencilIcon size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.detailRightRow}>
                            <TouchableOpacity
                                onPress={() => setIsSelectionMode((prev) => !prev)}
                            >
                                <Text style={styles.selectText}>
                                    {isSelectionMode ? 'Cancel' : 'Select'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handlePlaylistMoreOptions(playlist)}
                                style={styles.iconButton}
                            >
                                <MoreHorizontalIcon size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {currentListTracks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>This playlist is empty.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={currentListTracks}
                            keyExtractor={(item) => item.id}
                            renderItem={renderTrackItem}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </Animated.View>
            </GestureDetector>
        );
    };

    const renderTitlesView = () => {
        if (allTracks.length === 0) {
            return (
                <View style={styles.emptyFull}>
                    <Text style={styles.emptyText}>None</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={currentListTracks}
                keyExtractor={(item) => item.id}
                renderItem={renderTrackItem}
                contentContainerStyle={styles.listContent}
            />
        );
    };

    const renderPlaylistsView = () => {
        return (
            <View style={styles.playlistsContainer}>
                {playlists.length === 0 && (
                    <View style={styles.emptyPlaylists}>
                        <Text style={styles.emptyText}>None</Text>
                    </View>
                )}
                <FlatList
                    data={playlists}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PlaylistCard
                            playlist={item}
                            allTracks={allTracks}
                            progressMap={progressMap}
                            onClick={() => setSelectedPlaylistId(item.id)}
                        />
                    )}
                    ListFooterComponent={
                        <TouchableOpacity
                            onPress={() => setShowCreatePlaylistModal(true)}
                            style={styles.createPlaylistButton}
                            activeOpacity={0.8}
                        >
                            <PlusIcon size={22} color="#f97316" />
                            <Text style={styles.createPlaylistText}>Create New Playlist</Text>
                        </TouchableOpacity>
                    }
                    contentContainerStyle={styles.playlistsListContent}
                />
            </View>
        );
    };

    // ----- Main render -----

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                {activeTab === 'titles' && (
                    <View style={styles.headerLeft}>
                        {isSelectionMode && (
                            <TouchableOpacity onPress={handleSelectAll}>
                                <Text style={styles.selectAllText}>
                                    {isAllSelected ? 'Unselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setIsSelectionMode((prev) => !prev)}>
                            <Text style={styles.selectToggleText}>
                                {isSelectionMode ? 'Cancel' : 'Select'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        onPress={onToggleAutoPlay}
                        style={[
                            styles.autoPlayButton,
                            isAutoPlay ? styles.autoPlayOn : styles.autoPlayOff,
                        ]}
                    >
                        <RepeatIcon size={12} color={isAutoPlay ? '#f97316' : '#6b7280'} />
                        <Text
                            style={[
                                styles.autoPlayText,
                                { color: isAutoPlay ? '#f97316' : '#6b7280' },
                            ]}
                        >
                            Auto-Play {isAutoPlay ? 'On' : 'Off'}
                        </Text>
                    </TouchableOpacity>

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
                {selectedPlaylistId
                    ? renderPlaylistDetail()
                    : activeTab === 'titles'
                        ? renderTitlesView()
                        : renderPlaylistsView()}
            </View>

            {/* Bulk action bar */}
            {isSelectionMode && selectedTrackIds.size > 0 && (
                <View style={styles.bulkBar}>
                    <Text style={styles.bulkText}>{selectedTrackIds.size} selected</Text>

                    {selectedPlaylistId ? (
                        <TouchableOpacity
                            onPress={handleBulkRemove}
                            style={styles.bulkRemoveButton}
                        >
                            <Text style={styles.bulkRemoveText}>Remove from Playlist</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                const selected = allTracks.filter((t) => selectedTrackIds.has(t.id));
                                handleOpenAddModal(selected);
                            }}
                            style={styles.bulkAddButton}
                        >
                            <Text style={styles.bulkAddText}>Add to Playlist</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Modals */}
            <LibraryModals
                showAddModal={showAddModal}
                setShowAddModal={setShowAddModal}
                showCreatePlaylistModal={showCreatePlaylistModal}
                setShowCreatePlaylistModal={setShowCreatePlaylistModal}
                showRenamePlaylistModal={showRenamePlaylistModal}
                setShowRenamePlaylistModal={setShowRenamePlaylistModal}
                newPlaylistName={newPlaylistName}
                setNewPlaylistName={setNewPlaylistName}
                createPlaylistName={createPlaylistName}
                setCreatePlaylistName={setCreatePlaylistName}
                renamePlaylistName={renamePlaylistName}
                setRenamePlaylistName={setRenamePlaylistName}
                playlists={playlists}
                handleCreatePlaylist={handleCreatePlaylist}
                handleCreateEmptyPlaylist={handleCreateEmptyPlaylist}
                handleRenamePlaylist={handleRenamePlaylist}
                handleAddToExisting={handleAddToExisting}
            />
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
    autoPlayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        gap: 6,
    } as any,
    autoPlayOn: {
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
    },
    autoPlayOff: {
        borderColor: '#374151',
        backgroundColor: 'transparent',
    },
    autoPlayText: {
        fontSize: 11,
        fontWeight: '500',
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    playlistsContainer: {
        flex: 1,
    },
    playlistsListContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    emptyPlaylists: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    createPlaylistButton: {
        marginTop: 18,
        height: 72,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    } as any,
    createPlaylistText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#f97316',
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
});

export default Library;
