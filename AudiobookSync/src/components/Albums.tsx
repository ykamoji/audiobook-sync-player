import {ActionSheetIOS, Alert, FlatList, Text, TouchableOpacity, View} from "react-native";
import {PlaylistCard} from "./PlaylistCard.tsx";
import {PlusIcon} from "./Icons.tsx";
import React, {FC, useState} from "react";
import { StyleSheet} from "react-native";
import {Playlist, ProgressData, Track} from "../utils/types.ts";
// import {LibraryModals} from "./LibraryModels.tsx";

interface AlbumsProps {
    playlists: Playlist[];
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;

}

export const Albums : FC<AlbumsProps> = ({
                                                 playlists,
                                                 allTracks,
                                                 progressMap}) =>{


    const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
    const [tracksToAdd, setTracksToAdd] = useState<Track[]>([]);
    const [createPlaylistName, setCreatePlaylistName] = useState('');
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [renamePlaylistName, setRenamePlaylistName] = useState('');
    const [showRenamePlaylistModal, setShowRenamePlaylistModal] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);

    // reset selection on tab change / playlist exit
    React.useEffect(() => {
        // setIsSelectionMode(false);
        // setSelectedTrackIds(new Set());
    }, []);



    // ----- Playlist / Modals logic -----

    const handleOpenAddModal = (tracks: Track[]) => {
        setTracksToAdd(tracks);
        setNewPlaylistName('');
        setShowAddModal(true);
        // setActiveMenuTrackId(null);
    };

    const handleRenamePlaylist = () => {
        // if (!selectedPlaylistId || !renamePlaylistName.trim()) return;
        // onUpdatePlaylistName(selectedPlaylistId, renamePlaylistName.trim());
        setRenamePlaylistName('');
        setShowRenamePlaylistModal(false);
    };

    const handleAddToExisting = (playlistId: string) => {
        if (tracksToAdd.length === 0) return;

        if (tracksToAdd.length === 1) {
            // onAddToPlaylist(playlistId, tracksToAdd[0]);
        } else {
            // onAddMultipleToPlaylist(playlistId, tracksToAdd);
        }

        setShowAddModal(false);
        // setIsSelectionMode(false);
        // setSelectedTrackIds(new Set());
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
                                    // onDeletePlaylist(playlist.id);
                                    // setSelectedPlaylistId(null);
                                },
                            },
                        ]
                    );
                }
            }
        );
    };


    const handleCreatePlaylist = () => {
        if (!newPlaylistName.trim() || tracksToAdd.length === 0) return;
        // onCreatePlaylist(newPlaylistName.trim(), tracksToAdd);
        setShowAddModal(false);
        // setIsSelectionMode(false);
        // setSelectedTrackIds(new Set());
    };

    const handleCreateEmptyPlaylist = () => {
        if (!createPlaylistName.trim()) return;
        // onCreatePlaylist(createPlaylistName.trim(), []);
        setCreatePlaylistName('');
        setShowCreatePlaylistModal(false);
    };

    const handleBulkRemove = () => {
        // if (!selectedPlaylistId || selectedTrackIds.size === 0) return;
        // const playlist = playlists.find((p) => p.id === selectedPlaylistId);
        // if (!playlist) return;

        const tracksToRemove: string[] = [];
        allTracks.forEach((t) => {
            // if (selectedTrackIds.has(t.id)) {
            //     tracksToRemove.push(t.name);
            // }
        });

        // onRemoveMultipleFromPlaylist(selectedPlaylistId, tracksToRemove);
        // setIsSelectionMode(false);
        // setSelectedTrackIds(new Set());
    };

    return (
        <>
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
                        // onClick={() => setSelectedPlaylistId(item.id)}
                        onClick={() => {}}
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

        {/*<LibraryModals*/}
        {/*    showAddModal={showAddModal}*/}
        {/*    setShowAddModal={setShowAddModal}*/}
        {/*    showCreatePlaylistModal={showCreatePlaylistModal}*/}
        {/*    setShowCreatePlaylistModal={setShowCreatePlaylistModal}*/}
        {/*    showRenamePlaylistModal={showRenamePlaylistModal}*/}
        {/*    setShowRenamePlaylistModal={setShowRenamePlaylistModal}*/}
        {/*    newPlaylistName={newPlaylistName}*/}
        {/*    setNewPlaylistName={setNewPlaylistName}*/}
        {/*    createPlaylistName={createPlaylistName}*/}
        {/*    setCreatePlaylistName={setCreatePlaylistName}*/}
        {/*    renamePlaylistName={renamePlaylistName}*/}
        {/*    setRenamePlaylistName={setRenamePlaylistName}*/}
        {/*    playlists={playlists}*/}
        {/*    handleCreatePlaylist={handleCreatePlaylist}*/}
        {/*    handleCreateEmptyPlaylist={handleCreateEmptyPlaylist}*/}
        {/*    handleRenamePlaylist={handleRenamePlaylist}*/}
        {/*    handleAddToExisting={handleAddToExisting}*/}
        {/*/>*/}
        </>
    )
};

const styles = StyleSheet.create({
    playlistsContainer: {
        flex: 1,
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
    emptyText: {
        color: '#6b7280',
        fontSize: 16,
    },
    playlistsListContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    }
})