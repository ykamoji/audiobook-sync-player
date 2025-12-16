import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Static {
    speed:number;
    speaking_rate:number;
    pitch:number;
    pitch_variability:number;
    loudness:number;
    duration:number;
    size:number;
    prosody_index:number;
    scheme?:object;
    dims?: number[];
    intro?: string;
}

let STATIC_DATA:Record<string, Static> = {}

export const useStaticData = () => {


    const updateStaticData = (data:Record<string, Static>) => {
        try {
            AsyncStorage.setItem('static', JSON.stringify(data)).then(() => {
                STATIC_DATA = data
            });
            // console.log('updateStaticData', STATIC_DATA)
        } catch (e) {
            console.error('Failed to save static data', e);
        }
    }

    const loadStaticData = () => {

        try {
            AsyncStorage.getItem('static').then(static_data => {
                if (!!static_data) {
                    const parsed_data:Record<string, Static> = JSON.parse(static_data);
                    if (parsed_data) {
                        // console.log('loadStaticData', parsed_data);
                        STATIC_DATA = parsed_data;
                    }
                }
            })

            // console.log('loadStaticData post', STATIC_DATA);
            return STATIC_DATA
        } catch (e) {
            console.error('Failed to retrieve static data', e);
        }

        return {}
    }

    const DEFAULT_TRACK_DATA = {
        duration: 0,
        scheme: [255, 131, 0]
    };

    const getTrackStaticData = (track_name: string) => {
        try {
            loadStaticData();
            const track_data:Static = STATIC_DATA[track_name];

            if (track_data) {
                return {
                    ...DEFAULT_TRACK_DATA,
                    ...track_data
                };
            }
        } catch (e) {
            console.error('Failed to get audio data', e);
        }

        return { size: 0, prosody: 0, speed: 0, pitch: 0, pitch_variability: 0, loudness: 0,
            speaking_rate: 0, prosody_index:0, dims:[], ...DEFAULT_TRACK_DATA } as Static
    }


    const preparePanelData =  (track_name:string) => {
        try{
            loadStaticData()
            const track_data = STATIC_DATA[track_name];
            if (!!track_data) {
                return {
                    duration: track_data.duration,
                    size: track_data.size,
                    speed: track_data.speed,
                    pitch: track_data.pitch,
                    prosody_index: track_data.prosody_index,
                    speaking_rate: track_data.speaking_rate,
                    pitch_variability: track_data.pitch_variability,
                    loudness: track_data.loudness,
                    intro: track_data.intro,
                } as Static;
            }
        }
        catch (e) {
            console.error('Failed to get audio data', e);
        }
        return { duration: 0, size: 0, prosody: 0, speed: 0, pitch: 0, pitch_variability: 0, loudness: 0, speaking_rate: 0, prosody_index:0 } as Static;
    }

    return {
        getTrackStaticData,
        loadStaticData,
        updateStaticData,
        preparePanelData
    }
}