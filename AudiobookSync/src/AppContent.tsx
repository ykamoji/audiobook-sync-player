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
import {Setup} from "./components/Setup";
import {LibraryContainer} from "./components/LibraryContainer";
import {PlayerContainer} from "./components/PlayerContainer";
import {
    MetadataPanel,
    MetadataPanelData,
} from "./components/MetadataPanel";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS, interpolate,
} from "react-native-reanimated";
import { Provider as PaperProvider } from 'react-native-paper';
import {MiniPlayer} from "./components/MiniPlayer";
import {Track, AppData} from "./utils/types";
import {loadInitialNativeMetadata} from "./utils/persistence";
import {usePlaylistManager} from "./hooks/usePlaylistManager";
import {useProgressManager} from "./hooks/useProgressManager";
import {useLibrary} from "./hooks/useLibrary";
import {usePlayer} from "./hooks/usePlayer";
import TrackPlayer, {Capability} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {scanNativePath} from "./utils/fileScanner.ts";
import {savePlaylist, checkLocalStorageAvailable} from "./utils/persistence";
import {AlbumContainer} from "./components/AlbumContainer.tsx";
import Toast, {ToastConfig} from "react-native-toast-message";

let isPlayerInitialized = false;

export const setupPlayer = async () => {

    if (isPlayerInitialized) return;
    isPlayerInitialized = true;
    try {
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
    }catch (e) {

    }
};

type ViewName = "setup" | "library" | "albums";
type PlayerMode = "mini" | "full";

const getFileSize = async (path: string): Promise<number> => {
    const cleanPath = decodeURI(path.replace("file://", ""));
    const stat = await RNFS.stat(cleanPath);
    return Number(stat.size);
};

const MainContent: React.FC = () => {
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

    const {allTracks, setAllTracks, isLoading, handleDirectoryUpload} =
        useLibrary({
            onMetadataLoaded: (data: AppData) => applyMetadata(data),
            onUploadSuccess: () => setView("library"),
            onReloadFromStorage: () => onReloadFromStorage()
        });

    useEffect(() => {
        setupPlayer().then();
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

    const onReloadFromStorage = () => {
        if (!isStorageLoaded){
            checkLocalStorageAvailable()
                .then((response) => {
                    if(response !== null)
                        pickDirectory({}).then(() => {
                            loadStorage().then(() => setView('library'));
                        })
                })
            return true
        }
        return false
    }

    // ------------------------------------------------
    // Metadata logic
    // ------------------------------------------------
    const getAssociatedPlaylists = (trackName: string) =>
        playlistManager.savedPlaylists
            .filter((p: { trackNames: string | string[]; }) => p.trackNames.includes(trackName))
            .map((p: { name: any; }) => p.name);


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

    const closePlayer = () => {
        translateY.value = withSpring(300, { damping: 20, stiffness: 180 });
        runOnJS(setPlayerMode)("mini");
    };


    const sheetStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
        ],
    }));

    const bottomBarTranslateY = useSharedValue(0);

    useEffect(() => {
        if (playerMode === "full") {
            bottomBarTranslateY.value = withSpring(120, {
                damping: 22,
                stiffness: 80,
                mass: 0.7,
            });
        } else {
            bottomBarTranslateY.value = withSpring(0, {
                damping: 15,
                stiffness: 150,
                mass: 0.5,
            });
        }
    }, [playerMode]);

    const bottomBarStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bottomBarTranslateY.value }],
        opacity: interpolate(
            bottomBarTranslateY.value,
            [0, 110],
            [1, 0],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            }
        ),
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
                        edges={['top']}
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
                        edges={['top']}
                        style={styles.safeAreaTopWrap}
                    >
                        <AlbumContainer
                            allTracks={allTracks}
                            progressMap={progressMap}
                            onUpdate={loadStorage}
                            closeAlbums={view === "albums"}
                            onViewMetadata={handleOpenMetadata}
                            playlistManager={playlistManager}
                            onSelectTrack={playTrackWrapper}
                        />
                    </SafeAreaView>
                </View>
            </View>
            {playerMode === "full" && player.audioState.name && (
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
                            onBack={() => closePlayer()}
                            onTogglePlay={player.togglePlay}
                            onSeek={player.seek}
                            onSubtitleClick={player.jumpToTime}
                            onOpenMetadata={handleOpenMetadata}
                            onSegmentChange={player.changeSegment}
                        />
                    </Animated.View>
            )}

            {/* Metadata Panel */}
            <MetadataPanel
                data={metadataPanelData}
                onClose={() => setMetadataPanelData(null)}
            />

            {/* Bottom Bar */}
            <Animated.View style={[styles.bottomBar, bottomBarStyle]}>
                {showMiniPlayer && (
                    <MiniPlayer
                        coverUrl={player.audioState.coverPath || ""}
                        name={player.audioState.name}
                        // albumName={}
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
            </Animated.View>
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

export default function AppContent() {
    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <SafeAreaProvider>
                <PaperProvider>
                    <MainContent/>
                    <Toast config={toastConfig} visibilityTime={1000} topOffset={120}  />
                </PaperProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
