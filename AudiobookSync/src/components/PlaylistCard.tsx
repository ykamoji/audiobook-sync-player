import React, {useState, useEffect, useMemo, useRef} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Playlist, Track, ProgressData } from "../utils/types";
import { MusicIcon } from "lucide-react-native";
import {Thumbnail} from "./Thumbnail.tsx";

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

    return (
        <TouchableOpacity onPress={onClick} activeOpacity={0.85} style={styles.card}>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                {covers.length > 0 ? (
                    <Thumbnail
                        images={covers}
                        intervalMs={4000}
                        fadeDurationMs={300}
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
