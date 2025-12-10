import {AudioFileState, SubtitleFileState, Track} from "../utils/types.ts";
import {createContext, useContext, useReducer} from "react";

export type PlayerState = {
    playlist: Track[];
    currentTrackIndex: number;
    audioState: AudioFileState;
    subtitleState: SubtitleFileState;
    isPlaying: boolean;
};

export type Action =
    | { type: "LOAD_TRACK"; playlist: Track[]; index: number; audio: AudioFileState; subtitle: SubtitleFileState }
    | { type: "SET_PLAYING"; playing: boolean }


type PlayerContextValue = {
    state: PlayerState;
    dispatch: React.Dispatch<Action>;
};


export const PlayerContext = createContext<PlayerContextValue | null>(null);


export const usePlayerContext = () => {
    const ctx = useContext(PlayerContext);
    if (!ctx) {
        throw new Error("usePlayerContext must be used inside PlayerProvider");
    }
    return ctx;
};