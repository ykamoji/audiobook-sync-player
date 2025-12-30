import { useState } from 'react';
import DocumentPicker, { types } from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, AppData } from '../utils/types';
import { scanNativePath } from '../utils/fileScanner';


interface UseLibraryProps {
    onMetadataLoaded: (data?: AppData, tracks?: Track[]) => Promise<void>;
    onUploadSuccess: () => void;
    onReloadFromStorage: () => Promise<boolean>;
    onCharacterLoaded: (data: Map<string, {path:string, scheme:object}>) => Promise<void>;
}

export const useLibrary = ({
                               onMetadataLoaded,
                               onUploadSuccess,
                               onReloadFromStorage,
                               onCharacterLoaded
                        }: UseLibraryProps) => {
    const [allTracks, setAllTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleDirectoryUpload = async () => {
        setIsLoading(true);

        try {

            const reloaded = await onReloadFromStorage()

            if (!reloaded) {

                // Works on all DocumentPicker versions
                const responses = await DocumentPicker.pick({
                    allowMultiSelection: true,
                    presentationStyle: 'fullScreen',
                    type: [types.allFiles],
                    mode: 'open',
                });

                const filePaths = responses
                    .map(f => f.uri)
                    .filter(Boolean);


                // Save the directory paths for library views
                await AsyncStorage.setItem(
                    'filePaths',
                    JSON.stringify(filePaths)
                );

                // Scan selected files
                const scan = await scanNativePath(filePaths);

                const tracks = scan.tracks;
                const appData = scan.appData;

                await onMetadataLoaded(appData, tracks);

                const characterPathMap = scan.characterPathMap;

                await onCharacterLoaded(characterPathMap);

                setAllTracks(tracks)

                if (tracks.length > 0) {
                    onUploadSuccess();
                } else {
                    console.log('No audio files found.');
                }
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
        setAllTracks,
        isLoading,
        handleDirectoryUpload,
    };
};