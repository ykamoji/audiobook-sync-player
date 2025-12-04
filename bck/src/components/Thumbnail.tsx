import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, Image } from "react-native";
import uuid from 'react-native-uuid';

interface ThumbnailProps {
    file: string; // local file path like "file:///..."
}

export const Thumbnail: React.FC<ThumbnailProps> = ({ file }) => {
    const [layers, setLayers] = useState<
        { uri: string; id: string; opacity: Animated.Value }[]
    >([]);

    const lastUriRef = useRef<string | null>(null);

    useEffect(() => {
        if (!file) return;

        const uri = file.startsWith("file://") ? file : `file://${file}`;
        const id = uuid.v4().toString();

        // Create animated opacity value
        const opacity = new Animated.Value(0);

        // Add new layer on top
        setLayers((prev) => {
            const last = prev[prev.length - 1];
            return last ? [...prev, { uri, id, opacity }] : [{ uri, id, opacity }];
        });

        // Fade in animation
        Animated.timing(opacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
        }).start(() => {
            // After fade, remove older layers
            setLayers((prev) => {
                if (prev.length > 1) return [prev[prev.length - 1]];
                return prev;
            });
        });

        lastUriRef.current = uri;
    }, [file]);

    if (layers.length === 0) {
        return <View style={styles.placeholder} />;
    }

    return (
        <View style={styles.container}>
            {layers.map((layer) => (
                <Animated.Image
                    key={layer.id}
                    source={{ uri: layer.uri }}
                    resizeMode="cover"
                    style={[styles.image, { opacity: layer.opacity }]}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1a1a",
        overflow: "hidden",
    },
    placeholder: {
        flex: 1,
        backgroundColor: "#333",
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
    },
});