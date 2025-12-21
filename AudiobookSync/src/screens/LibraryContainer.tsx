import React, {Dispatch, useRef} from 'react';
import { Library } from '../components/Library/Library.tsx';
import RNFS from 'react-native-fs';
import { Track, Playlist, AppData, ProgressData } from '../utils/types.ts';
import { modelStyles } from "../utils/modelStyles.ts";
import { saveToNativeFilesystem } from '../utils/persistence.ts';
import {
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard,
    Share,
    ActionSheetIOS
} from "react-native";
import {ListIcon} from "lucide-react-native";
import {Pressable} from "react-native-gesture-handler";
import Toast from 'react-native-toast-message';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {clearAllSubtitleEdits, exportAllEditedSubtitlesParsed} from "../utils/subtitleEdits.ts";
import {zip} from "react-native-zip-archive";
import {Action, PlayerState} from "../context/PlayerContext.tsx";
import {reloadSubtitleCues} from "../utils/mediaLoader.ts";

interface LibraryContainerProps {
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;
    dispatch: Dispatch<Action>;
    state:PlayerState,
    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[], option?:number) => void;
    onViewMetadata: (name: string) => void;
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

const ignoreKeys = ["filePaths"]

export const LibraryContainer: React.FC<LibraryContainerProps> = ({
                                                                      state,
                                                                      dispatch,
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

    const handleSaveData = async () => {
        const data: AppData = {
            audiobook_progress: progressMap,
            audiobook_playlists: playlists,
            exportedAt: Date.now(),
            static: {}
        };

        const saved = await saveToNativeFilesystem(data);

        if (saved) {
            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false)
                Toast.show({
                    type:"snackbar",
                    text1:"Saved"
                });
            }, 1000);
        }
    };

    const handleMenuDelete = (call:()=>void, data:string) => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['', 'Delete', 'Cancel'],
                cancelButtonIndex: 0,
                destructiveButtonIndex: 1,
                userInterfaceStyle: 'dark',
                message: "Are you sure you want to delete " + data + "?",
            },
            (buttonIndex) => {
                if (buttonIndex === 1) {
                    call()
                }
            }
        );
    };

    const onClearStorage = async () => {
        try {

            const call = async() => {
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
            }

            handleMenuDelete(call, "app data");

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
                if(!ignoreKeys.includes(key) && !key.includes("edits_")) {
                    data[key] = JSON.parse(value!);
                }
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

    const onExportCues = async () => {

        try {

            const data = await exportAllEditedSubtitlesParsed()

            const exportDir = `${RNFS.DocumentDirectoryPath}/SubtitleExports`;
            await RNFS.mkdir(exportDir);

            // Write one file per track
            for (const [trackName, cues] of Object.entries(data)) {
                // const safeName = trackName.replace(/[^\w\d-_]/g, "_");
                const filePath = `${exportDir}/${trackName}.json`;

                await RNFS.writeFile(
                    filePath,
                    JSON.stringify({chunks: cues}, null, 2),
                    "utf8"
                );
            }

            const zipPath = `${RNFS.DocumentDirectoryPath}/SubtitleExports.zip`;

            await zip(exportDir, zipPath);

            await Share.share({
                title:"Download",
                url: "file://" + zipPath,

            });

            const cleanupSubtitleExports = async () => {
                try {
                    const dirExists = await RNFS.exists(exportDir);
                    if (dirExists) {
                        await RNFS.unlink(exportDir);
                    }

                    const zipExists = await RNFS.exists(zipPath);
                    if (zipExists) {
                        await RNFS.unlink(zipPath);
                    }
                } catch (err) {
                    console.warn("Cleanup failed:", err);
                }
            };

            setTimeout(() => {
                cleanupSubtitleExports();
            }, 3000);

            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false)
                Toast.show({
                    type:"snackbar",
                    text1:"Cues Exported"
                });
            }, 1000);

        } catch (err) {
            console.log(err);
            Toast.show({
                type:"snackbar",
                text1:"Error exporting cues"
            });
        }

    }

    const onCleanCues = async() => {

        const call = async () => {
            await clearAllSubtitleEdits();
            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false)
                Toast.show({
                    type:"snackbar",
                    text1:"Cues Deleted"
                });
            }, 1000);

            await reloadSubtitleCues(state.subtitleState, dispatch);
        }

        try {
            handleMenuDelete(call, "edited cues")
        }
        catch (err) {
            console.log(err);
            Toast.show({
                type:"snackbar",
                text1:"Error deleting cues"
            });
        }
    }


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
            onSaveData={handleSaveData}
            onExportCues={onExportCues}
            onCleanCues={onCleanCues}
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