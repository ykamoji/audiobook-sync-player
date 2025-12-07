import {ActionSheetIOS, Alert, Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import React, {FC, useEffect, useRef, useState} from "react";
import { StyleSheet} from "react-native";
import {Playlist, ProgressData, Track} from "../utils/types.ts";
import {modelStyles} from "../assets/modelStyles.ts";
import {Albums} from "./Albums.tsx";
import {AlbumContent} from "./AlbumContent.tsx";
import {Pressable} from "react-native-gesture-handler";

interface AlbumsContainerProps {
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;
    onUpdate: () => void;
    closeAlbums: boolean;
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    onViewMetadata: (track: Track) => void;
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

export const AlbumContainer : FC<AlbumsContainerProps> = ({
                                             allTracks,
                                             onUpdate,
                                             closeAlbums,
                                             playlistManager,
                                             onSelectTrack,
                                             onViewMetadata,
                                             progressMap}) =>{


    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [showModal, setShowModal] = React.useState(false);

    const renameAlbumRef = useRef("")

    const playlists = playlistManager.savedPlaylists

    let selectedPlaylist = null as unknown as Playlist;

    if(!!selectedPlaylistId){
        selectedPlaylist = playlists.find(play => play.id === selectedPlaylistId)!;
    }

    const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);

    useEffect(() => {
        if (selectedPlaylistId) {
            const sp = playlists.find(play => play.id === selectedPlaylistId);
            if (sp) {
                setPlaylistTracks(
                    allTracks.filter(track => sp.trackNames.includes(track.name))
                );
            }
        } else {
            setPlaylistTracks([]);
        }
    }, [selectedPlaylistId, allTracks, playlists]);

    useEffect(() => {
        if(closeAlbums && !!selectedPlaylist){
            setPlaylistTracks([])
            setSelectedPlaylistId(null)
        }

    }, [closeAlbums]);

    const handlePlaylistDelete = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['', 'Delete Playlist', 'Cancel'],
                cancelButtonIndex: 0,
                destructiveButtonIndex: 1,
                userInterfaceStyle: 'dark',
            },
            (buttonIndex) => {
               if (buttonIndex === 1) {
                    playlistManager.deletePlaylist(selectedPlaylistId!)
                    onUpdate();
                    setSelectedPlaylistId(null)
               }
            }
        );
    };

    const handleTrackRemove = (track: Track, done:()=>void) => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['', 'Remove', 'Cancel'],
                cancelButtonIndex: 0,
                destructiveButtonIndex: 1,
                userInterfaceStyle: 'dark',
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                    playlistManager.removeFromPlaylist(selectedPlaylistId!, track.name);
                    onUpdate()
                }
                done()
            }
        );
    };

    return (<>
        <View style={[
            styles.container,
            selectedPlaylistId !== null && styles.hiddenScreen
        ]}>
            <Albums
                playlists={playlists}
                allTracks={allTracks}
                progressMap={progressMap}
                closeAlbums={closeAlbums}
                onUpdate={onUpdate}
                onPlaylistSelection={setSelectedPlaylistId}
                playlistManager={playlistManager}
            />
        </View>
        <View style={[
            { flex: 1 },
            selectedPlaylistId === null && styles.hiddenScreen
        ]}>
            <AlbumContent
                selectedPlaylist={selectedPlaylist!}
                progressMap={progressMap}
                playlistTracks={playlistTracks}
                onSelectTrack={onSelectTrack}
                onViewMetadata={onViewMetadata}
                playlistNameChange={()=> setShowModal(true)}
                onRemoveTrack={(track: Track, done) => handleTrackRemove(track, done)}
                onBack={()=> setSelectedPlaylistId(null)}
                handleBulkRemove={(tracksNames: string[]) => {
                    playlistManager.removeMultipleFromPlaylist(selectedPlaylistId!, tracksNames)
                    onUpdate()
                }}
                handlePlaylistDelete={handlePlaylistDelete}
            />
        </View>
        <Modal visible={showModal} transparent animationType="slide">
            <Pressable style={modelStyles.backdrop} onPress={()=> setShowModal(false)}>
                <View style={modelStyles.modalContainer}>
                    <Text style={modelStyles.headerText}>Rename Playlist</Text>
                    <TextInput
                        placeholder="New Playlist Name"
                        placeholderTextColor="#888"
                        defaultValue={selectedPlaylist?.name}
                        onChangeText={(val)=> renameAlbumRef.current = val}
                        style={[modelStyles.input, { marginVertical: 20 }]}
                        autoFocus
                    />

                    <View style={modelStyles.buttonRow}>
                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            style={[modelStyles.secondaryButton, { marginTop: 10, paddingVertical: 12 }]}
                        >
                            <Text style={modelStyles.secondaryButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                playlistManager.updatePlaylistName(selectedPlaylistId!, renameAlbumRef.current)
                                renameAlbumRef.current = ""
                                setShowModal(false)
                            }}
                            style={[
                                modelStyles.primaryButton,
                                { flex: 1 },
                            ]}
                        >
                            <Text style={modelStyles.primaryButtonText}>Update</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    </>)
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    hiddenScreen: {
        opacity: 0,
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
})