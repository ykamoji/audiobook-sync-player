import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
} from "react-native";
import { ListIcon } from "./Icons";
import {Playlist} from "../utils/types.ts";

interface LibraryModalsProps {
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    showCreatePlaylistModal: boolean;
    setShowCreatePlaylistModal: (show: boolean) => void;
    showRenamePlaylistModal: boolean;
    setShowRenamePlaylistModal: (show: boolean) => void;
    newPlaylistName: string;
    setNewPlaylistName: (name: string) => void;
    createPlaylistName: string;
    setCreatePlaylistName: (name: string) => void;
    renamePlaylistName: string;
    setRenamePlaylistName: (name: string) => void;
    playlists: Playlist[];
    handleCreatePlaylist: () => void;
    handleCreateEmptyPlaylist: () => void;
    handleRenamePlaylist: () => void;
    handleAddToExisting: (playlistId: string) => void;
}

export const LibraryModals: React.FC<LibraryModalsProps> = ({
                                  showAddModal,
                                  setShowAddModal,
                                  showCreatePlaylistModal,
                                  setShowCreatePlaylistModal,
                                  showRenamePlaylistModal,
                                  setShowRenamePlaylistModal,
                                  newPlaylistName,
                                  setNewPlaylistName,
                                  createPlaylistName,
                                  setCreatePlaylistName,
                                  renamePlaylistName,
                                  setRenamePlaylistName,
                                  playlists,
                                  handleCreatePlaylist,
                                  handleCreateEmptyPlaylist,
                                  handleRenamePlaylist,
                                  handleAddToExisting,
                              }) => {
    return (
        <>
            {/* ------------------------- */}
            {/* Add to Playlist Modal     */}
            {/* ------------------------- */}
            <Modal visible={showAddModal} transparent animationType="fade">
                <View style={styles.backdrop}>
                    <View style={styles.modalContainer}>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerText}>Add to Playlist</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: "60%" }}>
                            {/* Create New Playlist */}
                            <View style={styles.section}>
                                <TextInput
                                    placeholder="New Playlist Name"
                                    placeholderTextColor="#888"
                                    value={newPlaylistName}
                                    onChangeText={setNewPlaylistName}
                                    style={styles.input}
                                />

                                <TouchableOpacity
                                    onPress={handleCreatePlaylist}
                                    disabled={!newPlaylistName.trim()}
                                    style={[
                                        styles.primaryButton,
                                        !newPlaylistName.trim() && styles.disabledButton,
                                    ]}
                                >
                                    <Text style={styles.primaryButtonText}>Create & Add</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Existing playlists */}
                            {playlists.length > 0 && (
                                <>
                                    <Text style={styles.sectionLabel}>Existing Playlists</Text>

                                    {playlists.map((p) => (
                                        <TouchableOpacity
                                            key={p.id}
                                            onPress={() => handleAddToExisting(p.id)}
                                            style={styles.playlistRow}
                                        >
                                            <View style={styles.iconBox}>
                                                <ListIcon size={18} color="#bbb" />
                                            </View>

                                            <Text style={styles.playlistName}>{p.name}</Text>
                                            <Text style={styles.trackCount}>
                                                {p.trackNames.length} tracks
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ------------------------- */}
            {/* Create Empty Playlist     */}
            {/* ------------------------- */}
            <Modal visible={showCreatePlaylistModal} transparent animationType="fade">
                <View style={styles.backdrop}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.headerText}>Create New Playlist</Text>

                        <TextInput
                            placeholder="Playlist Name"
                            placeholderTextColor="#888"
                            value={createPlaylistName}
                            onChangeText={setCreatePlaylistName}
                            style={[styles.input, { marginVertical: 20 }]}
                            autoFocus
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                onPress={() => setShowCreatePlaylistModal(false)}
                                style={[styles.secondaryButton, { flex: 1 }]}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleCreateEmptyPlaylist}
                                disabled={!createPlaylistName.trim()}
                                style={[
                                    styles.primaryButton,
                                    { flex: 1 },
                                    !createPlaylistName.trim() && styles.disabledButton,
                                ]}
                            >
                                <Text style={styles.primaryButtonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ------------------------- */}
            {/* Rename Playlist Modal     */}
            {/* ------------------------- */}
            <Modal visible={showRenamePlaylistModal} transparent animationType="fade">
                <View style={styles.backdrop}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.headerText}>Rename Playlist</Text>

                        <TextInput
                            placeholder="New Playlist Name"
                            placeholderTextColor="#888"
                            value={renamePlaylistName}
                            onChangeText={setRenamePlaylistName}
                            style={[styles.input, { marginVertical: 20 }]}
                            autoFocus
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                onPress={() => setShowRenamePlaylistModal(false)}
                                style={[styles.secondaryButton, { flex: 1 }]}
                            >
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleRenamePlaylist}
                                disabled={!renamePlaylistName.trim()}
                                style={[
                                    styles.primaryButton,
                                    { flex: 1 },
                                    !renamePlaylistName.trim() && styles.disabledButton,
                                ]}
                            >
                                <Text style={styles.primaryButtonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#2a2a2a",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    closeText: {
        color: "#ccc",
    },
    section: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        color: "#888",
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        backgroundColor: "rgba(0,0,0,0.25)",
        borderColor: "#666",
        borderWidth: 1,
        padding: 12,
        color: "#fff",
        borderRadius: 8,
    },
    primaryButton: {
        backgroundColor: "#ff8300",
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#000",
        fontWeight: "bold",
    },
    disabledButton: {
        opacity: 0.4,
    },
    secondaryButton: {
        backgroundColor: "#555",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginRight: 10,
    },
    secondaryButtonText: {
        color: "#eee",
    },
    playlistRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.05)",
        marginBottom: 6,
    },
    iconBox: {
        backgroundColor: "#111",
        padding: 6,
        borderRadius: 6,
        marginRight: 10,
    },
    playlistName: {
        color: "#eee",
        fontSize: 15,
        flex: 1,
    },
    trackCount: {
        color: "#888",
        fontSize: 12,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
    },
});
