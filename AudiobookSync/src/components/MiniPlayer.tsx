import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';

import { PlayIcon, PauseIcon } from 'lucide-react-native';

interface MiniPlayerProps {
    coverUrl: string;
    name: string;
    isPlaying: boolean;
    progress: number; // 0–100
    onTogglePlay: () => void;
    onOpen: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
                                                          coverUrl,
                                                          name,
                                                          isPlaying,
                                                          progress,
                                                          onTogglePlay,
                                                          onOpen,
                                                      }) => {
    const safeName = name || 'Now Playing';

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.container}
            onPress={onOpen}
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
                {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.cover} />
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
                    <PauseIcon size={24} color="#fff" />
                ) : (
                    <PlayIcon size={24} color="#fff" />
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 68,
        backgroundColor: '#111',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.18)',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cover: {
        width: 46,
        height: 46,
        borderRadius: 8,
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
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        color: '#888',
        fontSize: 11,
        marginTop: 2,
    },
    playButton: {
        padding: 8,
        borderRadius: 999,
    },
    progressTrack: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#f97316',
    },
});