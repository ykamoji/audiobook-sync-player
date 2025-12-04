import { useState, useRef } from 'react';
import DocumentPicker, { types } from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Track, AppData } from '../utils/types';
import { scanNativePath } from '../utils/fileScanner';

interface UseLibraryProps {
    onMetadataLoaded: (data: AppData) => void;
    onUploadSuccess: () => void;
}

export const useLibrary = ({ onMetadataLoaded, onUploadSuccess }: UseLibraryProps) => {
    const [allTracks, setAllTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const nativeRootPathRef = useRef<string>('');

    const handleDirectoryUpload = async () => {
        setIsLoading(true);

        try {
            // Works on all DocumentPicker versions
            const results = await DocumentPicker.pick({
                allowMultiSelection: true,
                presentationStyle: 'fullScreen',
                type: [types.allFiles],
                mode: 'open',
            });

            const filePaths = results
                .map(f => f.uri)
                .filter(Boolean);

            // Scan selected files
            const scan = await scanNativePath(filePaths);

            const resultTracks = scan.tracks;
            const resultMetadata = scan.metadata;
            const resultColorMap = scan.colorMap;

            if (resultMetadata) onMetadataLoaded(resultMetadata);

            setAllTracks(resultTracks);

            // Save color map (converted to plain object)
            await AsyncStorage.setItem(
                'colorMap',
                JSON.stringify(Object.fromEntries(resultColorMap))
            );

            if (resultTracks.length > 0) {
                onUploadSuccess();
            } else {
                console.log('No audio files found.');
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                console.error('Upload error:', err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        allTracks,
        isLoading,
        nativeRootPath: nativeRootPathRef.current,
        handleDirectoryUpload,
    };
};