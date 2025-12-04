import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {AppData} from './types.ts';

/**
 * Save metadata (progress, playlists, settings) to device storage.
 * Uses AsyncStorage
 */
export const saveToNativeFilesystem = async (data: AppData, rootPath?: string) => {
    try {
        await AsyncStorage.setItem("metadata", JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("Error saving metadata", e);
        return false;
    }
};

/**
 * Load stored metadata from device.
 */
export const loadInitialNativeMetadata = async (): Promise<AppData | null> => {
    try {
        const value = await AsyncStorage.getItem("metadata");
        if (!value) return null;
        return JSON.parse(value);
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