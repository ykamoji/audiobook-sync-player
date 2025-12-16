import {Dimensions, StyleSheet} from "react-native";

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export const playerStyles = StyleSheet.create({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        flexDirection: 'column',
    },
    headerContainer: {
        position: "absolute",
        top: 0,
        left: 15,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBackButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 999,
    },
    headerTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    nowPlayingLabel: {
        fontSize: 14,
        textTransform: 'capitalize',
        color: '#f97316',
        fontWeight: '800',
    },
    trackTitle: {
        marginTop: 2,
        fontSize: 14,
        fontWeight: '700',
    },
    coverContainer: {
        marginTop: 0,
        width: '100%',
        // overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        // height: SCREEN_HEIGHT * 0.4,
        minHeight: 0,
    },
    coverWrapper: {
        width: '100%',
        aspectRatio: 1,
        // borderRadius: 1,
        // overflow: 'hidden',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
    coverPlaceholder: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: '#1f2933',
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverPlaceholderText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#6b7280',
    },
    subtitlesContainer: {
        flex: 1,
        marginTop: 20,
        minHeight: 300,
    },
    subtitlesContent: {
        paddingHorizontal: 20,
    },
    cueContainer: {
        paddingHorizontal:22,
        marginBottom: 18,
    },
    cueContainerActive: {},
    cueText: {
        fontSize: 17,
        lineHeight: 20,
        textAlign: 'left',
        letterSpacing: 0.5,
        fontFamily: 'CabinCondensed-Medium',
    },
    cueTextActive: {
        color: '#f97316',
        fontFamily: 'CabinCondensed-Semibold',
    },
    cueTextInactive: {
        color: '#9ca3af',
    },
    noTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    noText: {
        color: '#6b7280',
    },
    controlsContainer: {
        paddingTop: 8,
        paddingHorizontal: 8,
        paddingBottom: 4
    },
    miniLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    miniCover: {
        width: 52,
        height: 52,
        borderRadius: 8,
        marginRight: 10,
    },
    miniCoverPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    miniCoverText: {
        color: '#aaa',
        fontSize: 16,
        fontWeight: '600',
    },
    miniTextWrapper: {
        flex: 1,
    },
    miniTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    miniSubtitle: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 2,
    },
    miniPlayButton: {
        padding: 8,
    },
    chaptersOverlayRoot: {
        // ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-start',
    },
    chaptersSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
    },
    chaptersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    chaptersHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    chaptersTitle: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,131,0,1)',
    },
    chaptersCloseButton: {
        padding: 8,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    chaptersList: {
        maxHeight: SCREEN_HEIGHT * 0.4,
    },
    chaptersListContent: {
        paddingHorizontal: 5,
        paddingVertical: 8,
    },
    chapterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        height: 60,
        // borderRadius: 12,
        marginBottom: 6,
        borderLeftWidth: 5,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    chapterItemActive: {
        // backgroundColor: '#f97316',
        borderLeftWidth: 5,
        borderLeftColor: 'rgba(255,131,0,0.60)'
    },
    chapterIndex: {
        fontSize: 14,
        color: '#aaa',
        fontWeight: '600',
    },
    chapterIndexActive: {
        // color: '#111827',
    },
    chapterDuration: {
        fontSize: 12,
        color: '#6b7280',
    },
    chapterDurationActive: {
        // color: '#111827',
    },
    edited:{
        position: 'absolute',
        top: 10,
        right: 15,
    }
});


export const miniStyles = StyleSheet.create({
    container: {
        // height: 70,
        backgroundColor: '#111',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,131,0,0.60)',
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cover: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginLeft: 5,
        marginRight: 10,
    },
    miniOverlay: {
        position: 'absolute',
        top: 0,
        left: 10,
        right: 80,
        height: 72,
        zIndex: 20,
        backgroundColor: 'transparent',
        // borderColor:'red',
        // borderWidth:1
    },
    coverPlaceholder: {
        width: 46,
        height: 46,
        borderRadius: 8,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    coverPlaceholderText: {
        color: '#aaa',
        fontSize: 14,
        fontWeight: '600',
    },
    textWrapper: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '600',
    },
    subtitle: {
        color: '#888',
        fontSize: 11,
        marginTop: 2,
    },
    playButton: {
        padding: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
    },
    progressTrack: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: -2,
        height: 3,
        // backgroundColor:"white"
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#f97316',
    },
    controlsContainer: {
        position: 'absolute',
        top: -50,
        right: 30,
    }
});