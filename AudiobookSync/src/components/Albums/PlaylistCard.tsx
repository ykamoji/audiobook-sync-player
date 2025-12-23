import React, {useMemo} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Playlist, Track, ProgressData } from "../../utils/types.ts";
import { MusicIcon } from "lucide-react-native";
import {Thumbnail} from "./Thumbnail.tsx";
import {useTheme} from "../../utils/themes.ts";

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

    const shuffle = <T,>(arr: T[]): T[] => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };

    const shuffledCovers = useMemo(() => {
        return covers.length > 1 ? shuffle(covers) : covers;
    }, [covers]);

    const styles = STYLES(useTheme())

    return (
        <TouchableOpacity onPress={onClick} activeOpacity={0.85} style={styles.card}>
            {/* Cover Image */}
                {covers.length > 0 ? (
                        <View style={styles.coverContainer}>
                            <Thumbnail
                                images={shuffledCovers}
                                intervalMs={8000}
                                fadeDurationMs={800}
                            />
                        </View>
                ) : (
                    <View style={styles.emptyCover}>
                        <MusicIcon size={60} color={styles.emptyCoverMusic.color} />
                    </View>
                )}

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

const STYLES = (theme:any) => StyleSheet.create({
    card: {
        marginVertical: 20,
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

    emptyCoverMusic : {
        color: theme.thumbnailMusic,
    },

    emptyCover: {
        opacity: 0.5,
        alignItems: "center",
        justifyContent: "center",
    },

    infoContainer: {
        marginTop: 10,
        alignItems: "center",
    },

    title: {
        color: theme.playlistTitle,
        fontSize: 20,
        fontWeight: "700",
    },

    metaRow: {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
    },

    trackCount: {
        color: theme.trackCount,
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
        color: theme.createPlaylistText,
        fontSize: 12,
        fontWeight: "700",
    },
});
