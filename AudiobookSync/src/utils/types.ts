import {Static} from "../hooks/useStaticData.ts";

export interface SubtitleCue {
    id: number;
    start: number; // seconds
    end: number;   // seconds
    text: string;
    isEdited?: boolean;
}

export interface Track {
    coverFile: string | undefined;
    id: string;
    name: string;

    // Local filesystem paths (React Native)
    audioPath: string;        // Required
    subtitlePath?: string;    // Optional
    coverPath?: string;       // Optional
    // colorScheme?: object;
    // audioSize: number;
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

    // colorScheme?: string | null;
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
    percentage: number;
    updatedAt: number;
    segmentHistory?: Record<number, number>;
}

export interface AppData {
    audiobook_progress: Record<string, ProgressData>;
    audiobook_playlists: Playlist[];
    exportedAt: number;
    static: Record<string, Static>;
}