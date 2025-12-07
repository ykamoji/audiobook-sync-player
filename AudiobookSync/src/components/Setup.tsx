import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {FolderIcon, HeadphonesIcon} from 'lucide-react-native';

interface SetupProps {
    onDirectoryUpload: () => void; // no event needed now
    isLoading: boolean;
}

export const Setup: React.FC<SetupProps> = ({
                                                onDirectoryUpload,
                                                isLoading
                                            }) => {

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.headerSection}>
                <HeadphonesIcon size={100} color="#ff8300" />
                <Text style={styles.title}>Audiobook Player</Text>
            </View>

            {/* Upload Button */}
            <TouchableOpacity
                style={styles.uploadBox}
                onPress={onDirectoryUpload}
                activeOpacity={0.8}
            >
                <View style={styles.iconWrapper}>
                    <FolderIcon size={48} color="#ff8300" />
                </View>

                <Text style={styles.uploadTitle}>Sync</Text>

                {isLoading && (
                    <Text style={styles.loadingText}>Scanning files...</Text>
                )}
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },

    headerSection: {
        alignItems: 'center',
        marginBottom: 40
    },

    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16
    },

    uploadBox: {
        width: '100%',
        paddingTop: 140,
        alignItems: 'center',
    },

    iconWrapper: {
        padding: 20,
        borderRadius: 999,
        backgroundColor: 'rgba(255,131,0,0.1)',
        marginBottom: 16
    },

    uploadTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#fff'
    },

    loadingText: {
        marginTop: 6,
        fontSize: 14,
        color: '#aaa'
    }
});