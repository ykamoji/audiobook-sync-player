// import React, {FC} from "react";
// import {Playlist, ProgressData, Track} from "../utils/types.ts";
// import {Gesture, GestureDetector} from "react-native-gesture-handler";
// import {Animated, FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View} from "react-native";
// import {ChevronLeftIcon, MoreHorizontalIcon, PencilIcon} from "./Icons.tsx";
//
// interface AlbumContentProps {
//     playlists: Playlist[];
//     selectedPlaylistId: string;
// }
//
// export const AlbumContent : FC<AlbumContentProps> = ({playlists, selectedPlaylistId})=> {
//

// import {useMemo} from "react";
// import {Track} from "../utils/types.ts";
//
// const currentListTracks = useMemo(() => {
//     if (selectedPlaylistId) {
//
//         const playlist = playlists.find((p) => p.id === selectedPlaylistId);
//         if (!playlist) return [];
//
//         return playlist.trackNames
//             .map((name) => allTracks.find((t) => t.name === name))
//             .filter((t): t is Track => t !== undefined);
//     }
//
//     return allTracks;
// }, [selectedPlaylistId, playlists, allTracks]);
//
//
// const isAllSelected = useMemo(() => {
//     if (currentListTracks.length === 0) return false;
//     return currentListTracks.every((t) => selectedTrackIds.has(t.id));
// }, [currentListTracks, selectedTrackIds]);
//
//
//
// const handleSelectAll = () => {
//     if (isAllSelected) {
//         setSelectedTrackIds(new Set());
//     } else {
//         const allIds = currentListTracks.map((t) => t.id);
//         setSelectedTrackIds(new Set(allIds));
//     }
// };
//
//     const { width: screenWidth } = useWindowDimensions();
//
//     // swipe-back for playlist detail (Animated instead of Reanimated)
//     const detailTranslateX = React.useRef(new Animated.Value(0)).current;
//
//     const detailPan = Gesture.Pan()
//         .onUpdate((e) => {
//             if (e.translationX > 0) {
//                 detailTranslateX.setValue(e.translationX);
//             }
//         })
//         .onEnd((e) => {
//             const shouldGoBack =
//                 e.translationX > 80 || e.velocityX > 800;
//
//             if (shouldGoBack) {
//                 Animated.spring(detailTranslateX, {
//                     toValue: screenWidth,
//                     useNativeDriver: true,
//                 }).start(() => {
//                     // setSelectedPlaylistId(null);
//                     detailTranslateX.setValue(0);
//                 });
//             } else {
//                 Animated.spring(detailTranslateX, {
//                     toValue: 0,
//                     useNativeDriver: true,
//                 }).start();
//             }
//         });
//
//
//     const detailAnimatedStyle = {
//         transform: [{ translateX: detailTranslateX }],
//     };
//
//
//     const playlist = playlists.find((p) => p.id === selectedPlaylistId);
//     if (!playlist) return null;
//
//     return (
//         <>
//          // Bulk action bar
//         <View style={styles.bulkBar}>
//             <Text style={styles.bulkText}>{selectedTrackIds.size} selected</Text>
//
//             {selectedPlaylistId ? (
//                 <TouchableOpacity
//                     onPress={handleBulkRemove}
//                     style={styles.bulkRemoveButton}
//                 >
//                     <Text style={styles.bulkRemoveText}>Remove from Playlist</Text>
//                 </TouchableOpacity>
//             ) : (
//                 <TouchableOpacity
//                     onPress={() => {
//                         const selected = allTracks.filter((t) => selectedTrackIds.has(t.id));
//                         handleOpenAddModal(selected);
//                     }}
//                     style={styles.bulkAddButton}
//                 >
//                     <Text style={styles.bulkAddText}>Add to Playlist</Text>
//                 </TouchableOpacity>
//             )}
//         </View>
//         <GestureDetector gesture={detailPan}>
//             <Animated.View style={[styles.detailContainer, detailAnimatedStyle]}>
//                 <View style={styles.detailHeader}>
//                     <View style={styles.detailTitleRow}>
//                         <TouchableOpacity
//                             onPress={() => setSelectedPlaylistId(null)}
//                             style={styles.iconButton}
//                         >
//                             <ChevronLeftIcon size={20} color="#ffffff" />
//                         </TouchableOpacity>
//                         <Text
//                             style={styles.detailTitle}
//                             numberOfLines={1}
//                         >
//                             {playlist.name}
//                         </Text>
//                         <TouchableOpacity
//                             onPress={() => {
//                                 // setRenamePlaylistName(playlist.name);
//                                 // setShowRenamePlaylistModal(true);
//                             }}
//                             style={styles.iconButton}
//                         >
//                             <PencilIcon size={18} color="#9ca3af" />
//                         </TouchableOpacity>
//                     </View>
//
//                     <View style={styles.detailRightRow}>
//                         <TouchableOpacity
//                             onPress={() => setIsSelectionMode((prev) => !prev)}
//                         >
//                             <Text style={styles.selectText}>
//                                 {isSelectionMode ? 'Cancel' : 'Select'}
//                             </Text>
//                         </TouchableOpacity>
//
//                         <TouchableOpacity
//                             // onPress={() => handlePlaylistMoreOptions(playlist)}
//                             style={styles.iconButton}
//                         >
//                             <MoreHorizontalIcon size={18} color="#9ca3af" />
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//
//                 {currentListTracks.length === 0 ? (
//                     <View style={styles.emptyState}>
//                         <Text style={styles.emptyText}>This playlist is empty.</Text>
//                     </View>
//                 ) : (
//                     <FlatList
//                         data={currentListTracks}
//                         keyExtractor={(item) => item.id}
//                         renderItem={renderTrackItem}
//                         contentContainerStyle={styles.listContent}
//                     />
//                 )}
//             </Animated.View>
//         </GestureDetector>
//         </>
//     );
// };
//
// const styles = StyleSheet.create({
//     bulkBar: {
//         position: 'absolute',
//         left: 0,
//         right: 0,
//         bottom: 0,
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         backgroundColor: '#1f2933',
//         borderTopWidth: 1,
//         borderTopColor: 'rgba(148,163,184,0.4)',
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },
//     bulkText: {
//         color: '#ffffff',
//         fontWeight: '500',
//     },
//     bulkRemoveButton: {
//         paddingHorizontal: 18,
//         paddingVertical: 8,
//         borderRadius: 999,
//         backgroundColor: 'rgba(248,113,113,0.12)',
//     },
//     bulkRemoveText: {
//         color: '#f87171',
//         fontWeight: '600',
//         fontSize: 13,
//     },
//     bulkAddButton: {
//         paddingHorizontal: 18,
//         paddingVertical: 8,
//         borderRadius: 999,
//         backgroundColor: '#f97316',
//     },
//     bulkAddText: {
//         color: '#000000',
//         fontWeight: '700',
//         fontSize: 13,
//     },
// })