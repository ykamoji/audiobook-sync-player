import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

import { Playlist, Track } from '../utils/types'

export const usePlaylistManager = (isStorageLoaded: boolean) => {
    const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);

    // Save playlists when they change
    useEffect(() => {
        if (!isStorageLoaded) return;

        AsyncStorage.setItem(
            'audiobook_playlists',
            JSON.stringify(savedPlaylists)
        );
    }, [savedPlaylists, isStorageLoaded]);

    const createPlaylist = (name: string, initialTracks: Track[]) => {
        const newPlaylist: Playlist = {
            id: uuid.v4().toString(),
            name,
            trackNames: initialTracks.map(t => t.name),
            createdAt: Date.now(),
        };

        setSavedPlaylists(prev => [...prev, newPlaylist]);
    };

    const deletePlaylist = (id: string) => {
        setSavedPlaylists(prev => prev.filter(p => p.id !== id));
    };

    const updatePlaylistName = (id: string, newName: string) => {
        setSavedPlaylists(prev =>
            prev.map(p => (p.id === id ? { ...p, name: newName } : p))
        );
    };

    const addToPlaylist = (playlistId: string, track: Track) => {
        setSavedPlaylists(prev =>
            prev.map(p => {
                if (p.id !== playlistId) return p;
                if (p.trackNames.includes(track.name)) return p;

                return { ...p, trackNames: [...p.trackNames, track.name] };
            })
        );
    };

    const addMultipleToPlaylist = (playlistId: string, tracks: Track[]) => {
        setSavedPlaylists(prev =>
            prev.map(p => {
                if (p.id !== playlistId) return p;

                const newNames = tracks
                    .map(t => t.name)
                    .filter(name => !p.trackNames.includes(name));

                if (newNames.length === 0) return p;

                return { ...p, trackNames: [...p.trackNames, ...newNames] };
            })
        );
    };

    const removeFromPlaylist = (playlistId: string, trackName: string) => {
        setSavedPlaylists(prev =>
            prev.map(p =>
                p.id === playlistId
                    ? { ...p, trackNames: p.trackNames.filter(n => n !== trackName) }
                    : p
            )
        );
    };

    const removeMultipleFromPlaylist = (playlistId: string, trackNames: string[]) => {
        setSavedPlaylists(prev =>
            prev.map(p =>
                p.id === playlistId
                    ? {
                        ...p,
                        trackNames: p.trackNames.filter(n => !trackNames.includes(n)),
                    }
                    : p
            )
        );
    };

    return {
        savedPlaylists,
        setSavedPlaylists,
        createPlaylist,
        deletePlaylist,
        updatePlaylistName,
        addToPlaylist,
        addMultipleToPlaylist,
        removeFromPlaylist,
        removeMultipleFromPlaylist,
    };
};