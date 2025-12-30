import AsyncStorage from '@react-native-async-storage/async-storage';

export const loadCharacters = async (charactersData:Record<string, object>) => {

    try{
        await AsyncStorage.setItem("characters", JSON.stringify(charactersData))
    }catch (e){
        console.error("Error saving characters", e);
    }
}

export const getCharacters = async () => {

    try{
        const data = (await AsyncStorage.getItem("characters"))!

        const charactersData:Record<string, object> = JSON.parse(data);

        return charactersData;
    }catch (e){
        console.error("Error saving characters", e);
        return null;
    }
}