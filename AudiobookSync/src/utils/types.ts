export interface SubtitleCue {
    id: string;
    start: number; // seconds
    end: number;   // seconds
    text: string;
}

export interface Track {
    coverFile: string | undefined;
    id: string;
    name: string;

    // Local filesystem paths (React Native)
    audioPath: string;        // Required
    subtitlePath?: string;    // Optional
    coverPath?: string;       // Optional
    colorScheme?: string;
}

export interface Playlist {
    id: string;
    name: string;
    trackNames: string[];
    createdAt: number;
}

export interface AudioFileState {
    /** Absolute file path on device (iOS/Android) */
    path: string | null;

    /** Track title */
    name: string;

    coverUrl?: string | null;

    /** Cover image path */
    coverPath?: string | null;

    colorScheme?: string | null;
}

export interface SubtitleFileState {
    /** Absolute subtitle file path */
    path: string | null;
    cues: SubtitleCue[];
    name: string;

    markers:number[]
    totalSegments: number
}

export interface ProgressData {
    currentTime: number;
    duration: number;
    percentage: number;
    updatedAt: number;
    segmentHistory?: Record<number, number>;
}

export interface AppData {
    progress: Record<string, ProgressData>;
    playlists: Playlist[];
    exportedAt: number;
}