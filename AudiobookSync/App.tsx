import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
    SafeAreaView,
    View,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Setup } from "./src/components/Setup";
import { LibraryContainer } from "./src/components/LibraryContainer";
import { PlayerContainer } from "./src/components/PlayerContainer";
import {
    MetadataPanel,
    MetadataPanelData,
} from "./src/components/MetadataPanel";
import { MiniPlayer } from "./src/components/MiniPlayer";

import { Track, AppData } from "./src/utils/types";
import { loadInitialNativeMetadata } from "./src/utils/persistence";
import { usePlaylistManager } from "./src/hooks/usePlaylistManager";
import { useProgressManager } from "./src/hooks/useProgressManager";
import { useLibrary } from "./src/hooks/useLibrary";
import { usePlayer } from "./src/hooks/usePlayer";

import TrackPlayer, { Capability } from 'react-native-track-player';

export const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();

    // @ts-ignore
    await TrackPlayer.updateOptions({
        // stopWithApp: false,
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
            Capability.SkipToNext
        ],
    });
};

type ViewName = "setup" | "titles" | "playlists";
type PlayerMode = "mini" | "full";

const App: React.FC = () => {
    // --- Global View State ---
    const [view, setView] = useState<ViewName>("setup");
    const [playerMode, setPlayerMode] = useState<PlayerMode>("mini");
    const [isStorageLoaded, setIsStorageLoaded] = useState(false);
    const [hasSystemMetadata, setHasSystemMetadata] = useState(false);

    // --- Settings ---
    const [isAutoPlay, setIsAutoPlay] = useState(false);

    const [metadataPanelData, setMetadataPanelData] =
        useState<MetadataPanelData | null>(null);

    // --- Custom Hooks ---
    const playlistManager = usePlaylistManager(isStorageLoaded);
    const { progressMap, setProgressMap, saveProgress, reloadProgress } =
        useProgressManager();

    const { allTracks, isLoading, nativeRootPath, handleDirectoryUpload } =
        useLibrary({
            onMetadataLoaded: (data: AppData) => applyMetadata(data),
            onUploadSuccess: () => setView("titles"),
        });

    useEffect(() => {
        setupPlayer().then();
    }, []);

    const player = usePlayer({
        isAutoPlay,
        progressMap,
        saveProgress,
    });

    // ------------------------------------------------
    // Apply metadata (from exported metadata.json / native metadata)
    // ------------------------------------------------
    const applyMetadata = (data: AppData) => {
        // Only apply "system" metadata once
        if (hasSystemMetadata) return;

        if (data.progress) {
            setProgressMap((prev) => {
                const newMap = { ...prev, ...data.progress };
                // persist merged progress
                AsyncStorage.setItem(
                    "audiobook_progress",
                    JSON.stringify(newMap)
                ).catch(() => {});
                return newMap;
            });
        }

        if (data.playlists) {
            playlistManager.setSavedPlaylists(data.playlists);
            AsyncStorage.setItem(
                "audiobook_playlists",
                JSON.stringify(data.playlists)
            ).catch(() => {});
        }

        if (data.settings) {
            if (data.settings.isAutoPlay !== undefined) {
                setIsAutoPlay(data.settings.isAutoPlay);
            }
        }

        setHasSystemMetadata(true);
        AsyncStorage.setItem("system_metadata", "true").catch(() => {});
    };

    // ------------------------------------------------
    // Initial load from AsyncStorage + native metadata
    // ------------------------------------------------
    useEffect(() => {
        const loadStorage = async () => {
            try {
                // 1. Progress
                await reloadProgress(); // your hook can read AsyncStorage internally

                // 2. Playlists
                const storedPlaylists = await AsyncStorage.getItem(
                    "audiobook_playlists"
                );
                if (storedPlaylists) {
                    try {
                        const parsed = JSON.parse(storedPlaylists);
                        playlistManager.setSavedPlaylists(parsed);
                    } catch {}
                }

                // 3. AutoPlay
                const storedAutoPlay = await AsyncStorage.getItem(
                    "audiobook_autoplay"
                );
                if (storedAutoPlay) {
                    try {
                        setIsAutoPlay(JSON.parse(storedAutoPlay));
                    } catch {}
                }

                // 4. system_metadata flag
                const systemFlag = await AsyncStorage.getItem("system_metadata");
                if (systemFlag === "true") {
                    setHasSystemMetadata(true);
                }

                // 5. Native metadata (if any)
                const nativeData = await loadInitialNativeMetadata();
                if (nativeData) {
                    applyMetadata(nativeData);
                }
            } catch (e) {
                console.error("Storage load error", e);
            } finally {
                setIsStorageLoaded(true);
            }
        };

        loadStorage().then();
    }, []);

    // Persist autoplay when it changes
    useEffect(() => {
        if (!isStorageLoaded) return;
        AsyncStorage.setItem(
            "audiobook_autoplay",
            JSON.stringify(isAutoPlay)
        ).catch(() => {});
    }, [isAutoPlay, isStorageLoaded]);

    // ------------------------------------------------
    // Metadata logic
    // ------------------------------------------------
    const getAssociatedPlaylists = (trackName: string) =>
        playlistManager.savedPlaylists
            .filter((p) => p.trackNames.includes(trackName))
            .map((p) => p.name);

    const handleOpenMetadata = (track?: Track) => {
        let targetTrack = track;

        if (!targetTrack) {
            if (player.audioState.name) {
                targetTrack = { id: "current", name: player.audioState.name, audioPath: player.audioState.path } as Track;
            }
        }

        if (!targetTrack) return;

        const progress = progressMap[targetTrack.name];
        setMetadataPanelData({
            name: targetTrack.name,
            fileSize: 0,
            lastModified: Date.now(),
            duration: progress?.duration || (track ? 0 : player.duration),
            associatedPlaylists: getAssociatedPlaylists(targetTrack.name),
        });
    };

    // ------------------------------------------------
    // Player control wrapper
    // ------------------------------------------------
    const playTrackWrapper = (
        track: Track,
        index: number,
        specificPlaylist?: Track[]
    ) => {
        player.playTrack(track, index, specificPlaylist || [track]).then();
        setPlayerMode("full");
    };

    // ------------------------------------------------
    // Render
    // ------------------------------------------------
    const showMiniPlayer =
        (view !== "setup" || !!player.audioState.coverUrl) &&
        player.audioState.name;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <SafeAreaView style={styles.root}>
                    <StatusBar barStyle="light-content" />

                    {/* Main content area */}
                    <View style={styles.mainContent}>
                        {view === "setup" && (
                            <View style={styles.flex1}>
                                <Setup
                                    onDirectoryUpload={handleDirectoryUpload}
                                    isLoading={isLoading}
                                />
                            </View>
                        )}

                        {(view === "titles" || view === "playlists") && (
                            <View style={styles.flex1}>
                                <LibraryContainer
                                    allTracks={allTracks}
                                    playlists={playlistManager.savedPlaylists}
                                    progressMap={progressMap}
                                    isAutoPlay={isAutoPlay}
                                    activeTab={view}
                                    onSelectTrack={playTrackWrapper}
                                    onToggleAutoPlay={() => setIsAutoPlay((p) => !p)}
                                    onViewMetadata={handleOpenMetadata}
                                    playlistActions={playlistManager}
                                    nativeRootPath={nativeRootPath}
                                />
                            </View>
                        )}
                    </View>

                    {/* Full Player */}
                    {playerMode === "full" && (
                        <View style={styles.playerOverlay}>
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
                                onBack={() => setPlayerMode("mini")}
                                onTogglePlay={player.togglePlay}
                                onSeek={player.seek}
                                onSubtitleClick={player.jumpToTime}
                                onOpenMetadata={handleOpenMetadata}
                                onSegmentChange={player.changeSegment}
                            />
                        </View>
                    )}

                    {/* Metadata Panel */}
                    <MetadataPanel
                        data={metadataPanelData}
                        onClose={() => setMetadataPanelData(null)}
                    />

                    {/* Mini Player + Tabs */}
                    <View style={styles.bottomBar}>
                        {showMiniPlayer && (
                            <MiniPlayer
                                coverUrl={player.audioState.coverUrl || ""}
                                name={player.audioState.name}
                                isPlaying={player.isPlaying}
                                onTogglePlay={player.togglePlay}
                                progress={
                                    player.duration > 0
                                        ? (player.currentTime / player.duration) * 100
                                        : 0
                                }
                                onOpen={() => setPlayerMode("full")}
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
                                active={view === "titles"}
                                onPress={() => setView("titles")}
                            />
                            <TabButton
                                label="Playlists"
                                active={view === "playlists"}
                                onPress={() => setView("playlists")}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
};

interface TabButtonProps {
    label: string;
    active: boolean;
    onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({
                                                 label,
                                                 active,
                                                 onPress,
                                             }) => (
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
        backgroundColor: "#050505", // your audible-bg
    },
    mainContent: {
        flex: 1,
    },
    flex1: {
        flex: 1,
    },
    playerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#000",
        zIndex: 50,
    },
    bottomBar: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#222",
        backgroundColor: "#111",
    },
    tabRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: 8,
        paddingBottom: 8,
    },
    tabButton: {
        alignItems: "center",
        width: 80,
    },
    tabLabel: {
        fontSize: 16,
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
        backgroundColor: "#FF8300", // audible-orange
    },
});

export default App;
