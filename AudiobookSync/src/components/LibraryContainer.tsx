import React, {useRef} from 'react';
import { Library } from './Library';
import RNFS from 'react-native-fs';
import { Track, Playlist, AppData, ProgressData } from '../utils/types';
import { modelStyles } from "../assets/modelStyles";
import { saveToNativeFilesystem } from '../utils/persistence';
import {Dimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, Keyboard, Share} from "react-native";
import {ListIcon} from "lucide-react-native";
import {Pressable} from "react-native-gesture-handler";
import Toast from 'react-native-toast-message';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LibraryContainerProps {
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;

    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    onViewMetadata: (track: Track) => void;
    onUpdate: () => void;
    clearStorage: () => void;
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

const ignoreKeys = ["filePaths", "colorMap"]

export const LibraryContainer: React.FC<LibraryContainerProps> = ({
                                                                      allTracks,
                                                                      progressMap,
                                                                      onSelectTrack,
                                                                      onViewMetadata,
                                                                      onUpdate,
                                                                      clearStorage,
                                                                      playlistManager
                                                                  }) => {

    const [exportSuccess, setExportSuccess] = React.useState(false);
    const [showModal, setShowModal] = React.useState(false);

    const playlists = playlistManager.savedPlaylists

    const handleExportData = async () => {
        const data: AppData = {
            progress: progressMap,
            playlists: playlists,
            exportedAt: Date.now(),
        };

        // Use RN-only persistence (no Capacitor, no Web download)
        const saved = await saveToNativeFilesystem(data);

        if (saved) {
            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false)
                Toast.show({
                    type:"snackbar",
                    text1:"Saved in storage"
                });
            }, 1000);
        }
    };

    const onClearStorage = async () => {
        try {
            await AsyncStorage.clear();

            clearStorage()

            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false)
                Toast.show({
                    type:"snackbar",
                    text1:"Storage cleared"
                });
            }, 1000);
        } catch (err) {
            console.error("Clear error:", err);
        }
    };

    const onDownloadData = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const stores = await AsyncStorage.multiGet(keys);

            const data = {} as any;
            stores.forEach(([key, value]) => {
                if(!ignoreKeys.includes(key))
                    data[key.replace("audiobook_","")] = JSON.parse(value!);
            });

            const path = `${RNFS.TemporaryDirectoryPath}/metadata.json`;

            await RNFS.writeFile(path, JSON.stringify(data, null, 2), 'utf8');

            await Share.share({
                title:"Download",
                url: "file://" + path,
            });

            try {
                await RNFS.unlink(path);
                // console.log("Temporary file deleted:", path);
            } catch (e) {
                console.log("Cleanup error:", e);
            }

            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false)
                Toast.show({
                    type:"snackbar",
                    text1:"Data Exported"
                });
            }, 1000);

        } catch (err) {
            console.log(err);
            Toast.show({
                type:"snackbar",
                text1:"Error exporting data"
            });
        }
    };


    const playlistChangeRef = useRef("")
    const tracksChangeRef = useRef([] as Track[])

    const changeAlbumActions = (action: string, playlistId?: string) => {
        const tracks = tracksChangeRef.current;

        if (action === "create") {
            const playlist_name = playlistChangeRef.current.trim();
            const taken = playlistManager.isPlaylistNameTaken(playlist_name)
            if(!taken) {
                playlistManager.createPlaylist(playlist_name, tracks);
                playlistChangeRef.current = "";
                tracksChangeRef.current = [];
                setShowModal(false)
                Keyboard.dismiss();
                onUpdate();
            }
            else{
                Toast.show({
                    type: "snackbar",
                    text1: "Playlist with this name already exists"
                })
            }
        }
        else if (action === "add") {
            playlistManager.addMultipleToPlaylist(playlistId!, tracks);
            Keyboard.dismiss();
            onUpdate();
        }
        else if (action === "remove") {
            const names = tracks.map(t => t.name);
            playlistManager.removeMultipleFromPlaylist(playlistId!, names);
            Keyboard.dismiss();
            onUpdate();
        }

    };

    let currentPlaylists = [] as Playlist[];
    let otherPlaylists = [] as Playlist[];
    if(tracksChangeRef.current.length > 0){
        currentPlaylists = playlists.filter(p =>
            p.trackNames.includes(tracksChangeRef.current[0].name)
        );

        otherPlaylists = playlists.filter(p =>
            !p.trackNames.includes(tracksChangeRef.current[0].name)
        );
    }


    const renderPlaylistItem = (p: Playlist, isCurrent: boolean) => (
        <View key={p.id} style={modelStyles.playlistRow}>
                <TouchableOpacity
                    onPress={() => {if(!isCurrent) changeAlbumActions('add', p.id)}}
                    style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={modelStyles.iconBox}>
                        <ListIcon size={18} color="#bbb" />
                    </View>
                    <Text style={modelStyles.playlistName}>{p.name}</Text>

                    <Text style={modelStyles.trackCount}>
                        {p.trackNames.length} tracks
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        if(isCurrent) changeAlbumActions('remove', p.id)
                        else changeAlbumActions('add', p.id)
                    }}
                    style={modelStyles.secondaryButton}>
                    <Text style={modelStyles.secondaryButtonText}>{ isCurrent ? 'Remove' : 'Add' }</Text>
                </TouchableOpacity>
        </View>
    );

    return (
        <>
        <Library
            allTracks={allTracks}
            playlists={playlists}
            progressMap={progressMap}

            onSelectTrack={onSelectTrack}
            onViewMetadata={onViewMetadata}

            // Exporting
            onExportData={handleExportData}
            onClearStorage={onClearStorage}
            onDownloadData={onDownloadData}
            exportSuccess={exportSuccess}

            // Playlist actions
            handleAlbumActions={(tracks: Track[]) => {
                tracksChangeRef.current = [...tracks];
            }}
            setShowModal={setShowModal}
        />
        <Modal visible={showModal} transparent animationType="slide">
            <View style={modelStyles.wrapper}>
            <Pressable style={modelStyles.backdropWrapper}
                       onPress={() => {
                           playlistChangeRef.current = "";
                           tracksChangeRef.current = [];
                           setShowModal(false);
                       }}/>
                <View style={modelStyles.modalContainer}>
                    <View style={modelStyles.headerRow}>
                        <Text style={modelStyles.headerText}>Edit Playlist</Text>
                        <TouchableOpacity onPress={() => {
                            playlistChangeRef.current = "";
                            tracksChangeRef.current = []
                            setShowModal(false)}
                        }>
                            <Text style={modelStyles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }} keyboardShouldPersistTaps="handled">
                        {/* Create New Playlist */}
                        <View style={modelStyles.section}>
                            <TextInput
                                key={showModal ? "open" : "closed"}
                                placeholder="New Playlist Name"
                                placeholderTextColor="#888"
                                onChangeText={(val)=> (playlistChangeRef.current = val)}
                                style={modelStyles.input}
                            />

                            <TouchableOpacity
                                onPress={()=> {
                                    if(playlistChangeRef.current.trim() !== "") {
                                        changeAlbumActions('create')
                                    }
                                }}
                                style={modelStyles.primaryButton}>
                                <Text style={modelStyles.primaryButtonText}>Create & Add</Text>
                            </TouchableOpacity>
                        </View>
                        {playlists.length > 0 && (
                            <>
                                {currentPlaylists.length > 0 && (
                                    <>
                                        <Text style={modelStyles.sectionLabel}>Current Playlists</Text>
                                        {currentPlaylists.map(p => renderPlaylistItem(p, true))}
                                    </>
                                )}
                                {otherPlaylists.length > 0 && (
                                    <>
                                        <Text style={modelStyles.sectionLabel}>Other Playlists</Text>
                                        {otherPlaylists.map(p => renderPlaylistItem(p, false))}
                                    </>
                                )}
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    </>
    );
};