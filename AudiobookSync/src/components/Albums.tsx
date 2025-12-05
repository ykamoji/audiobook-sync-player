import {ActionSheetIOS, Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import {PlaylistCard} from "./PlaylistCard.tsx";
import {PlusIcon} from "./Icons.tsx";
import React, {FC, useRef, useState} from "react";
import { StyleSheet} from "react-native";
import {Playlist, ProgressData, Track} from "../utils/types.ts";
import {modelStyles} from "../assets/modelStyles.ts";
// import {LibraryModals} from "./LibraryModels.tsx";

interface AlbumsProps {
    playlists: Playlist[];
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;
    onUpdate: () => void;
    playlistManager: {
        savedPlaylists: Playlist[];
        createPlaylist: (name: string, initialTracks: Track[]) => void;
        deletePlaylist: (id: string) => void;
        updatePlaylistName: (id: string, newName: string) => void;
        addToPlaylist: (playlistId: string, track: Track) => void;
        addMultipleToPlaylist: (playlistId: string, tracks: Track[]) => void;
        removeFromPlaylist: (playlistId: string, trackName: string) => void;
        removeMultipleFromPlaylist: (playlistId: string, trackNames: string[]) => void;
    };

}

export const Albums : FC<AlbumsProps> = ({
                                                 playlists,
                                                 allTracks,
                                                 onUpdate,
                                                 playlistManager,
                                                 progressMap}) =>{


    const [tracksToAdd, setTracksToAdd] = useState<Track[]>([]);

    const newAlbumRef = useRef("")

    const [newPlaylistName, setNewPlaylistName] = useState('');

    const [renamePlaylistName, setRenamePlaylistName] = useState('');
    const [showRenamePlaylistModal, setShowRenamePlaylistModal] = useState(false);

    const [showModal, setShowModal] = React.useState(false);


    // ----- Playlist / Modals logic -----

    const handleOpenAddModal = (tracks: Track[]) => {
        // setTracksToAdd(tracks);
        // setNewPlaylistName('');
        // setShowModal(true);
        // setActiveMenuTrackId(null);
    };

    const handleRenamePlaylist = () => {
        // if (!selectedPlaylistId || !renamePlaylistName.trim()) return;
        // onUpdatePlaylistName(selectedPlaylistId, renamePlaylistName.trim());
        // setRenamePlaylistName('');
        // setShowModal(false);
    };

    const handleAddToExisting = (playlistId: string) => {
        if (tracksToAdd.length === 0) return;

        if (tracksToAdd.length === 1) {
            // onAddToPlaylist(playlistId, tracksToAdd[0]);
        } else {
            // onAddMultipleToPlaylist(playlistId, tracksToAdd);
        }

        setShowModal(false);
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

        // setShowModal(false);

    };

    const handleCreateEmptyPlaylist = () => {
        // if (!createPlaylistName.trim()) return;
        // onCreatePlaylist(createPlaylistName.trim(), []);
        // setCreatePlaylistName('');
        playlistManager.createPlaylist(newAlbumRef.current, [])
        setShowModal(false);
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
                        onPress={() => setShowModal(true)}
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
            <Modal visible={showModal} transparent animationType="slide">
                <View style={modelStyles.backdrop}>
                    <View style={modelStyles.modalContainer}>
                        <Text style={modelStyles.headerText}>Create New Playlist</Text>
                        <TextInput
                            placeholder="Playlist Name"
                            placeholderTextColor="#888"
                            onChangeText={(val) => newAlbumRef.current = val}
                            style={[modelStyles.input, { marginVertical: 20 }]}
                            autoFocus
                        />

                        <View style={modelStyles.buttonRow}>
                            <TouchableOpacity
                                onPress={() => {
                                    newAlbumRef.current = ""
                                    setShowModal(false)
                                }}
                                style={[modelStyles.secondaryButton, { marginTop: 10, paddingVertical: 12 }]}>
                                <Text style={[modelStyles.secondaryButtonText, { paddingTop:1}]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCreateEmptyPlaylist}
                                style={[
                                    modelStyles.primaryButton,
                                    { flex: 1 },
                                ]}
                            >
                                <Text style={modelStyles.primaryButtonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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