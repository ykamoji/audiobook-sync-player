import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

import { Playlist, Track } from '../utils/types'

export const usePlaylistManager = (isStorageLoaded: boolean) => {
    const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);

    const persistPlaylists = async (updated_playlist:Playlist[]) => {
        await AsyncStorage.setItem(
            'audiobook_playlists',
            JSON.stringify(updated_playlist)
        )
    }

    const isPlaylistNameTaken = (name: string) => {
        const lower = name.trim().toLowerCase();
        return savedPlaylists.some(p => p.name.trim().toLowerCase() === lower);
    };

    const createPlaylist = (name: string, initialTracks: Track[]) => {

        const newPlaylist: Playlist = {
            id: uuid.v4().toString(),
            name,
            trackNames: initialTracks.map(t => t.name),
            createdAt: Date.now(),
        };
        setSavedPlaylists(prev => {
            const updated = [...prev, newPlaylist]
            persistPlaylists(updated).then()
            return updated;
        });
    };

    const deletePlaylist = (playlistId: string) => {
        setSavedPlaylists(prev => {
            const updated = prev.filter(p => p.id !== playlistId);
            persistPlaylists(updated).then();
            return updated;
        });
    };

    const updatePlaylistName = (playlistId: string, newName: string) => {
        setSavedPlaylists(prev => {
            const updated = prev.map(p => (p.id === playlistId ? { ...p, name: newName } : p))
            persistPlaylists(updated).then()
            return updated;
        });
    };

    const addToPlaylist = (playlistId: string, track: Track) => {
        setSavedPlaylists(prev => {
            const updated = prev.map(p => {
                if (p.id !== playlistId) return p;
                if (p.trackNames.includes(track.name)) return p;
                return { ...p, trackNames: [...p.trackNames, track.name] };
            });
            persistPlaylists(updated).then();
            return updated;
        });
    };

    const addMultipleToPlaylist = (playlistId: string, tracks: Track[]) => {
        setSavedPlaylists(prev => {
            const updated = prev.map(p => {
                if (p.id !== playlistId) return p;

                const newNames = tracks
                    .map(t => t.name)
                    .filter(name => !p.trackNames.includes(name));

                if (newNames.length === 0) return p;

                return { ...p, trackNames: [...p.trackNames, ...newNames] };
            })
            persistPlaylists(updated).then()
            return updated;
        });
    };

    const removeFromPlaylist = (playlistId: string, trackName: string) => {
        setSavedPlaylists(prev => {
            const updated = prev.map(p =>
                p.id === playlistId
                    ? { ...p, trackNames: p.trackNames.filter(n => n !== trackName) }
                    : p
            );
            persistPlaylists(updated).then()
            return updated;
        });
    };

    const removeMultipleFromPlaylist = (playlistId: string, trackNames: string[]) => {
        setSavedPlaylists(prev => {
           const updated = prev.map(p =>
                p.id === playlistId
                    ? {
                        ...p,
                        trackNames: p.trackNames.filter(n => !trackNames.includes(n)),
                    }
                    : p
            );
            persistPlaylists(updated).then()
           return updated;
        });
        persistPlaylists(savedPlaylists).then()
    };

    return {
        savedPlaylists,
        setSavedPlaylists,
        isPlaylistNameTaken,
        createPlaylist,
        deletePlaylist,
        updatePlaylistName,
        addToPlaylist,
        addMultipleToPlaylist,
        removeFromPlaylist,
        removeMultipleFromPlaylist,
    };
};