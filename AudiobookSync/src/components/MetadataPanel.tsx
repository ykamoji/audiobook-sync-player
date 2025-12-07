import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { XIcon } from 'lucide-react-native';
import { formatBytes, formatDate, formatDuration } from '../utils/formatting';
import { SlideWindow } from './SlideWindow';

export interface MetadataPanelData {
    name: string;
    fileSize: number;
    lastModified: number;
    duration: number;
    associatedPlaylists?: string[];
}

interface MetadataPanelProps {
    data: MetadataPanelData | null;
    onClose: () => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ data, onClose }) => {

    const isOpen = !!data;

    return (
        <SlideWindow
            open={isOpen}
            onClose={onClose}
            side="bottom"
            height="70%"
        >
            <View
                style={[
                    styles.container,
                    {
                        paddingTop: 10,
                        paddingBottom: 10,
                    },
                ]}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Details</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <XIcon size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
                {data && (
                    <View style={styles.sectionList}>
                        {/* File name */}
                        <View style={styles.section}>
                            <Text style={styles.label}>File Name</Text>
                            <Text style={styles.value} numberOfLines={2}>
                                {data.name || '-'}
                            </Text>
                        </View>

                        {/* Playlists */}
                        {data.associatedPlaylists && data.associatedPlaylists.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.label}>Playlists</Text>
                                <View style={styles.playlistTagsRow}>
                                    {data.associatedPlaylists.map((playlist, idx) => (
                                        <View key={idx} style={styles.playlistTag}>
                                            <Text style={styles.playlistTagText}>{playlist}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Duration */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Duration</Text>
                            <Text style={styles.value}>{formatDuration(data.duration)}</Text>
                        </View>

                        {/* File size */}
                        <View style={styles.section}>
                            <Text style={styles.label}>File Size</Text>
                            <Text style={styles.value}>{formatBytes(data.fileSize || 0)}</Text>
                        </View>

                        {/* Last modified */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Last Modified</Text>
                            <Text style={styles.value}>{formatDate(data.lastModified || 0)}</Text>
                        </View>
                    </View>
                )}
            </View>
        </SlideWindow>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
    },
    closeButton: {
        padding: 4,
    },
    sectionList: {
        flexGrow: 1,
    },
    section: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    label: {
        color: '#f97316', // audible-orange vibe
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    value: {
        color: '#e5e7eb',
        fontSize: 16,
    },
    playlistTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
    },
    playlistTag: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    playlistTagText: {
        fontSize: 16,
        color: '#f3f4f6',
    },
});