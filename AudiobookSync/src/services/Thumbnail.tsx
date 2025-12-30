import React, { useEffect, useRef, useState } from "react";
import {Animated, StyleSheet, Text, View} from "react-native";
import uuid from "react-native-uuid";
import {useSafeAreaInsets} from "react-native-safe-area-context";

interface ThumbnailProps {
    images: string[];          // local or remote URIs
    titles?: string[];          // additional titles
    intervalMs?: number;       // time between image switches
    fadeDurationMs?: number;   // cross-fade duration
}

type Layer = {
    id: string;
    uri: string;
    title?: string;
    opacity: Animated.Value;
};


export const Thumbnail: React.FC<ThumbnailProps> = ({
                                                        images,
                                                        titles,
                                                        intervalMs = 8000,
                                                        fadeDurationMs = 450,
                                                    }) => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const indexRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const insets = useSafeAreaInsets();

    const pushImage = (uri: string, title?:string) => {
        const opacity = new Animated.Value(0);
        const id = uuid.v4().toString();

        setLayers((prev) => [...prev, { id, uri, opacity, title }]);

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
        pushImage(images[0], titles && titles[0]);

        if (images.length === 1) return;

        intervalRef.current = setInterval(() => {
            indexRef.current = (indexRef.current + 1) % images.length;
            pushImage(images[indexRef.current], titles && titles[indexRef.current]);
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
        <>
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
        {titles &&
            <View style={[styles.titleBox,{top:insets.top}]}>
                <Animated.Text
                    key={layers[layers.length - 1].id}
                    style={[styles.title, { opacity: layers[layers.length - 1].opacity }]}
                >
                    {layers[layers.length - 1].title}
                </Animated.Text>
            </View>
        }
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
        position: "relative",
        zIndex: 50,
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
    titleBox:{
        position: "absolute",
        left: 30,
        top:100,
        zIndex: 100,
    },
    title: {
        color: '#f97316',
        fontWeight: 'bold',
        fontSize: 20,
    }
});
