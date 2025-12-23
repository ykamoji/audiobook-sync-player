import React, {FC, useCallback, useEffect, useState} from "react";
import {Playlist, ProgressData, Track} from "../../utils/types.ts";
import {ActionSheetIOS, Modal, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {ChevronLeftIcon, InfoIcon, PencilIcon, Trash, TrashIcon} from "lucide-react-native";
import {TrackRow} from "../TrackRow.tsx";
import {FlashList} from "@shopify/flash-list";
import {usePlayerContext} from "../../context/PlayerContext.tsx";
import {useTheme} from "../../utils/themes.ts";
import {Gesture, GestureDetector, PanGestureHandler} from "react-native-gesture-handler";
import Animated, {runOnJS, useSharedValue} from "react-native-reanimated";

interface AlbumContentProps {
    playlistTracks?: Track[];
    selectedPlaylist?: Playlist;
    onBack: () => void;
    playlistNameChange: () => void;
    onViewMetadata: (name: string) => void;
    progressMap: Record<string, ProgressData>;
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    onRemoveTrack: (track: Track, callback:()=>void) => void;
    handleBulkRemove: (tracksNames: string[]) => void;
    handlePlaylistDelete: () => void;
}

const ROW_HEIGHT = 88;
const SWIPE_THRESHOLD = 60;

type TrackMenuState = {
    visible: boolean;
    track: Track | null;
    position: { top: number; right: number };
};

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

    const { state } = usePlayerContext();

    const { audioState, isPlaying } = state;

    const [trackMenu, setTrackMenu] = useState<TrackMenuState>({
        visible: false,
        track: null,
        position: { top: 0, right: 20 },
    });

    const openTrackMenu = useCallback(
        (track: Track, _isInsidePlaylist: boolean, position: { top: number; right: number }) => {
            setTrackMenu({
                visible: true,
                track,
                position,
            });
        }, []);

    const closeTrackMenu = useCallback(() => {
        setTrackMenu(prev => ({ ...prev, visible: false }));
    }, []);

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
                onOpenMenu={openTrackMenu}
                style={{height: ROW_HEIGHT}}
                showLive={isPlaying && audioState.name === item.name}
            />
        ),
        [
            selectedTrackIds,
            isSelectionMode,
            progressMap,
            onSelectTrack,
            playlistTracks,
            isPlaying,
            audioState.name,
            openTrackMenu
        ]
    );

    const styles = STYLES(useTheme())

    const hasTriggeredBack = useSharedValue(false);

    const backSwipeGesture = Gesture.Pan()
        .enabled(!isSelectionMode)
        .hitSlop({ left: 0, width: 40 })
        .activeOffsetX(25)
        .failOffsetY([-30, 30])
        .onBegin(() => {
            hasTriggeredBack.value = false;
        })
        .onUpdate((event) => {
            const fastSwipe = event.velocityX > 1100;
            const longSwipe = event.translationX > SWIPE_THRESHOLD;

            if (!hasTriggeredBack.value && (fastSwipe || longSwipe)) {
                hasTriggeredBack.value = true;
                runOnJS(onBack)();
            }
        });

    return (
        <>
            <GestureDetector gesture={backSwipeGesture}>
                <Animated.View style={styles.detailContainer}>
                    <View style={styles.detailHeader}>
                        <View style={styles.detailTitleRow}>
                            <TouchableOpacity
                                onPress={onBack}
                                style={styles.iconButton}
                            >
                                <ChevronLeftIcon size={20} color={styles.iconButton.color}/>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                playlistNameChange();
                            }}>
                                <Text
                                    style={styles.detailTitle}
                                    numberOfLines={1}
                                >
                                    {selectedPlaylist?.name}
                                </Text>
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
                            <Trash size={18} color={styles.iconButton.color}/>
                        </TouchableOpacity>
                        </View>
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
                    {playlistTracks?.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>This playlist is empty.</Text>
                        </View>
                    ) : (
                        <FlashList
                            data={playlistTracks}
                            estimatedItemSize={ROW_HEIGHT}
                            decelerationRate={0.9}
                            keyExtractor={(item) => item.id}
                            renderItem={renderTrackItem}
                            extraData={{
                                isSelectionMode,
                                selectedTrackIds
                            }}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </Animated.View>
            </GestureDetector>
            <Modal
                visible={trackMenu.visible}
                transparent
                animationType="fade"
                onRequestClose={closeTrackMenu}
            >
                <TouchableOpacity style={styles.backdrop} onPress={closeTrackMenu} />
                <View style={[styles.menuContainer, trackMenu.position]} >
                    <TouchableOpacity style={styles.menuItem} onPress={()=>{
                        onRemoveTrack(trackMenu.track!, closeTrackMenu);
                    }}>
                        <TrashIcon size={18} color={styles.menuIcon.color} />
                        <Text style={styles.menuText}>Remove</Text>
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
        </>
    );
};

const STYLES = (theme:any) => StyleSheet.create({
    detailContainer: {
        flex: 1,
    },
    iconButton: {
        padding: 6,
        color: theme.iconBox,
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
        color: theme.detailTitle,
        maxWidth: 220,
    },
    detailRightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    } as any,
    selectText: {
        fontSize: 13,
        color: theme.libraryHeaderColor,
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
    },
    emptyFull: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    listContent: {
        paddingBottom: 80,
    },
    selectAllText: {
        fontSize: 13,
        color: theme.libraryHeaderColor,
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
        left: 0,
        right: 0,
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
        backgroundColor: '#f97316',
    },
    bulkRemoveText: {
        color: '#000000',
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
})