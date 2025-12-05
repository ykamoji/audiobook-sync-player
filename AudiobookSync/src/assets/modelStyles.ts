import {StyleSheet} from "react-native";


export const modelStyles = StyleSheet.create({
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
})