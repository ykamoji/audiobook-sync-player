import React, {useRef} from 'react';
import { Library } from './Library';
import { Track, Playlist, AppData, ProgressData } from '../utils/types';
import { modelStyles } from "../assets/modelStyles";
import { saveToNativeFilesystem } from '../utils/persistence';
import {Dimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, Keyboard} from "react-native";
import {ListIcon} from "./Icons.tsx";

interface LibraryContainerProps {
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;

    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    onViewMetadata: (track: Track) => void;
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

    nativeRootPath: string;
}

export const LibraryContainer: React.FC<LibraryContainerProps> = ({
                                                                      allTracks,
                                                                      progressMap,
                                                                      onSelectTrack,
                                                                      onViewMetadata,
                                                                      onUpdate,
                                                                      playlistManager,
                                                                      nativeRootPath
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
        const saved = await saveToNativeFilesystem(data, nativeRootPath);

        if (saved) {
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 1000);
        }
    };


    const playlistChangeRef = useRef("")
    const tracksChangeRef = useRef([] as Track[])

    const changeAlbumActions = (action: string, playlistId?: string) => {
        const tracks = tracksChangeRef.current;

        if (action === "create") {
            const playlist_name = playlistChangeRef.current.trim();
            playlistManager.createPlaylist(playlist_name, tracks);
        }
        else if (action === "add") {
            playlistManager.addMultipleToPlaylist(playlistId!, tracks);
        }
        else if (action === "remove") {
            const names = tracks.map(t => t.name);
            playlistManager.removeMultipleFromPlaylist(playlistId!, names);
        }

        Keyboard.dismiss();
        onUpdate();
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
            exportSuccess={exportSuccess}

            // Playlist actions
            handleAlbumActions={(tracks: Track[]) => {
                tracksChangeRef.current = [...tracks];
            }}
            setShowModal={setShowModal}
        />

        <Modal visible={showModal} transparent animationType="slide">
            <View style={modelStyles.backdrop}>
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
                    <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
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
                                onPress={()=> changeAlbumActions('create')}
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