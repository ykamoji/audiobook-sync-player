import React, {useState, useCallback, useEffect} from 'react';
import { FlashList } from '@shopify/flash-list';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity, Modal,
} from 'react-native';
import { Track, Playlist, ProgressData } from '../../utils/types.ts';
import { SpinnerIcon } from '../../services/SpinnerIcon.tsx';
import { TrackRow } from '../TrackRow.tsx';
import {Menu} from "react-native-paper";
import {
    BrushCleaningIcon,
    Download,
    DownloadCloudIcon,
    Eraser,
    InfoIcon,
    MoreVertical,
    PencilIcon,
    Save,
    Trash2
} from "lucide-react-native";
import {usePlayerContext} from "../../context/PlayerContext.tsx";
import {useTheme} from "../../utils/themes.ts";

interface LibraryProps {
    allTracks: Track[];
    playlists: Playlist[];
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[], option?:number) => void;
    progressMap: Record<string, ProgressData>;
    handleAlbumActions: (track: Track[]) => void;
    setShowModal: (showModal: boolean) => void;
    onSaveData: () => void;
    onExportCues: () => void;
    onCleanCues: () => void;
    onDownloadData: () => void;
    onClearStorage: (option:number) => void;
    exportSuccess: boolean;
    onViewMetadata: (name: string) => void;
}

const ROW_HEIGHT = 88;

type TrackMenuState = {
    visible: boolean;
    track: Track | null;
    isInsidePlaylist: boolean;
    position: { top: number; right: number };
};

export const Library: React.FC<LibraryProps> = ({
                                                    allTracks,
                                                    playlists,
                                                    onSelectTrack,
                                                    progressMap,
                                                    handleAlbumActions,
                                                    setShowModal,
                                                    onSaveData,
                                                    onExportCues,
                                                    onCleanCues,
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

    const { state } = usePlayerContext();

    const { audioState, isPlaying } = state;

    useEffect(() => {
        if(!isSelectionMode){
            setSelectedTrackIds(new Set());
        }

    }, [isSelectionMode]);


    const [trackMenu, setTrackMenu] = useState<TrackMenuState>({
        visible: false,
        track: null,
        isInsidePlaylist: false,
        position: { top: 0, right: 20 },
    });

    const openTrackMenu = useCallback(
        (
            track: Track,
            isInsidePlaylist: boolean,
            position: { top: number; right: number }
        ) => {
            setTrackMenu({
                visible: true,
                track,
                isInsidePlaylist,
                position,
            });
        },
        []
    );

    const closeTrackMenu = useCallback(() => {
        setTrackMenu(prev => ({ ...prev, visible: false }));
    }, []);



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
                onOpenMenu={openTrackMenu}
                showLive={isPlaying && audioState.name === item.name}
                onLongPress={() => setIsSelectionMode(prev => !prev)}
                style={{ height: ROW_HEIGHT }}
            />
        ),
        [
            selectedTrackIds,
            isSelectionMode,
            progressMap,
            playlists,
            onSelectTrack,
            allTracks,
            isPlaying,
            audioState.name,
            openTrackMenu]
    );

    // ----- Main render -----

    const styles = STYLES(useTheme())

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
                        theme={{
                            colors: {
                                surface: styles.menuContainer.backgroundColor,
                                elevation: { level2: styles.menuContainer.backgroundColor },
                            },
                        }}
                        mode="elevated"
                        anchor={
                            <TouchableOpacity onPress={openMenu}>
                                <View style={styles.saveButton}>
                                    {exportSuccess ? (
                                        <SpinnerIcon size={20} color="#22c55e" />
                                    ) : (
                                        <MoreVertical size={20} style={{paddingHorizontal:14, paddingEnd:20}} color={styles.moreIcon.color} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        }
                    >
                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onSaveData();
                            }}
                            titleStyle={{ color: "#050505" }}
                            title="Save"
                            leadingIcon={() => <Save size={18} color="#3D9D72" />}
                        />
                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onExportCues();
                            }}
                            titleStyle={{ color: "#050505" }}
                            title="Export Cues"
                            leadingIcon={() => <DownloadCloudIcon size={18} color="#0A84FF" />}
                        />


                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onDownloadData();
                            }}
                            titleStyle={{ color: "#050505" }}
                            title="Export Metadata"
                            leadingIcon={() => <Download size={18} color="#0A84FF" />}
                        />

                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onClearStorage(1);
                            }}
                            title="Clean App Data"
                            titleStyle={{ color: "#050505" }}
                            leadingIcon={() => <Eraser size={18} color="orange" />}
                        />

                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onCleanCues();
                            }}
                            titleStyle={{ color: "#050505" }}
                            title="Clear Cues"
                            leadingIcon={() => <BrushCleaningIcon size={18} color="#FF3B30" />}
                        />

                        <Menu.Item
                            onPress={() => {
                                closeMenu();
                                onClearStorage(2);
                            }}
                            title="Clear App Data"
                            titleStyle={{ color: "#050505" }}
                            leadingIcon={() => <Trash2 size={18} color="#FF3B30" />}
                        />
                    </Menu>
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
            <Modal
                visible={trackMenu.visible}
                transparent
                animationType="fade"
                onRequestClose={closeTrackMenu}
            >
                <TouchableOpacity style={styles.backdrop} onPress={closeTrackMenu} />
                <View style={[styles.menuContainer, trackMenu.position]} >
                    <TouchableOpacity style={styles.menuItem} onPress={()=>{
                        setShowModal(true);
                        handleAlbumActions([trackMenu.track!]);
                        closeTrackMenu();
                    }}>
                        <PencilIcon size={18} color={styles.menuIcon.color} />
                        <Text style={styles.menuText}>Edit Playlist</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={()=>{
                            onViewMetadata(trackMenu.track!.name);
                            closeTrackMenu();
                        }}
                    >
                        <InfoIcon size={18} color={styles.menuIcon.color} />
                        <Text style={styles.menuText}>View Metadata</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const STYLES = (theme:any) => StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.libraryBgColor,
    },
    header: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.libraryBgColor,
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
        fontSize: 14,
        color: theme.libraryHeaderColor,
    },
    selectToggleText: {
        fontSize: 14,
        color: theme.selectToggleText,
        fontWeight: 'bold',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    } as any,
    saveText: {
        fontSize: 14,
        color: theme.libraryHeaderColor,
    },
    saveTextSuccess: {
        color: '#22c55e',
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 100,
    },
    iconButton: {
        padding: 6,
    },
    moreIcon:{
        color: theme.libraryMoreColor,
    },
    selectText: {
        fontSize: 16,
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
        color: theme.libraryEmptyText,
        fontSize: 16,
        textAlign: 'center',
    },
    emptyFull: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
    },
    bulkBar: {
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
        fontSize: 12,
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
        fontSize: 12,
    },
    bulkHidden:{
        opacity: 0,
        pointerEvents: "none",
        position: "absolute",
    },
    backdrop: {
        flex: 1,
    },
    menuContainer: {
        position: "absolute",
        right: 20,
        top: 120,
        backgroundColor: theme.libraryMenuBgColor,
        borderRadius: 0,
        paddingVertical: 6,
        width: 200,
        borderWidth: 1,
        borderColor: theme.libraryMenuBorderColor,
    },

    menuIcon:{
        color: theme.libraryMenuColor,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },

    menuText: {
        color: theme.libraryMenuColor,
        marginLeft: 10,
        fontSize: 16,
    },
});