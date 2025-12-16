import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {ProgressData, Track} from '../utils/types';
import {useStaticData} from "./useStaticData.ts";

export const useProgressManager = () => {
    const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});

    const { getTrackStaticData } = useStaticData()

    // Save progress to AsyncStorage
    const persistProgress = async (map: Record<string, ProgressData>) => {
        try {
            await AsyncStorage.setItem('audiobook_progress', JSON.stringify(map));
        } catch (e) {
            console.error('Failed to save progress', e);
        }
    };

    const initProgress = async (data: Record<string, ProgressData>, tracks:Track[]) => {

        if(Object.entries(data).length > 0) {
            persistProgress(data).then();
            setProgressMap(data);
        }
        else {
            initializeEmptyProgress(tracks);
        }

    }

    const initializeEmptyProgress = (tracks:Track[]) => {

        const emptyProgress: Record<string, ProgressData> = {};

        for (const track of tracks) {
            emptyProgress[track.name] = {
                currentTime: 0,
                percentage: 0,
                updatedAt: Date.now(),
                segmentHistory: {}
            };
        }

        setProgressMap(emptyProgress);
        persistProgress(emptyProgress).then();
    }

    const saveProgress = (
        trackName: string,
        currentTime: number,
        segmentHistory: Record<number, number>
    ) => {

        const {duration} = getTrackStaticData(trackName);

        // console.log('inside useProgressManager ',trackName, currentTime, segmentHistory);

        if (!trackName) return;

        const newEntry: ProgressData = {
            currentTime,
            percentage: (currentTime / duration) * 100,
            updatedAt: Date.now(),
            segmentHistory: { ...segmentHistory }
        };

        setProgressMap(prev => {
            const newMap = { ...prev, [trackName]: newEntry };
            persistProgress(newMap).then();
            return newMap;
        });
    };

    // Load from AsyncStorage
    const reloadProgress = async (tracks:Track[]) => {
        try {
            const stored = await AsyncStorage.getItem('audiobook_progress');
            if (stored && Object.entries(stored).length > 0) {
                setProgressMap(JSON.parse(stored));
            }
            else{
                initializeEmptyProgress(tracks);
            }
        } catch (e) {
            console.warn('Failed to load progress', e);
        }
    };

    const clearProgress = () => {
        setProgressMap({});
    }

    return {
        progressMap,
        initProgress,
        saveProgress,
        clearProgress,
        reloadProgress,
    };
};
