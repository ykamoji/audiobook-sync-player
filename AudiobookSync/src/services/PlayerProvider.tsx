import React, { useReducer } from "react";
import { PlayerContext , PlayerState, Action } from "./PlayerContext";

export const reducer = (state: PlayerState, action: Action): PlayerState => {
    switch (action.type) {
        case "LOAD_TRACK":
            return {
                ...state,
                playlist: action.playlist,
                currentTrackIndex: action.index,
                audioState: action.audio,
                subtitleState: action.subtitle,
            };
        case "SET_PLAYING":
            return { ...state, isPlaying: action.playing };
        default:
            return state;
    }
};

export const initialPlayerState: PlayerState = {
    playlist: [],
    currentTrackIndex: -1,
    audioState: { path: null, name: "", coverUrl: null },
    subtitleState: { path: null, cues: [], name: "", markers: [], totalSegments: 0 },
    isPlaying: false,
};


export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialPlayerState);

    return (
        <PlayerContext.Provider value={{ state, dispatch }}>
            {children}
        </PlayerContext.Provider>
    );
};
