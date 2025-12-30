import React, {useMemo} from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import { Playlist, Track, ProgressData } from "../utils/types.ts";
import { Thumbnail } from "../services/Thumbnail.tsx";
import { useTheme } from "../utils/themes.ts";

interface CharactersProps {

}



export const Characters: React.FC<CharactersProps> = ({}) => {

    // const { covers } = useMemo(() => {
    //
    // }, []);

    // const shuffledCovers = useMemo(() => {
    //     return covers.length > 1 ? shuffle(covers) : covers;
    // }, [covers]);

    const styles = STYLES(useTheme())

    return (
        <View style={styles.card}>
                <View style={styles.coverContainer}>
                    <Thumbnail
                        images={[]}
                        intervalMs={8000}
                        fadeDurationMs={800}
                    />
                </View>


            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>
                    {}
                </Text>
            </View>
        </View>
    );
};

const STYLES = (theme:any) => StyleSheet.create({
    card: {
        marginVertical: 20,
        width: "100%",
    },
    coverContainer:{

    },
    infoContainer: {
        width: "100%",
        aspectRatio: 1,
        overflow: "hidden",
    },
    name: {

    }
});
