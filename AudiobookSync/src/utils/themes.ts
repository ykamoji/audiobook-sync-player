import { useColorScheme } from 'react-native';


const bottom = {
    light:{
        tabIconNonActive: '#888',
        tabActiveIconColor: '#fff',
        tabLabelColor: '#777',
        tabLabelActive: '#fff',
        bottomBarBorderColor: '#222',
    },
    dark:{
        tabIconNonActive: '#888',
        tabActiveIconColor: '#fff',
        tabLabelColor: '#777',
        tabLabelActive: '#fff',
        bottomBarBorderColor: '#222',
    }
}

const setup = {
    light: {
        setupBgColor: '#ddd',
        setupTitleColor: '#222',
    },
    dark: {
        setupBgColor: '#0d0d0d',
        setupTitleColor: '#fff',
    },
}

const metadata = {
    light: {
        metadataBgColor: '#ddd',
        metadataTitleColor: '#222',
        metadataValueColor: '#222',
        playlistTag:"#f97316",
        playlistTagText:"#fff",
        metadataBorderBottomColor:'#aaa',
        metadataValueFontWeight : '500',
    },
    dark: {
        metadataBgColor: '#1a1a1a',
        metadataTitleColor: '#ffffff',
        metadataValueColor: '#e5e7eb',
        playlistTag:"rgba(255,255,255,0.06)",
        playlistTagText:"#f97316",
        metadataBorderBottomColor:'rgba(255,255,255,0.08)',
        metadataValueFontWeight: '400'
    },
}

const library = {
    light: {
        libraryBgColor: '#ddd',
        libraryHeaderColor: '#444',
        libraryEmptyText: '#444',
        libraryMenuBgColor: '#ddd',
        libraryMenuColor: '#222',
        libraryMenuBorderColor: "rgba(0,0,0,0.2)",
        libraryMoreColor: '#444',
    },
    dark: {
        libraryBgColor: '#050505',
        libraryHeaderColor: '#9ca3af',
        libraryEmptyText: '#6b7280',
        libraryMenuBgColor: '#2a2a2a',
        libraryMenuColor: '#fff',
        libraryMenuBorderColor: "rgba(255,255,255,0.1)",
        libraryMoreColor: '#9ca3af',
    },
}

const tracks = {
    light: {
        trackTitle:"#444",
        thumbnailBoxColor: '#ccc',
        thumbnailMusic: '#222',
        trackIntro: "rgba(0,0,0,0.7)",
        progressBarBackground:"#999",
        playlistBadgeOpacity: 1,
        playlistBadgeWeight:'700',
        selectedRow:"rgba(255,131,0,0.4)",
        selectedText:"#000",
    },
    dark: {
        trackTitle:"#fff",
        trackIntro: "rgba(255,255,255,0.7)",
        thumbnailBoxColor: '#333',
        thumbnailMusic: '#ccc',
        progressBarBackground:"#444",
        playlistBadgeOpacity: 0.6,
        playlistBadgeWeight:'400',
        selectedRow:"rgba(255,131,0,0.15)",
        selectedText:"#FF8300"
    },
}

const albums = {
    light: {
        createPlaylistButton:'rgba(249,115,22,1)',
        createPlaylistText:'#f97316',
        detailTitle:'#333'
    },
    dark: {
        createPlaylistButton:'rgba(249,115,22,0.4)',
        createPlaylistText:'#f97316',
        detailTitle:'#fff'
    },
}

const modals = {
    light: {
        backdrop:"transparent",
        modalContainerBgColor:"#ddd",
        modalContainerBorderColor:"rgba(0,0,0,0.5)",
        modelHeaderText:"#222",
        inputText:"#222",
        inputColor: "#ccc",
        sectionLabel:"#333",
        playlistRow:"#ccc",
        iconBox:"#111",
        listIcon:"#fff",
        playlistName:"#000",
        closeText:"#333"
    },
    dark: {
        backdrop:"rgba(0,0,0,0.8)",
        modalContainerBgColor:"#2a2a2a",
        modalContainerBorderColor:"rgba(255,255,255,0.1)",
        modelHeaderText:"#fff",
        inputText: "#2a2a2a",
        inputBgColor: "#ddd",
        sectionLabel: "#888",
        playlistRow: "rgba(255,255,255,0.05)",
        iconBox:"#111",
        listIcon:"#bbb",
        playlistName:"#eee",
        closeText:"#ccc"
    },
}

const playlist = {
    light: {
        trackCount:"#111",
        playlistTitle:"#333"
    },
    dark: {
        trackCount:"#888",
        playlistTitle:"#fff"
    },
}

const player = {
    light: {
        subtitlesContainer:"#ddd",
        cueText:"#333",
        checkbox:"rgba(255,131,0,1)",
        checkboxWidth:1.5,
        pencilIcon:"red",
        chaptersOverlayRoot:"#eee",
        thumbColor:"#222",
        chapter:"rgba(255,131,0,0.5)",
        chapterItem:"#fff",
        chapterItemBorderColor:"#eee",
        chapterIndex:"#222",
        chapterItemActive:"rgba(255,131,0,1)",

        sliderInterTrack:"#aaa",
        sideIcon:"#222",
        smallIcon:"#333",
        playButton:"#222",
        playIcon:"#ddd",

    },
    dark: {
        subtitlesContainer:"#000",
        cueText:"#9ca3af",
        checkbox:"rgba(255,131,0,0.5)",
        checkboxWidth:1,
        pencilIcon:"orange",
        chaptersOverlayRoot:"#222",
        thumbColor:"#222",
        chapter:"rgba(255,131,0,0.2)",
        chapterItemBorderColor:"#222",
        chapterItem:"rgba(255,255,255,0.05)",
        chapterIndex:"#aaa",
        chapterItemActive:"rgba(255,131,0,0.60)",

        sliderInterTrack:"#555",
        sideIcon:"#aaa",
        smallIcon:"#ddd",
        playButton:"#fff",
        playIcon:"#000",
    },
}

const palette = {
    light: {
        ...bottom.light,
        ...setup.light,
        ...metadata.light,
        ...library.light,
        ...tracks.light,
        ...modals.light,
        ...albums.light,
        ...playlist.light,
        ...player.light,
    },
    dark: {
        ...bottom.dark,
        ...setup.dark,
        ...metadata.dark,
        ...library.dark,
        ...tracks.dark,
        ...modals.dark,
        ...albums.dark,
        ...playlist.dark,
        ...player.dark,
    },
};

export function useTheme() {
    // const scheme = useColorScheme();
    const scheme = 'light';
    return palette[scheme === 'dark' ? 'dark' : 'light'];
}