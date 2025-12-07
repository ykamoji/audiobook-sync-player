import {Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import {PlaylistCard} from "./PlaylistCard.tsx";
import {PlusIcon} from "lucide-react-native";
import React, {FC, useRef} from "react";
import { StyleSheet} from "react-native";
import {Playlist, ProgressData, Track} from "../utils/types.ts";
import {modelStyles} from "../assets/modelStyles.ts";
import {Pressable} from "react-native-gesture-handler";
import Toast from 'react-native-toast-message';

interface AlbumsProps {
    playlists: Playlist[];
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;
    onUpdate: () => void;
    onPlaylistSelection: (id:string) => void,
    playlistManager: {
        savedPlaylists: Playlist[];
        createPlaylist: (name: string, initialTracks: Track[]) => void;
        isPlaylistNameTaken: (name: string) => boolean;
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
                                                 onPlaylistSelection,
                                                 playlistManager,
                                                 progressMap}) =>{


    const newAlbumRef = useRef("")

    const [showModal, setShowModal] = React.useState(false);

    const handleCreateEmptyPlaylist = () => {

        const taken = playlistManager.isPlaylistNameTaken(newAlbumRef.current)
        if(!taken){
            playlistManager.createPlaylist(newAlbumRef.current, [])
            onUpdate();
            setShowModal(false);
        }else{
            Toast.show({
                type: "snackbar",
                text1: "Playlist with this name already exists"
            })
            // Alert.alert("Playlist with this name already exists", "Try again");
        }

    };

    return (
        <>
        <View style={styles.playlistsContainer}>
            { playlists.length >= 0 && (
            <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PlaylistCard
                        playlist={item}
                        allTracks={allTracks}
                        progressMap={progressMap}
                        onClick={() => onPlaylistSelection(item.id)}
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
            />)}
        </View>
            <Modal visible={showModal} transparent animationType="slide">
                <View style={modelStyles.wrapper}>
                <Pressable style={modelStyles.backdropWrapper} onPress={() => {
                    newAlbumRef.current = ""
                    setShowModal(false)}
                }/>
                    <View style={modelStyles.modalContainer}>
                        <View style={modelStyles.headerRow}>
                            <Text style={modelStyles.headerText}>Edit Playlist</Text>
                            <TouchableOpacity onPress={() => {
                                newAlbumRef.current = ""
                                setShowModal(false)
                            }}>
                                <Text style={modelStyles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            placeholder="Playlist Name"
                            placeholderTextColor="#888"
                            onChangeText={(val) => newAlbumRef.current = val}
                            style={[modelStyles.input, { marginVertical: 20 }]}
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