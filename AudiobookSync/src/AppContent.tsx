import React, {useCallback, useEffect, useRef, useState} from "react";
import {SafeAreaProvider, SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {StatusBar, StyleSheet, Text, TouchableOpacity, View,} from "react-native";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {pickDirectory} from "react-native-document-picker";
import {Setup} from "./components/Setup";
import {LibraryContainer} from "./components/LibraryContainer";
import {MetadataPanel, MetadataPanelData,} from "./components/MetadataPanel";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import {Provider as PaperProvider} from 'react-native-paper';
import {AppData, ProgressData, Track} from "./utils/types";
import {checkLocalStorageAvailable, loadInitialNativeMetadata, savePlaylist} from "./utils/persistence";
import {usePlaylistManager} from "./hooks/usePlaylistManager";
import {useProgressManager} from "./hooks/useProgressManager";
import {useLibrary} from "./hooks/useLibrary";
import TrackPlayer, {Capability, IOSCategory, IOSCategoryOptions, IOSCategoryMode} from 'react-native-track-player';
import {scanNativePath} from "./utils/fileScanner.ts";
import {AlbumContainer} from "./components/AlbumContainer.tsx";
import Toast, {ToastConfig} from "react-native-toast-message";
import {Library, ListMusic, RefreshCw} from "lucide-react-native";
import {PlayerView, PlayerViewRef} from "./components/PlayerView.tsx";
import { PlayerProvider } from "./services/PlayerProvider.tsx";
import {usePlayerContext} from "./services/PlayerContext.tsx";
import {useStaticData} from "./hooks/useStaticData.tsx";

export const setupPlayer = async () => {

    try {
        await TrackPlayer.setupPlayer(
            {
                iosCategory:IOSCategory.Playback,
                iosCategoryMode: IOSCategoryMode.SpokenAudio,
                iosCategoryOptions: [
                    IOSCategoryOptions.AllowBluetoothA2DP,
                    IOSCategoryOptions.AllowAirPlay,
                ]
            }
        );
        await TrackPlayer.updateOptions({
            progressUpdateEventInterval: 1,
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
        // console.error(e);
    }
};

type ViewName = "setup" | "library" | "albums";
export type PlayerMode = "mini" | "full";

const MainContent: React.FC = () => {


    // --- Global View State ---
    const [view, setView] = useState<ViewName>("setup");
    const [playerMode, setPlayerMode] = useState<PlayerMode>("mini");
    const [isStorageLoaded, setIsStorageLoaded] = useState(false);

    const [metadataPanelData, setMetadataPanelData] =
        useState<MetadataPanelData | null>(null);

    const playlistManager = usePlaylistManager(isStorageLoaded);

    const {progressMap, clearProgress, initProgress, saveProgress, reloadProgress} = useProgressManager()

    const onReloadFromStorage = async () => {
        if (isStorageLoaded) return false;
        const result = await checkLocalStorageAvailable();
        if (result === null) return false
        await pickDirectory({});
        await loadStorage();
        setView("library");
        return true;
    };

    const onMetadataLoaded = (data: AppData, tracks:Track[]) => {

        initProgress(data.audiobook_progress, tracks).then()

        if (data.audiobook_playlists) {
            playlistManager.setSavedPlaylists(data.audiobook_playlists);
            savePlaylist(data.audiobook_playlists).then();
        }

        if(data.static){
            updateStaticData(data.static)
        }

    };

    const loadStorage = async () => {
        try {
            const { storedPlaylists,  filePaths} = await loadInitialNativeMetadata();
            if (storedPlaylists) {
                playlistManager.setSavedPlaylists(JSON.parse(storedPlaylists));
            }

            const scan = await scanNativePath(filePaths);
            const resultTracks = scan.tracks;
            const appData = scan.appData;
            if (appData?.static) updateStaticData(appData.static)
            await reloadProgress(resultTracks);
            setAllTracks(resultTracks);

        } catch (e) {
            console.error("Storage load error", e);
        } finally {
            setIsStorageLoaded(true);
        }
    };

    const {allTracks, setAllTracks, isLoading, handleDirectoryUpload} =
        useLibrary({
            onMetadataLoaded,
            onUploadSuccess: () => setView("library"),
            onReloadFromStorage
        });

    const { preparePanelData, updateStaticData } = useStaticData();

    useEffect(() => {
        setupPlayer().then();
    }, []);

    const playerRef = useRef<PlayerViewRef>(null);
    const progressMapRef =  useRef<Record<string, ProgressData>>({});

    useEffect(() => {
        progressMapRef.current = progressMap
    }, [progressMap]);


    const { dispatch } = usePlayerContext();

    const clearStorage = () => {

        dispatch({
            type: "LOAD_TRACK",
            playlist: [],
            index:0,
            audio: {name:'', path:'', coverPath:'', coverUrl:''},
            subtitle: {name:'', path:'', cues:[], markers:[], totalSegments:0},
            isPlaying: false,
        });

        playlistManager.setSavedPlaylists([]);
        clearProgress()
        setAllTracks([])
    }

    // ------------------------------------------------
    // Metadata logic
    // ------------------------------------------------
    const getAssociatedPlaylists = (trackName: string) =>
        playlistManager.savedPlaylists
            .filter((p: { trackNames: string | string[]; }) => p.trackNames.includes(trackName))
            .map((p: { name: any; }) => p.name);


    const handleOpenMetadata = (async (name: string) => {

        const progressData = progressMap[name];

        const staticData = preparePanelData(name)
        setMetadataPanelData({
            name,
            progress: progressData?.currentTime,
            associatedPlaylists: getAssociatedPlaylists(name),
            static: staticData
        });
    });

    const playTrackWrapper = (
        track: Track,
        index: number,
        specificPlaylist?: Track[],
        option?: number
    ) => {
        if (playerRef.current) {
            // console.log('playTrackWrapper ', option, state.isPlaying);
            playerRef.current!.playTrack(track, index, specificPlaylist || [track], option!).then();

            setTimeout(()=> {
                if (option === 2) {
                    setPlayerMode('full')
                }
            }, 800)

            // setTimeout(()=> {
            //     if (!state.isPlaying) {
                    // console.log('delayed updates')
                    playerRef.current!.savePlayerProgress()
                // }
            // }, 500)

        }
    };

    const bottomBarTranslate = useSharedValue(0);

    useEffect(() => {
        bottomBarTranslate.value = withSpring(
            playerMode === "mini" ? 0 : 70,
            { stiffness: 60, damping: 20 }
        );
    }, [playerMode]);

    const bottomStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: bottomBarTranslate.value }]
    }));

    // console.log('Main rendering')

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
            <PlayerView
                ref={playerRef}
                progressMapRef={progressMapRef}
                saveProgress={saveProgress}
                playerMode={playerMode}
                onBack={setPlayerMode}
                onOpenMetadata={handleOpenMetadata}
            />
            {/* Metadata Panel */}
            <MetadataPanel
                data={metadataPanelData}
                onClose={() => setMetadataPanelData(null)}
            />

            {/* Bottom Bar */}
            <Animated.View style={[styles.bottomBar, bottomStyle]}>
                <View style={styles.tabRow}>
                    <TabButton
                        label="Sync"
                        icon={RefreshCw}
                        active={view === "setup"}
                        onPress={() => setView("setup")}
                    />
                    <TabButton
                        label="Library"
                        icon={Library}
                        active={view === "library"}
                        onPress={() => setView("library")}
                    />
                    <TabButton
                        label="Playlists"
                        icon={ListMusic}
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
    icon: any;
    active: boolean;
    onPress: () => void;
}> = ({ label, icon: Icon, active, onPress }) => (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}  activeOpacity={0.8}>
        <View style={styles.iconRow}>
            <Icon
                size={20}
                color={active ? "#fff" : "#888"}
                style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {label}
            </Text>
        </View>
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

    playerOverlay: {
        position: "relative",
        zIndex: 50,
    },

    /** Bottom Bar */
    bottomBar: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#222",
        backgroundColor: "#111",
        position:'relative',
        zIndex:100
    },
    tabRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: 15,
        height: 75,
    },
    tabButton: {
        alignItems: "center",
        width: 80,
        height: 30,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#777",
    },
    tabLabelActive: {
        color: "#ffffff",
    },
    iconRow: {
        flexDirection: "column",
        alignItems: "center",
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
                    <PlayerProvider>
                        <MainContent/>
                    </PlayerProvider>
                    <Toast config={toastConfig} visibilityTime={1000} topOffset={120}  />
                </PaperProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
