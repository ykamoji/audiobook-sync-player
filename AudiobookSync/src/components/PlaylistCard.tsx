import React, {useState, useEffect, useMemo, useRef} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Playlist, Track, ProgressData } from "../utils/types";
import { MusicIcon } from "lucide-react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from "react-native-reanimated";

interface PlaylistCardProps {
    playlist: Playlist;
    allTracks: Track[];
    progressMap: Record<string, ProgressData>;
    onClick: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
                                                              playlist,
                                                              allTracks,
                                                              progressMap,
                                                              onClick,
                                                          }) => {

    const { covers, playlistProgress, totalTracks } = useMemo(() => {
        const images: string[] = [];
        let totalPercentage = 0;
        const total = playlist.trackNames.length;

        for (const name of playlist.trackNames) {
            const t = allTracks.find((track) => track.name === name);

            // Normalized image paths (string only)
            if (t?.coverFile) images.push(t.coverFile);
            else if (t?.coverPath) images.push(t.coverPath);

            const p = progressMap[name];
            if (p) totalPercentage += p.percentage;
        }

        return {
            covers: images,
            playlistProgress: total > 0 ? Math.round(totalPercentage / total) : 0,
            totalTracks: total,
        };
    }, [allTracks, progressMap, playlist.trackNames]);

    // Starting offset so each playlist rotates differently
    const [offset, setOffset] = useState(() => Math.floor(Math.random() * 100));

    const opacity = useSharedValue(1);
    const [imageSrc, setImageSrc] = useState(covers[0] ?? null);

    useEffect(() => {
        if (covers.length <= 1) return;

        const interval = setInterval(() => {
            const nextOffset = (offset + 1) % covers.length;
            const nextImage = covers[nextOffset];

            opacity.value = withTiming(0.5, { duration: 250 }, () => {
                runOnJS(setImageSrc)(nextImage);
                opacity.value = withTiming(1, { duration: 300 });
            });

            setOffset(nextOffset);

        }, 4000);

        return () => clearInterval(interval);
    }, [covers, offset]);

    const animatedStyle = useAnimatedStyle(() => {
        return { opacity: opacity.value };
    });


    return (
        <TouchableOpacity onPress={onClick} activeOpacity={0.85} style={styles.card}>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                {imageSrc ? (
                    <Animated.Image
                        source={{ uri: imageSrc }}
                        style={[styles.coverImage, animatedStyle]}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.emptyCover}>
                        <MusicIcon size={60} color="#999" />
                    </View>
                )}
            </View>

            {/* Playlist Name + Progress */}
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {playlist.name}
                </Text>

                <View style={styles.metaRow}>
                    <Text style={styles.trackCount}>{totalTracks} tracks</Text>

                    {playlistProgress > 0 && (
                        <>
                            <View style={styles.dot} />
                            <Text style={styles.percentage}>{playlistProgress}%</Text>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        width: "100%",
    },

    coverContainer: {
        width: "100%",
        aspectRatio: 1,
        overflow: "hidden",
    },

    coverImage: {
        width: "100%",
        height: "100%",
    },

    emptyCover: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.2,
    },

    infoContainer: {
        marginTop: 10,
        alignItems: "center",
    },

    title: {
        color: "white",
        fontSize: 20,
        fontWeight: "700",
    },

    metaRow: {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
    },

    trackCount: {
        color: "#888",
        fontSize: 14,
    },

    dot: {
        width: 5,
        height: 5,
        backgroundColor: "#666",
        borderRadius: 50,
        marginHorizontal: 6,
    },

    percentage: {
        color: "#FF8300",
        fontSize: 12,
        fontWeight: "700",
    },
});
