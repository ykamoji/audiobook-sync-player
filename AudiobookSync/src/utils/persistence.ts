import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {AppData, Playlist} from './types.ts';

/**
 * Save metadata (progress, playlists, settings) to device storage.
 * Uses AsyncStorage
 */
export const saveToNativeFilesystem = async (data: AppData, rootPath?: string) => {
    try {
        const { playlists, progress } = data
        await AsyncStorage.setItem("audiobook_progress", JSON.stringify(progress))
        await savePlaylist(playlists)
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


/**
 * Load stored metadata from device.
 */
export const loadInitialNativeMetadata = async (): Promise<any | null> => {
    try {
        const storedPlaylists = await AsyncStorage.getItem("audiobook_playlists")

        let reload_files: string | null = await AsyncStorage.getItem('filePaths')
        let filePaths = [] as string[]

        if (reload_files !== null) {
            filePaths = JSON.parse(reload_files) as string[]
        }

        return { storedPlaylists,  filePaths}

    } catch (e) {
        console.warn("Failed to load metadata", e);
        return null;
    }
};

/**
 * Read subtitle .txt/.srt files from RN filesystem.
 * Works with paths returned by DocumentPicker (content:// URIs need handling).
 */
export const readNativeTextFile = async (path: string): Promise<string> => {
    try {
        // Handles file:// paths
        if (path.startsWith("file://")) {
            return await RNFS.readFile(path.replace("file://", ""), 'utf8');
        }

        // Handles content:// paths (Android)
        if (path.startsWith("content://")) {
            return await RNFS.readFile(path, 'utf8');
        }

        throw new Error("Unsupported file path: " + path);
    } catch (error) {
        console.error("Failed to read native text file", error);
        throw error;
    }
};