import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { XIcon } from 'lucide-react-native';
import {formatBytes, formatDate, formatDuration, formatProgress} from '../utils/formatting';
import { SlideWindow } from './SlideWindow';
import {Static} from "../hooks/useStaticData.tsx";

export interface MetadataPanelData {
    name: string;
    progress: number;
    associatedPlaylists?: string[];
    static: Static;
}

interface MetadataPanelProps {
    data: MetadataPanelData | null;
    onClose: () => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ data, onClose }) => {

    const isOpen = !!data;

    let speed = ""
    let pitch_variability= ""
    let speed_variability= ""
    let loudness= ""
    let prosody = ""

    if(data?.static){
        prosody = data.static.prosody_index < 0.33 ? 'Neutral' :  (data.static.prosody_index < 0.66 ? 'Engaging' : 'Dramatic')
        speed = data.static.speed < 110 ? 'Slow' : (data.static.speed < 150 ? 'Normal' : 'Fast');
        pitch_variability = data.static.pitch_variability < 25 ? 'Calm' : (data.static.pitch_variability < 60 ? 'Natural' : 'Emotional');
        speed_variability = data.static.speaking_rate  < 0.25 ? 'Smooth' : (data.static.pitch_variability < 0.6 ? 'Natural' : 'Dynamic');
        loudness = data.static.loudness > -20 ? 'Loud' : (data.static.loudness > -26 ? 'Normal' : 'Quite');
    }



    return (
        <SlideWindow
            open={isOpen}
            onClose={onClose}
            side="bottom"
            height="50%"
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
                {data && (<>
                    {data.associatedPlaylists && data.associatedPlaylists.length > 0 && (
                        <View style={styles.playlistTagsRow}>
                            {data.associatedPlaylists.map((playlist, idx) => (
                                <View key={idx} style={styles.playlistTag}>
                                    <Text style={styles.playlistTagText}>{playlist}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    <View style={styles.sectionList}>
                        {/* File name */}
                        <View style={styles.section}>
                            <View style={styles.column}>
                                <Text style={styles.label}>Chapter</Text>
                                <Text style={styles.value} numberOfLines={2}>
                                    {data.name}
                                </Text>
                            </View>
                            <View style={styles.column}>
                                <Text style={styles.label}>Prosody</Text>
                                <Text style={styles.value}>{data.static.prosody_index} ({prosody})</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.column}>
                                <Text style={styles.label}>Size</Text>
                                <Text style={styles.value}>{formatBytes(data.static.size)}</Text>
                            </View>
                            <View style={styles.column}>
                                <Text style={styles.label}>Duration</Text>
                                <Text style={styles.value}>{formatDuration(data.static.duration)}</Text>
                            </View>
                            {!!data.progress &&
                                <View style={styles.column}>
                                    <Text style={styles.label}>Progress</Text>
                                    <Text style={styles.value}>{formatProgress(data.progress)}</Text>
                                </View>}
                        </View>
                        <View style={styles.section}>
                            <View style={styles.column}>
                                <Text style={styles.label}>Pitch</Text>
                                <Text style={styles.value}>{data.static.pitch} Hz</Text>
                            </View>
                            <View style={styles.column}>
                                <Text style={styles.label}>Variance</Text>
                                <Text style={styles.value}>{data.static.pitch_variability} Hz ({pitch_variability})</Text>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <View style={styles.column}>
                                <Text style={styles.label}>Speed</Text>
                                <Text style={styles.value}>{data.static.speed} WPM ({speed})</Text>
                            </View>
                            <View style={styles.column}>
                                <Text style={styles.label}>Variance</Text>
                                <Text style={styles.value}>{data.static.speaking_rate} ({speed_variability})</Text>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <View style={styles.column}>
                                <Text style={styles.label}>Energy</Text>
                                <Text style={styles.value}>{data.static.loudness} db ({loudness})</Text>
                            </View>
                        </View>
                    </View>
                </>)}
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
        flexDirection: 'row',
        paddingVertical: 12,
        gap:2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    column:{
        width: 150,
        flexDirection: 'column',
    },
    label: {
        color: '#f97316', // audible-orange vibe
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'capitalize',
        marginBottom: 4,
    },
    value: {
        color: '#e5e7eb',
        fontSize: 14,
    },
    playlistTagsRow: {
        position: 'absolute',
        top: 15,
        left: '47%',
        flexWrap: 'wrap',
    },
    playlistTag: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    playlistTagText: {
        fontSize: 12,
        color: '#f97316',
    },
});