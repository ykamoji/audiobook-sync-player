import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import { FlashList } from '@shopify/flash-list';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Track, Playlist, ProgressData } from '../utils/types';
import { SpinnerIcon } from './SpinnerIcon.tsx';
import { TrackRow } from './TrackRow';
import {Menu, Divider, MD3DarkTheme,} from "react-native-paper";
import {Download, MoreVertical, SaveAll, Trash2} from "lucide-react-native";

interface LibraryProps {
    allTracks: Track[];
    playlists: Playlist[];
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    progressMap: Record<string, ProgressData>;
    handleAlbumActions: (track: Track[]) => void;
    setShowModal: (showModal: boolean) => void;
    onExportData: () => void;
    onDownloadData: () => void;
    onClearStorage: () => void;
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
                                                    onDownloadData,
                                                    exportSuccess,
                                                    onClearStorage,
                                                    onViewMetadata,
                                                }) => {

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());

    const [visible, setVisible] = useState(false);
    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

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

            if(copy.size === 0){
                setIsSelectionMode(false)
            }
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
                onEditToPlaylist={(track: Track, done) => {
                    setShowModal(true);
                    handleAlbumActions([track])
                    done()
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
                    <Menu
                        visible={visible}
                        onDismiss={closeMenu}
                        mode="elevated"
                        theme={{
                            ...MD3DarkTheme,
                            colors: {
                                ...MD3DarkTheme.colors,
                                onSurface: "#CCC",
                                onSurfaceVariant: "#CCC",
                                surface: "#050505",
                                elevation: { level2: "#050505" },
                            },
                        }}
                        anchor={
                            <TouchableOpacity onPress={openMenu}>
                                <View style={styles.saveButton}>
                                    {exportSuccess ? (
                                        <SpinnerIcon size={20} color="#22c55e" />
                                    ) : (
                                        <MoreVertical size={20} color="#9ca3af" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        }
                    >
                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onExportData();
                            }}
                            titleStyle={{ color: "#CCC" }}
                            title="Save Data"
                            leadingIcon={() => <SaveAll size={18} color="#3D9D72" />}
                        />
                        <Divider />

                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onDownloadData();
                            }}
                            titleStyle={{ color: "#CCC" }}
                            title="Download File"
                            leadingIcon={() => <Download size={18} color="#0A84FF" />}
                        />
                        <Divider />

                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onClearStorage();
                            }}
                            title="Clear Storage"
                            titleStyle={{ color: "#CCC" }}
                            leadingIcon={() => <Trash2 size={18} color="#FF3B30" />}
                        />
                    </Menu>
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
        fontSize: 20,
        color: '#9ca3af',
    },
    selectToggleText: {
        fontSize: 20,
        color: '#f97316',
        fontWeight: '600',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    } as any,
    saveText: {
        fontSize: 20,
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
    iconButton: {
        padding: 6,
    },
    selectText: {
        fontSize: 20,
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
        fontSize: 24,
        textAlign: 'center',
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