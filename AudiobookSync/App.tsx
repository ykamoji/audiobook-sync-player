import React, {useCallback, useEffect, useState} from "react";
import {SafeAreaView, SafeAreaProvider} from "react-native-safe-area-context";
import {
    View,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Text,
} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import RNFS from "react-native-fs";
import { pickDirectory  } from "react-native-document-picker";
import {Setup} from "./src/components/Setup";
import {LibraryContainer} from "./src/components/LibraryContainer";
import {PlayerContainer} from "./src/components/PlayerContainer";
import {
    MetadataPanel,
    MetadataPanelData,
} from "./src/components/MetadataPanel";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from "react-native-reanimated";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MenuProvider } from 'react-native-popup-menu';
import {MiniPlayer} from "./src/components/MiniPlayer";
import {Track, AppData} from "./src/utils/types";
import {loadInitialNativeMetadata} from "./src/utils/persistence";
import {usePlaylistManager} from "./src/hooks/usePlaylistManager";
import {useProgressManager} from "./src/hooks/useProgressManager";
import {useLibrary} from "./src/hooks/useLibrary";
import {usePlayer} from "./src/hooks/usePlayer";
import TrackPlayer, {Capability} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {scanNativePath} from "./src/utils/fileScanner.ts";
import {savePlaylist, checkLocalStorageAvailable} from "./src/utils/persistence";
import {AlbumContainer} from "./src/components/AlbumContainer.tsx";
import Toast, {ToastConfig} from "react-native-toast-message";

export const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
        ],
        compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
        ],
    });
};

type ViewName = "setup" | "library" | "albums";
type PlayerMode = "mini" | "full";

const getFileSize = async (path: string): Promise<number> => {
    const cleanPath = decodeURI(path.replace("file://", ""));
    const stat = await RNFS.stat(cleanPath);
    return Number(stat.size);
};

const AppContent: React.FC = () => {
    const insets = useSafeAreaInsets();

    // --- Global View State ---
    const [view, setView] = useState<ViewName>("setup");
    const [playerMode, setPlayerMode] = useState<PlayerMode>("mini");
    const [isStorageLoaded, setIsStorageLoaded] = useState(false);

    const [metadataPanelData, setMetadataPanelData] =
        useState<MetadataPanelData | null>(null);

    // --- Custom Hooks ---
    const playlistManager = usePlaylistManager(isStorageLoaded);

    const {progressMap, initProgress, saveProgress, reloadProgress} =
        useProgressManager();

    const {allTracks, setAllTracks, isLoading, nativeRootPath, handleDirectoryUpload} =
        useLibrary({
            onMetadataLoaded: (data: AppData) => applyMetadata(data),
            onUploadSuccess: () => setView("library"),
        });

    useEffect(() => {
        setupPlayer();
    }, []);

    const player = usePlayer({
        progressMap,
        saveProgress,
    });


    // ------------------------------------------------
    // Apply metadata logic
    // ------------------------------------------------
    const applyMetadata = (data: AppData) => {

        if (data.progress) {
            initProgress(data.progress).then()
        }

        if (data.playlists) {
            playlistManager.setSavedPlaylists(data.playlists);
            savePlaylist(data.playlists).then();
        }

    };

    const loadStorage = async () => {
        try {
            await reloadProgress();
            const { storedPlaylists,  filePaths} = await loadInitialNativeMetadata();
            if (storedPlaylists) {
                playlistManager.setSavedPlaylists(JSON.parse(storedPlaylists));
            }

            if(filePaths !== null && filePaths.length > 0){
                const scan = await scanNativePath(filePaths);
                const resultTracks = scan.tracks;
                setAllTracks(resultTracks);
            }
        } catch (e) {
            console.error("Storage load error", e);
        } finally {
            setIsStorageLoaded(true);
        }
    };

    const clearStorage = () => {
        playlistManager.setSavedPlaylists([]);
        reloadProgress().then()
        setAllTracks([])
    }

    // ------------------------------------------------
    // Initial load
    // ------------------------------------------------

    useEffect(() => {
        if (!isStorageLoaded){
            checkLocalStorageAvailable()
                .then(response => {
                    if(response !== null)
                        pickDirectory({}).then(r => {
                            loadStorage().then(() => setView('library'));
                        }).then()
                }).then()
        }
    }, [isStorageLoaded]);

    // ------------------------------------------------
    // Metadata logic (unchanged)
    // ------------------------------------------------
    const getAssociatedPlaylists = (trackName: string) =>
        playlistManager.savedPlaylists
            .filter((p) => p.trackNames.includes(trackName))
            .map((p) => p.name);

    const handleOpenMetadata = async (track?: Track) => {
        let targetTrack = track as Track | null;

        if (targetTrack !== undefined && targetTrack?.name === undefined) {
            targetTrack = player.audioState.name ? {
                name: player.audioState.name,
                audioPath: player.audioState.path
            } as Track : null
        }

        if (!targetTrack) return;

        const progress = progressMap[targetTrack.name];

        const stats = await getFileSize(targetTrack.audioPath).then()

        setMetadataPanelData({
            name: targetTrack.name,
            fileSize: stats,
            lastModified: Date.now(),
            duration: progress?.duration || (track ? 0 : player.duration),
            associatedPlaylists: getAssociatedPlaylists(targetTrack.name),
        });
    };

    const playTrackWrapper = (
        track: Track,
        index: number,
        specificPlaylist?: Track[]
    ) => {
        player.playTrack(track, index, specificPlaylist || [track]).then();
        handleTransition()
    };

    const handleTransition = useCallback(() => {
        translateY.value = 300;
        setPlayerMode("full");
        translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
    },[])

    const showMiniPlayer =
        (view !== "setup" || !!player.audioState.coverUrl) && playerMode === "mini";

    const translateY = useSharedValue(0);

    const openPlayer = () => {
        translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
    };

    const closePlayer = () => {
        translateY.value = withSpring(300, { damping: 20, stiffness: 180 });
        runOnJS(setPlayerMode)("mini");
    };

// ------------------ GESTURE ------------------
    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationY > 0)
                translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (event.translationY > 120 || event.velocityY > 800) {
                runOnJS(closePlayer)();
            } else {
                openPlayer();
            }
        });

