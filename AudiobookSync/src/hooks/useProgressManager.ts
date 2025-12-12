import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProgressData } from '../utils/types';

export const useProgressManager = () => {
    const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});

    // Save progress to AsyncStorage
    const persistProgress = async (map: Record<string, ProgressData>) => {
        try {
            await AsyncStorage.setItem('audiobook_progress', JSON.stringify(map));
        } catch (e) {
            console.error('Failed to save progress', e);
        }
    };

    const initProgress = async (data: Record<string, ProgressData>) => {

        setProgressMap((prev) => {
            const newMap = {...prev, ...data};
            persistProgress(newMap);
            return newMap;
        });
    }

    const saveProgress = (
        trackName: string,
        currentTime: number,
        duration: number,
        segmentHistory: Record<number, number>
    ) => {
        if (!trackName || duration <= 0) return;

        const newEntry: ProgressData = {
            currentTime,
            duration,
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
    const reloadProgress = async () => {
        try {
            const stored = await AsyncStorage.getItem('audiobook_progress');
            if (stored) {
                setProgressMap(JSON.parse(stored));
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
