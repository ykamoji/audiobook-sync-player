import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import uuid from "react-native-uuid";

interface ThumbnailProps {
    images: string[];          // local or remote URIs
    intervalMs?: number;       // time between image switches
    fadeDurationMs?: number;   // cross-fade duration
}

type Layer = {
    id: string;
    uri: string;
    opacity: Animated.Value;
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
                                                        images,
                                                        intervalMs = 8000,
                                                        fadeDurationMs = 450,
                                                    }) => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const indexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const pushImage = (uri: string) => {
        const opacity = new Animated.Value(0);
        const id = uuid.v4().toString();

        setLayers((prev) => [...prev, { id, uri, opacity }]);

        Animated.timing(opacity, {
            toValue: 1,
            duration: fadeDurationMs,
            useNativeDriver: true,
        }).start(() => {
            // Retain only the topmost image
            setLayers((prev) => prev.slice(-1));
        });
    };

    useEffect(() => {
        if (!images || images.length === 0) return;

        // Seed first image immediately
        indexRef.current = 0;
        pushImage(images[0]);

        if (images.length === 1) return;

        intervalRef.current = setInterval(() => {
            indexRef.current = (indexRef.current + 1) % images.length;
            pushImage(images[indexRef.current]);
        }, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [images, intervalMs, fadeDurationMs]);

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
