import AsyncStorage from "@react-native-async-storage/async-storage";

const keyForTrack = (trackName: string) =>
    `edits_${trackName}`;

export const saveSubtitleEdit = async (
    trackName: string,
    cueId: number,
    text: string
) => {
    const raw = await AsyncStorage.getItem(keyForTrack(trackName));
    const edits = raw ? JSON.parse(raw) : {};

    edits[cueId] = text;

    await AsyncStorage.setItem(keyForTrack(trackName), JSON.stringify(edits));
};

export const loadSubtitleEdits = async (
    trackName: string
): Promise<Record<string, string>> => {
    const raw = await AsyncStorage.getItem(keyForTrack(trackName));
    return raw ? JSON.parse(raw) : {};
};

export const removeSubtitleEdit = async (
    trackName: string,
    cueId: number
) => {
    const key = keyForTrack(trackName);
    const raw = await AsyncStorage.getItem(key);

    if (!raw) return;

    const edits: Record<string, string> = JSON.parse(raw);

    // Remove the specific cue
    delete edits[cueId];

    // If no edits remain, clean up the key entirely
    if (Object.keys(edits).length === 0) {
        await AsyncStorage.removeItem(key);
    } else {
        await AsyncStorage.setItem(key, JSON.stringify(edits));
    }
};


export const exportAllEditedSubtitlesParsed = async (): Promise<
    Record<string, { part: number; dialogue: string }[]>
> => {
    const keys = await AsyncStorage.getAllKeys();

    const result: Record<string, any[]> = {};

    for (const key of keys) {
        if (!key.startsWith("edits_")) continue;

        const trackName = key.replace("edits_", "");
        const raw = await AsyncStorage.getItem(key);

        if (!raw) continue;

        const edits: Record<string, string> = JSON.parse(raw);

        result[trackName] = Object.keys(edits)
            .map(cueId => ({
                part: Number(cueId),
                dialogue: edits[cueId],
            }))
            .sort((a, b) => a.part - b.part);
    }

    return result;
};