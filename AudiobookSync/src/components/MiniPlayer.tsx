import React, { FC, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MusicIcon, PauseIcon, PlayIcon } from './Icons';

interface MiniProps {
    coverUrl: string | null;
    name: string;
    isPlaying: boolean;
    progress: number; // 0–100
    onTogglePlay: () => void;
    onOpen: () => void;
}

export const MiniPlayer: FC<MiniProps> = ({
                                              coverUrl,
                                              name,
                                              isPlaying,
                                              onTogglePlay,
                                              onOpen,
                                              progress
                                          }) => {

    const [colorMap, setColorMap] = useState<Record<string, string>>({});

    // Load colorMap from AsyncStorage instead of localStorage
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem('colorMap');
                if (stored) {
                    setColorMap(JSON.parse(stored));
                }
            } catch {}
        })();
    }, []);

    // Background color
    const bgColor = useMemo(() => {
        if (coverUrl && colorMap) {
            const key = name + '.png';
            if (colorMap[key]) {
                return `rgba(${colorMap[key]}, 0.65)`; // "r,g,b"
            }
        }
        return 'rgba(255,131,0,0.60)'; // Default audible orange
    }, [coverUrl, colorMap, name]);

    return (
        <View style={styles.wrapper}>
            {/* MAIN ROW */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    if (coverUrl) onOpen();
                }}
                style={[styles.container, { backgroundColor: bgColor }]}
            >
                {/* Thumbnail */}
                <View style={styles.thumbnailBox}>
                    {coverUrl ? (
                        <Image
                            source={{ uri: coverUrl }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <MusicIcon size={40} color="#fff" />
                    )}
                </View>

                {/* Title */}
                <View style={styles.titleBox}>
                    <Text
                        numberOfLines={1}
                        style={styles.title}
                    >
                        {name}
                    </Text>
                </View>

                {/* Play / Pause */}
                <TouchableOpacity
                    disabled={!coverUrl}
                    onPress={(e) => {
                        e.stopPropagation?.();
                        onTogglePlay();
                    }}
                    style={styles.playButton}
                >
                    {isPlaying ? (
                        <PauseIcon size={34} color="#fff" />
                    ) : (
                        <PlayIcon size={34} color="#fff" />
                    )}
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Progress bar */}
            <View
                style={[
                    styles.progressBar,
                    { width: `${progress}%` }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        position: 'relative'
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 14,
        paddingRight: 10,
        paddingVertical: 8,
    },
    thumbnailBox: {
        width: 44,
        height: 44,
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 12,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    titleBox: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    playButton: {
        padding: 4,
    },
    progressBar: {
        height: 3,
        backgroundColor: '#f97316', // audible-orange
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
});
