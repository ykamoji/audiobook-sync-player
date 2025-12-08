import RNFS from 'react-native-fs';
import {Track, AudioFileState, SubtitleFileState, SubtitleCue} from './types';
import { parseSubtitleText } from './parser';

const CUES_PER_SEGMENT = 100;

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
        markers: [],
        totalSegments:0
    };

    if (track.subtitlePath) {
        try {
            // Read subtitle file from filesystem
            const text = await RNFS.readFile(track.subtitlePath, 'utf8');

            const cues = parseSubtitleText(text);

            const markers: number[] = [];

            const totalSegments = Math.ceil(cues.length / CUES_PER_SEGMENT)

            if (cues.length){
                for (let i = 1; i < totalSegments; i++) {
                    const cueIndex = i * CUES_PER_SEGMENT;
                    if (cueIndex < cues.length) {
                        markers.push(cues[cueIndex].start);
                    }
                }
            }

            subtitleState = {
                path: track.subtitlePath,
                cues,
                name: 'subtitle',
                markers,
                totalSegments
            };

        } catch (err) {
            console.warn('Failed to read subtitle file', err);
        }
    }

    return { audioState, subtitleState };
};

/** ─────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────── */

const binarySearch = (cues:SubtitleCue[], time: number) => {
    let low = 0;
    let high = cues.length - 1;

    while (low <= high) {
        const mid = (low + high) >> 1;
        const cue = cues[mid];

        if (time < cue.start) {
            high = mid - 1;
        } else if (time > cue.end) {
            low = mid + 1;
        } else {
            return mid;
        }
    }

    return Math.max(0, Math.min(low, cues.length - 1));
};

export const findCueIndex = (() => {
    let lastIndex = 0;

    return (cues:SubtitleCue[], time:  number) => {
        if (!cues.length) return 0;

        const last = lastIndex;
        if (last < cues.length &&
            time >= cues[last].start &&
            time <= cues[last].end
        ) {
            return last;
        }

        if (cues[last] && time > cues[last].end) {
            let i = last + 1;
            while (i < cues.length && cues[i].end < time) i++;
            if (i < cues.length && time >= cues[i].start && time <= cues[i].end) {
                lastIndex = i;
                return i;
            }
        }

        const idx = binarySearch(cues, time);
        lastIndex = idx;
        return idx;
    };
})();

export const getSegmentIndex = (cueIndex: number) =>
    Math.floor(cueIndex / CUES_PER_SEGMENT);

export const getSegmentBounds = (cues: any[], segmentIndex: number, duration: number) => {
    if (!cues.length) return { start: 0, end: duration };

    const s = segmentIndex * CUES_PER_SEGMENT;
    const e = Math.min((segmentIndex + 1) * CUES_PER_SEGMENT - 1, cues.length - 1);

    return {
        start: cues[s]?.start ?? 0,
        end: cues[e]?.end ?? duration,
    };
};
