import React, {useEffect, useMemo, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import { Thumbnail } from "../services/Thumbnail.tsx";
import { useTheme } from "../utils/themes.ts";
import {shuffle} from "../utils/formatting.ts";
import {useCharacters} from "../hooks/useCharacters.ts";

interface CharactersProps {
    open: boolean
}

export const Characters: React.FC<CharactersProps> = ({
                                                          open}) => {

    const { getCharacters } = useCharacters()

    const [covers, setCovers] = useState<{
        path: string
        scheme: object
        id: string
    }[]>([])

    useEffect(() => {
        if(open) {
            getCharacters().then(characters_data => {
                if (characters_data.length > 0 && covers.length !== characters_data.length) setCovers(characters_data)
            })
        }
        else{
            setCovers([])
        }
    }, [open]);

    const shuffledCovers = useMemo(() => {
        return covers.length > 1 ? shuffle(covers) : covers;
    }, [covers]);

    const styles = STYLES(useTheme())

    return (
            <View style={styles.coverContainer}>
                <Thumbnail
                    images={shuffledCovers.map(cover => cover.path)}
                    titles={shuffledCovers.map(cover => cover.id)}
                    intervalMs={8000}
                    fadeDurationMs={800}
                />
            </View>
    );
};

const STYLES = (theme:any) => StyleSheet.create({
    coverContainer:{
        width: "100%",
        height: "100%",
    }
});
