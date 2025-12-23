import {StyleSheet} from "react-native";


export const MODEL_STYLES = (theme:any) => StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backdropWrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.backdrop
    },
    backdrop: {
        flex: 1,
        backgroundColor: theme.backdrop,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        width: "100%",
        maxWidth: 380,
        backgroundColor: theme.modalContainerBgColor,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.modalContainerBorderColor,
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
        color: theme.modelHeaderText,
    },
    closeText: {
        color: theme.closeText,
    },
    section: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        color: theme.sectionLabel,
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        color: theme.inputText,
        backgroundColor: theme.inputBgColor
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
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: "#444",
        borderRadius: 8,
        marginLeft: 8,
    },
    secondaryButtonText: {
        color: "#fff",
        fontSize: 12
    },
    playlistRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 8,
        backgroundColor: theme.playlistRow,
        marginBottom: 6,
    },
    iconBox: {
        backgroundColor: theme.iconBox,
        padding: 6,
        borderRadius: 6,
        marginRight: 10,
    },
    listIcon:{
        color: theme.listIcon,
    },
    playlistName: {
        color: theme.playlistName,
        fontSize: 15,
        flex: 1,
    },
    trackCount: {
        color: theme.playlistName,
        fontSize: 12,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
    },
})