import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppData, Playlist} from './types.ts';

/**
 * Save metadata (progress, playlists, settings) to device storage.
 * Uses AsyncStorage
 */
export const saveToNativeFilesystem = async (data: AppData) => {
    try {
        const { audiobook_progress, audiobook_playlists } = data
        await AsyncStorage.setItem("audiobook_progress", JSON.stringify(audiobook_progress))
        await savePlaylist(audiobook_playlists)
        return true;
    } catch (e) {
        console.error("Error saving metadata", e);
        return false;
    }
};

export const savePlaylist = async (playlists: Playlist[]) => {
    try{
        await AsyncStorage.setItem("audiobook_playlists", JSON.stringify(playlists))
    }catch (e){
        console.error("Error saving playlist", e);
    }
}

export const checkLocalStorageAvailable = async () => {
    try{
        return await AsyncStorage.getItem('filePaths')
    }catch (e){
        console.error("Error checking local storage", e);
    }
}


/**
 * Load stored metadata from device.
 */
export const loadInitialNativeMetadata = async (): Promise<{
    playlists: Playlist[],
    filePaths: string[],
}> => {
    try {
        const storedPlaylists = await AsyncStorage.getItem("audiobook_playlists")

        const playlists: Playlist[] = storedPlaylists !== null ? JSON.parse(storedPlaylists): []

        const reload_files: string | null = await AsyncStorage.getItem('filePaths')

        const filePaths: string[] = reload_files !== null ? JSON.parse(reload_files) : []

        return { playlists,  filePaths}

    } catch (e) {
        console.warn("Failed to load metadata", e);
        return { playlists: [],  filePaths: [] }
    }
};