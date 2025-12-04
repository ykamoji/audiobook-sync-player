import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';
import { Track, AppData } from './types.ts';
import { Platform } from 'react-native';

// Valid extensions
const AUDIO_EXTS = ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'];
const SUBTITLE_EXTS = ['.srt', '.vtt'];
const COVER_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

const getExtension = (file: string) =>
    file.substring(file.lastIndexOf('.')).toLowerCase();

const getBaseName = (name: string) =>
    name.substring(0, name.lastIndexOf('.'));

const sortTracks = (tracks: Track[]) =>
    tracks.sort((a, b) => {
        const getNum = (str: string) => {
            const m = str.match(/(\d+)/);
            return m ? parseInt(m[0], 10) : null;
        };
        const A = getNum(a.name);
        const B = getNum(b.name);
        if (A !== null && B !== null && A !== B) return A - B;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

/**
 * scanNativePath()
 * ------------------------
 * React Native version of your Capacitor-native scanner.
 * Receives a list of URIs from DocumentPicker and processes them.
 */
export const scanNativePath = async (
    fileUris: string[]
): Promise<{
    tracks: Track[];
    metadata?: AppData;
    colorMap: Map<string, string>;
}> => {
    const audioMap = new Map<string, string>();
    const subtitleMap = new Map<string, string>();
    const coverMap = new Map<string, string>();
    let metadata: AppData | undefined = undefined;
    let colorMap: Map<string, string> = new Map();

    for (const uri of fileUris) {
        // Convert "content://" uris to actual file paths for RNFS
        let path = uri;
        if (uri.startsWith('content://')) {
            const stat = await RNFS.stat(uri);
            path = stat.path; // real absolute path
        }

        const name = path.split('/').pop() || '';
        const ext = getExtension(name);

        // Metadata JSON
        if (name === 'metadata.json') {
            try {
                const text = await RNFS.readFile(path, 'utf8');
                metadata = JSON.parse(text);
            } catch (e) {
                console.warn('Failed to parse metadata.json', e);
            }
            continue;
        }

        // Color Map
        if (name === 'colorMap.json') {
            try {
                const text = await RNFS.readFile(path, 'utf8');
                const obj = JSON.parse(text);
                colorMap = new Map(Object.entries(obj));
            } catch (e) {
                console.warn('Failed to parse colorMap.json', e);
            }
            continue;
        }

        // Audio File
        if (AUDIO_EXTS.includes(ext)) {
            audioMap.set(name, path);
            continue;
        }

        // Subtitle file
        if (SUBTITLE_EXTS.includes(ext)) {
            subtitleMap.set(name, path);
            continue;
        }

        // Cover image
        if (COVER_EXTS.includes(ext)) {
            coverMap.set(name, path);
            continue;
        }
    }

    // Pair audio files with subtitles + cover
    const tracks: Track[] = [];

    audioMap.forEach((path, filename) => {
        const base = getBaseName(filename);

        let subtitlePath: string | undefined = undefined;
        for (const sub of SUBTITLE_EXTS) {
            const match = `${base}${sub}`;
            if (subtitleMap.has(match)) {
                subtitlePath = subtitleMap.get(match)!;
                break;
            }
        }

        let coverPath: string | undefined = undefined;
        for (const cover of COVER_EXTS) {
            const match = `${base}${cover}`;
            if (coverMap.has(match)) {
                coverPath = coverMap.get(match)!;
                break;
            }
        }

        tracks.push({
            id: uuid.v4().toString(),
            name: base,
            audioPath: path,
            subtitlePath,
            coverPath,
        });
    });

    return {
        tracks: sortTracks(tracks),
        metadata,
        colorMap,
    };
};