// ------------------ ANIMATED STYLE ------------------
    const sheetStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
        ],
    }));


    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content"/>

            {/* Main content area */}
            <View style={styles.mainContent}>
                <View
                    style={[
                        styles.screen,
                        view !== "setup" && styles.hiddenScreen,
                    ]}
                >
                    <Setup
                        onDirectoryUpload={handleDirectoryUpload}
                        isLoading={isLoading}
                    />
                </View>

                <View
                    style={[
                        styles.screen,
                        view !== "library" && styles.hiddenScreen,
                    ]}
                >
                    <SafeAreaView
                        edges={["top"]}
                        style={styles.safeAreaTopWrap}
                    >
                        <LibraryContainer
                            allTracks={allTracks}
                            progressMap={progressMap}
                            onSelectTrack={playTrackWrapper}
                            onViewMetadata={handleOpenMetadata}
                            playlistManager={playlistManager}
                            onUpdate={loadStorage}
                            clearStorage={clearStorage}
                            nativeRootPath={nativeRootPath}
                        />
                    </SafeAreaView>
                </View>

                <View
                    style={[
                        styles.screen,
                        view !== "albums" && styles.hiddenScreen,
                    ]}
                >
                    <SafeAreaView
                        edges={["top"]}
                        style={styles.safeAreaTopWrap}
                    >
                        <AlbumContainer
                            allTracks={allTracks}
                            progressMap={progressMap}
                            onUpdate={loadStorage}
                            onViewMetadata={handleOpenMetadata}
                            playlistManager={playlistManager}
                            onSelectTrack={playTrackWrapper}
                        />
                    </SafeAreaView>
                </View>

            </View>
            {playerMode === "full" && player.audioState.name && (
                <GestureDetector gesture={gesture}>
                    <Animated.View
                        style={[
                            styles.playerOverlay,
                            sheetStyle,
                            { paddingTop: insets.top },
                        ]}
                    >
                        <PlayerContainer
                            audioState={player.audioState}
                            subtitleState={player.subtitleState}
                            isPlaying={player.isPlaying}
                            currentTime={player.currentTime}
                            duration={player.duration}
                            currentTrackIndex={player.currentTrackIndex}
                            playlistLength={player.playlist.length}
                            onNext={player.next}
                            onPrevious={player.previous}
                            onSkipForward={player.skipForward}
                            onSkipBackward={player.skipBackward}
                            onExpand={() => setPlayerMode("full")}
                            onBack={() => closePlayer()}
                            onTogglePlay={player.togglePlay}
                            onSeek={player.seek}
                            onSubtitleClick={player.jumpToTime}
                            onOpenMetadata={handleOpenMetadata}
                            onSegmentChange={player.changeSegment}
                        />
                    </Animated.View>
                </GestureDetector>
            )}

            {/* Metadata Panel */}
            <MetadataPanel
                data={metadataPanelData}
                onClose={() => setMetadataPanelData(null)}
            />

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                {showMiniPlayer && (
                    <MiniPlayer
                        coverUrl={player.audioState.coverPath || ""}
                        name={player.audioState.name}
                        isPlaying={player.isPlaying}
                        onTogglePlay={player.togglePlay}
                        progress={
                            player.duration > 0
                                ? (player.currentTime / player.duration) * 100
                                : 0
                        }
                        onOpen={() => {
                            handleTransition()
                        }}
                    />
                )}

                <View style={styles.tabRow}>
                    <TabButton
                        label="Sync"
                        active={view === "setup"}
                        onPress={() => setView("setup")}
                    />
                    <TabButton
                        label="Library"
                        active={view === "library"}
                        onPress={() => setView("library")}
                    />
                    <TabButton
                        label="Playlists"
                        active={view === "albums"}
                        onPress={() => setView("albums")}
                    />
                </View>
            </View>
        </View>
    );
};

