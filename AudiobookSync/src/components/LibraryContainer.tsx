import React from 'react';
import { Library } from './Library';
import { Track, Playlist, AppData, ProgressData } from '../utils/types';


import { saveToNativeFilesystem } from '../utils/persistence';

interface LibraryContainerProps {
    allTracks: Track[];
    playlists: Playlist[];
    progressMap: Record<string, ProgressData>;
    isAutoPlay: boolean;
    activeTab: string;

    onSelectTrack: (track: Track, index: number, specificPlaylist?: Track[]) => void;
    onToggleAutoPlay: () => void;
    onViewMetadata: (track: Track) => void;

    playlistActions: {
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
                                                                      playlists,
                                                                      progressMap,
                                                                      isAutoPlay,
                                                                      activeTab,
                                                                      onSelectTrack,
                                                                      onToggleAutoPlay,
                                                                      onViewMetadata,
                                                                      playlistActions,
                                                                      nativeRootPath
                                                                  }) => {

    const [exportSuccess, setExportSuccess] = React.useState(false);

    const handleExportData = async () => {
        const data: AppData = {
            progress: progressMap,
            playlists: playlists,
            settings: { isAutoPlay },
            exportedAt: Date.now(),
        };

        // Use RN-only persistence (no Capacitor, no Web download)
        const saved = await saveToNativeFilesystem(data, nativeRootPath);

        if (saved) {
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 1000);
        }
    };

    return (
        <Library
            allTracks={allTracks}
            playlists={playlists}
            activeTab={activeTab}
            progressMap={progressMap}

            onSelectTrack={onSelectTrack}
            onViewMetadata={onViewMetadata}

            isAutoPlay={isAutoPlay}
            onToggleAutoPlay={onToggleAutoPlay}

            // Exporting
            onExportData={handleExportData}
            exportSuccess={exportSuccess}

            // Playlist actions
            onCreatePlaylist={playlistActions.createPlaylist}
            onAddToPlaylist={playlistActions.addToPlaylist}
            onAddMultipleToPlaylist={playlistActions.addMultipleToPlaylist}
            onDeletePlaylist={playlistActions.deletePlaylist}
            onUpdatePlaylistName={playlistActions.updatePlaylistName}
            onRemoveFromPlaylist={playlistActions.removeFromPlaylist}
            onRemoveMultipleFromPlaylist={playlistActions.removeMultipleFromPlaylist}
        />
    );
};