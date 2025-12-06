import RNFS from 'react-native-fs';
import { Track, AudioFileState, SubtitleFileState } from '../utils/types';
import { parseSubtitleText } from './parser';

export const loadTrackMedia = async (
    track: Track
): Promise<{
    audioState: AudioFileState;
    subtitleState: SubtitleFileState;
}> => {
    // 1. Audio
    const audioState: AudioFileState = {
        path: track.audioPath || null,
        name: track.name,
        coverPath: track.coverPath || null,
    };

    // 2. Subtitles
    let subtitleState: SubtitleFileState = {
        path: null,
        cues: [],
        name: '',
    };

    if (track.subtitlePath) {
        try {
            // Read subtitle file from filesystem
            const text = await RNFS.readFile(track.subtitlePath, 'utf8');

            const cues = parseSubtitleText(text);

            subtitleState = {
                path: track.subtitlePath,
                cues,
                name: 'subtitle',
            };
        } catch (err) {
            console.warn('Failed to read subtitle file', err);
        }
    }

    return { audioState, subtitleState };
};