const TabButton: React.FC<{
    label: string;
    active: boolean;
    onPress: () => void;
}> = ({label, active, onPress}) => (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
            {label}
        </Text>
        <View
            style={[styles.tabUnderline, active && styles.tabUnderlineActive]}
        />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#050505",
    },
    mainContent: {
        flex: 1,
    },
    /** Screen switching (zero re-mount lag) */
    screen: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    hiddenScreen: {
        opacity: 0,
        pointerEvents: "none",
    },

    flex1: {
        flex: 1,
    },

    safeAreaTopWrap: {
        flex: 1,
        backgroundColor: "#000",
    },

    /** Overlay player */
    playerOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
    },

    /** Bottom Bar */
    bottomBar: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#222",
        backgroundColor: "#111",
    },
    tabRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: 15,
        height: 70,
        paddingBottom: 10,
    },
    tabButton: {
        alignItems: "center",
        width: 80,
        height: 30,
    },
    tabLabel: {
        fontSize: 21,
        fontWeight: "600",
        color: "#777",
    },
    tabLabelActive: {
        color: "#ffffff",
    },
    tabUnderline: {
        marginTop: 4,
        height: 2,
        width: "100%",
        backgroundColor: "transparent",
    },
    tabUnderlineActive: {
        backgroundColor: "#FF8300",
    },
    screenContainer: {
        flex: 1,
    },
    hidden: {
        display: "none",
    },
    toastContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        borderRadius: 6,
        backgroundColor: "#fff",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    toastTextContainer: {
        flex: 1,
    },
    toastMessage: {
        color: "#000",
        fontSize: 14,
    },
    toastSubMessage: {
        color: "#e0e0e0",
        marginTop: 2,
        fontSize: 13,
    },
    toastAction: {
        color: "#BB86FC", // Paper accent color
        fontWeight: "600",
        marginLeft: 16,
    },
});

export const toastConfig: ToastConfig = {
    snackbar: ({ text1, text2, props }) => (
        <View style={styles.toastContainer}>
            <View style={styles.toastTextContainer}>
                <Text style={styles.toastMessage}>{text1}</Text>
                {text2 ? <Text style={styles.toastSubMessage}>{text2}</Text> : null}
            </View>

            {props?.action ? (
                <TouchableOpacity onPress={props.action.onPress}>
                    <Text style={styles.toastAction}>{props.action.label}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    ),
};

export default function App() {
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <SafeAreaProvider>
                <MenuProvider>
                    <AppContent/>
                    <Toast config={toastConfig} visibilityTime={1000} topOffset={120}  />
                </MenuProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
