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
        playlistTag:"#333444",
        metadataBorderBottomColor:'#aaa',
        metadataValueFontWeight : '500',
    },
    dark: {
        metadataBgColor: '#1a1a1a',
        metadataTitleColor: '#ffffff',
        metadataValueColor: '#e5e7eb',
        playlistTag:"rgba(255,255,255,0.06)",
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
        libraryMoreColor: '#222',
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
        thumbnailMusic: '#000',
        trackIntro: "rgba(0,0,0,0.7)",
        progressBarBackground:"#ddd",
        playlistBadgeOpacity: 1,
    },
    dark: {
        trackTitle:"#fff",
        trackIntro: "rgba(255,255,255,0.7)",
        thumbnailBoxColor: '#333',
        thumbnailMusic: '#ccc',
        progressBarBackground:"#444",
        playlistBadgeOpacity: 0.6,
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
        iconBox:"#333",
        listIcon:"#fff",
        playlistName:"#000"
    },
    dark: {
        backdrop:"rgba(0,0,0,0.8)",
        modalContainerBgColor:"#2a2a2a",
        modalContainerBorderColor:"rgba(255,255,255,0.1)",
        modelHeaderText:"#fff",
        inputText: "#2a2a2a",
        inputColor: "#fff",
        sectionLabel: "#888",
        playlistRow: "rgba(255,255,255,0.05)",
        iconBox:"#111",
        listIcon:"#bbb",
        playlistName:"#eee"
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
    },
    dark: {
        ...bottom.dark,
        ...setup.dark,
        ...metadata.dark,
        ...library.dark,
        ...tracks.dark,
        ...modals.dark,
    },
};

export function useTheme() {
    const scheme = useColorScheme();
    // const scheme = 'dark';
    return palette[scheme === 'dark' ? 'dark' : 'light'];
}