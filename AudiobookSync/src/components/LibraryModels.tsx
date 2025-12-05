// import React from "react";
// import {
//     Modal,
//     View,
//     Text,
//     TouchableOpacity,
//     TextInput,
//     ScrollView,
//     StyleSheet,
// } from "react-native";
// import { ListIcon } from "./Icons";
// import {Playlist} from "../utils/types.ts";
//
// interface LibraryModalsProps {
//     showAddModal: boolean;
//     setShowAddModal: (show: boolean) => void;
//     showCreatePlaylistModal: boolean;
//     setShowCreatePlaylistModal: (show: boolean) => void;
//     showRenamePlaylistModal: boolean;
//     setShowRenamePlaylistModal: (show: boolean) => void;
//     newPlaylistName: string;
//     setNewPlaylistName: (name: string) => void;
//     createPlaylistName: string;
//     setCreatePlaylistName: (name: string) => void;
//     renamePlaylistName: string;
//     setRenamePlaylistName: (name: string) => void;
//     playlists: Playlist[];
//     handleCreatePlaylist: () => void;
//     handleCreateEmptyPlaylist: () => void;
//     handleRenamePlaylist: () => void;
//     handleAddToExisting: (playlistId: string) => void;
// }
//
// export const LibraryModals: React.FC<LibraryModalsProps> = ({
//                                   showAddModal,
//                                   setShowAddModal,
//                                   showCreatePlaylistModal,
//                                   setShowCreatePlaylistModal,
//                                   showRenamePlaylistModal,
//                                   setShowRenamePlaylistModal,
//                                   newPlaylistName,
//                                   setNewPlaylistName,
//                                   createPlaylistName,
//                                   setCreatePlaylistName,
//                                   renamePlaylistName,
//                                   setRenamePlaylistName,
//                                   playlists,
//                                   handleCreatePlaylist,
//                                   handleCreateEmptyPlaylist,
//                                   handleRenamePlaylist,
//                                   handleAddToExisting,
//                               }) => {
//     return (
//         <>
//
//
//
//             {/* ------------------------- */}
//             {/* Create Empty Playlist     */}
//             {/* ------------------------- */}
//             <Modal visible={showCreatePlaylistModal} transparent animationType="fade">
//                 <View style={styles.backdrop}>
//                     <View style={styles.modalContainer}>
//                         <Text style={styles.headerText}>Create New Playlist</Text>
//
//                         <TextInput
//                             placeholder="Playlist Name"
//                             placeholderTextColor="#888"
//                             value={createPlaylistName}
//                             onChangeText={setCreatePlaylistName}
//                             style={[styles.input, { marginVertical: 20 }]}
//                             autoFocus
//                         />
//
//                         <View style={styles.buttonRow}>
//                             <TouchableOpacity
//                                 onPress={() => setShowCreatePlaylistModal(false)}
//                                 style={[styles.secondaryButton, { flex: 1 }]}
//                             >
//                                 <Text style={styles.secondaryButtonText}>Cancel</Text>
//                             </TouchableOpacity>
//
//                             <TouchableOpacity
//                                 onPress={handleCreateEmptyPlaylist}
//                                 disabled={!createPlaylistName.trim()}
//                                 style={[
//                                     styles.primaryButton,
//                                     { flex: 1 },
//                                     !createPlaylistName.trim() && styles.disabledButton,
//                                 ]}
//                             >
//                                 <Text style={styles.primaryButtonText}>Create</Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//
//             {/* ------------------------- */}
//             {/* Rename Playlist Modal     */}
//             {/* ------------------------- */}
//             <Modal visible={showRenamePlaylistModal} transparent animationType="fade">
//                 <View style={styles.backdrop}>
//                     <View style={styles.modalContainer}>
//                         <Text style={styles.headerText}>Rename Playlist</Text>
//
//                         <TextInput
//                             placeholder="New Playlist Name"
//                             placeholderTextColor="#888"
//                             value={renamePlaylistName}
//                             onChangeText={setRenamePlaylistName}
//                             style={[styles.input, { marginVertical: 20 }]}
//                             autoFocus
//                         />
//
//                         <View style={styles.buttonRow}>
//                             <TouchableOpacity
//                                 onPress={() => setShowRenamePlaylistModal(false)}
//                                 style={[styles.secondaryButton, { flex: 1 }]}
//                             >
//                                 <Text style={styles.secondaryButtonText}>Cancel</Text>
//                             </TouchableOpacity>
//
//                             <TouchableOpacity
//                                 onPress={handleRenamePlaylist}
//                                 disabled={!renamePlaylistName.trim()}
//                                 style={[
//                                     styles.primaryButton,
//                                     { flex: 1 },
//                                     !renamePlaylistName.trim() && styles.disabledButton,
//                                 ]}
//                             >
//                                 <Text style={styles.primaryButtonText}>Update</Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//         </>
//     );
// };