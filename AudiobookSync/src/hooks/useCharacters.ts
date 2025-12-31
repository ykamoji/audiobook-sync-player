import AsyncStorage from '@react-native-async-storage/async-storage';

export const useCharacters = () => {

    const loadCharacters = async (data:Map<string, {path:string, scheme:object}>) => {

        try{
            await AsyncStorage.setItem("characters",  JSON.stringify(Object.fromEntries(data)))
        }catch (e){
            console.error("Error saving characters", e);
        }
    }

    const getCharacters = async () => {

        try {
            const data = await AsyncStorage.getItem("characters");
            if(!data) return [];
            const charactersData:Map<string, {path:string, scheme:object}> = new Map(Object.entries(JSON.parse(data)));
            return Array.from(charactersData.entries()).map(([id, value]) => ({
                id,
                ...value
            }));
        } catch (e) {
            console.error("Error saving characters", e);
            return [];
        }
    }

    return {
        loadCharacters,
        getCharacters,
    }
}