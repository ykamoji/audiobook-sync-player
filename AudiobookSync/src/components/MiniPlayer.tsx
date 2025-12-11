import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';

import { PlayIcon, PauseIcon, LucidePause } from 'lucide-react-native';
import {usePlayerContext} from "../services/PlayerContext.tsx";

interface MiniPlayerProps {
    progress: number; // 0–100
    onTogglePlay: () => void;
    onOpen: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
                                                          progress,
                                                          onTogglePlay,
                                                          onOpen,
                                                      }) => {

    const { state } = usePlayerContext()

    const { audioState, isPlaying } = state

    const safeName = audioState.name || 'Now Playing';

    let bgStyle = "rgba(" + (audioState.colorScheme ?? [255,131,0]) + ",0.60)";


    return (
        <TouchableOpacity
            style={[styles.container, {backgroundColor: bgStyle }]}
            onPress={onOpen}
            activeOpacity={1}
        >
            {/* PROGRESS BAR */}
            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${Math.max(0, Math.min(progress, 100))}%` },
                    ]}
                />
            </View>
            {/* LEFT: cover + text */}
            <View style={styles.left}>
                {audioState.coverPath ? (
                    <Image source={{ uri: audioState.coverPath }} style={styles.cover} />
                ) : (
                    <View style={styles.coverPlaceholder}>
                        <Text style={styles.coverPlaceholderText}>
                            {safeName.substring(0, 2).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={styles.textWrapper}>
                    <Text style={styles.title} numberOfLines={1}>
                        {safeName}
                    </Text>
                    {/*<Text style={styles.subtitle} numberOfLines={1}>*/}
                    {/*    Tap to open player*/}
                    {/*</Text>*/}
                </View>
            </View>

            {/* RIGHT: play / pause */}
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                }}
                style={styles.playButton}
            >
                {isPlaying ? (
                    <PauseIcon size={20} color="#fff" />
                ) : (
                    <PlayIcon size={20} color="#fff" />
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 70,
        backgroundColor: '#111',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,131,0,0.60)',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cover: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginLeft: 5,
        marginRight: 10,
    },
    coverPlaceholder: {
        width: 46,
        height: 46,
        borderRadius: 8,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    coverPlaceholderText: {
        color: '#aaa',
        fontSize: 14,
        fontWeight: '600',
    },
    textWrapper: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    subtitle: {
        color: '#888',
        fontSize: 11,
        marginTop: 2,
    },
    playButton: {
        padding: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
    },
    progressTrack: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: -2,
        height: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#f97316',
    },
});