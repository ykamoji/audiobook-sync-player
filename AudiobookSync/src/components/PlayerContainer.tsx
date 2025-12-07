import React, { useMemo } from 'react';
import { PlayerView } from './PlayerView';
import { AudioFileState, SubtitleFileState } from '../utils/types';

interface PlayerContainerProps {
    audioState: AudioFileState;
    subtitleState: SubtitleFileState;
    isPlaying: boolean;
    currentTime: number;
    duration: number;

    // Navigation
    currentTrackIndex: number;
    playlistLength: number;
    onNext: () => void;
    onPrevious: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onBack: () => void;

    // Controls
    onTogglePlay: () => void;
    onSeek: (percentage: number) => void;
    onSubtitleClick: (time: number) => void;

    // Metadata panel
    onOpenMetadata: () => void;

    // Segment navigation
    onSegmentChange: (index: number) => void;
}

const CUES_PER_SEGMENT = 100;

export const PlayerContainer: React.FC<PlayerContainerProps> = ({
                                                                    audioState,
                                                                    subtitleState,
                                                                    isPlaying,
                                                                    currentTime,
                                                                    duration,
                                                                    currentTrackIndex,
                                                                    playlistLength,
                                                                    onNext,
                                                                    onPrevious,
                                                                    onSkipForward,
                                                                    onSkipBackward,
                                                                    onBack,
                                                                    onTogglePlay,
                                                                    onSeek,
                                                                    onSubtitleClick,
                                                                    onOpenMetadata,
                                                                    onSegmentChange,
                                                                }) => {

    // -------- 1. Find current cue index --------
    const currentCueIndex = useMemo(() => {
        if (!subtitleState.cues.length) return -1;

        return subtitleState.cues.findIndex(
            cue => currentTime >= cue.start && currentTime <= cue.end
        );
    }, [currentTime, subtitleState.cues]);

    // -------- 2. Current segment index --------
    let currentSegmentIndex = 0;

    if (currentCueIndex !== -1) {
        currentSegmentIndex = Math.floor(currentCueIndex / CUES_PER_SEGMENT);
    } else if (subtitleState.cues.length > 0) {
        const nextCue = subtitleState.cues.findIndex(c => c.start > currentTime);

        const fallbackIndex =
            nextCue > 0
                ? nextCue - 1
                : nextCue === 0
                    ? 0
                    : subtitleState.cues.length - 1;

        currentSegmentIndex = Math.floor(fallbackIndex / CUES_PER_SEGMENT);
    }

    // -------- 3. Slice cues for current segment --------
    const displayedCues = useMemo(() => {
        if (!subtitleState.cues.length) return [];

        const start = currentSegmentIndex * CUES_PER_SEGMENT;
        const end = start + CUES_PER_SEGMENT;

        return subtitleState.cues.slice(start, end);
    }, [subtitleState.cues, currentSegmentIndex]);

    // -------- 4. Total segments --------
    const totalSegments = subtitleState.cues.length
        ? Math.ceil(subtitleState.cues.length / CUES_PER_SEGMENT)
        : 1;

    // -------- 5. Segment markers (absolute time) --------
    const segmentMarkers = useMemo(() => {
        if (!subtitleState.cues.length) return [];

        const markers: number[] = [];

        for (let i = 1; i < totalSegments; i++) {
            const cueIndex = i * CUES_PER_SEGMENT;
            if (cueIndex < subtitleState.cues.length) {
                markers.push(subtitleState.cues[cueIndex].start);
            }
        }
        return markers;
    }, [subtitleState.cues, totalSegments]);

    // -------- Local cue index (relative within segment) --------
    const relativeCueIndex =
        currentCueIndex !== -1 ? currentCueIndex % CUES_PER_SEGMENT : -1;

    return (
        <PlayerView
            audioState={audioState}
            subtitleState={subtitleState}
            displayedCues={displayedCues}
            currentCueIndex={relativeCueIndex}
            currentTime={currentTime}
            duration={duration}

            currentSegmentIndex={currentSegmentIndex}
            totalSegments={totalSegments}
            segmentMarkers={segmentMarkers}
            onSegmentChange={onSegmentChange}

            isPlaying={isPlaying}
            onBack={onBack}
            onTogglePlay={onTogglePlay}
            onSeek={onSeek}
            onSubtitleClick={onSubtitleClick}
            onNext={onNext}
            onPrevious={onPrevious}
            onSkipForward={onSkipForward}
            onSkipBackward={onSkipBackward}
            onOpenMetadata={onOpenMetadata}

            hasNext={currentTrackIndex < playlistLength - 1}
            hasPrevious={currentTrackIndex > 0}
        />
    );
};
