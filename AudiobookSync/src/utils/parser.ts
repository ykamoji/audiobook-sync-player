import { SubtitleCue } from './types.ts';
import uuid from 'react-native-uuid';

// Helper to convert timestamp string to seconds
// Formats supported: "MM:SS.mmm", "HH:MM:SS.mmm", "HH:MM:SS,mmm"
const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  const cleanStr = timeStr.trim().replace(',', '.');
  const parts = cleanStr.split(':');
  
  let seconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    seconds += parseInt(parts[0], 10) * 3600;
    seconds += parseInt(parts[1], 10) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS.mmm
    seconds += parseInt(parts[0], 10) * 60;
    seconds += parseFloat(parts[1]);
  }
  
  return seconds;
};

export const parseSubtitleText = (text: string): SubtitleCue[] => {
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const cues: SubtitleCue[] = [];
  const lines = text.split(/\r?\n/);
  
  let i = 0;
  
  // Detect format roughly
  const isVTT = text.trim().startsWith('WEBVTT');
  
  if (isVTT) {
    // Skip header
    while (i < lines.length && lines[i].trim() !== '') i++;
  }

  while (i < lines.length) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Check if line is just an index (digits only)
    // If so, we check if the NEXT line is a timestamp.
    if (/^\d+$/.test(line)) {
      if (i + 1 < lines.length && lines[i+1].includes('-->')) {
        // It was an index, move to next line which is the timestamp
        i++;
        line = lines[i].trim();
      }
    }

    // Check for Timestamp line
    if (line.includes('-->')) {
      const times = line.split('-->');
      if (times.length === 2) {
        const startStr = times[0].trim();
        // For VTT, the end time might be followed by settings like "align:start"
        // so we split by space and take the first part.
        const endStr = times[1].trim().split(/\s+/)[0]; 
        
        const start = parseTime(startStr);
        const end = parseTime(endStr);
        
        // Collect text
        let content = '';
        i++;
        while (i < lines.length && lines[i].trim() !== '') {
          // Check if the next line is a timestamp (edge case for bad formatting)
          if (lines[i].includes('-->')) break;
          
          content += (content ? '\n' : '') + lines[i].trim();
          i++;
        }
        
        // Clean up text (remove VTT tags like <b>, <v>, etc)
        content = content.replace(/<[^>]*>/g, '');

        if (content) {
            cues.push({
                id: uuid.v4().toString(),
                start,
                end,
                text: content
            });
        }
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return cues;
};

export const parseSubtitles = async (file: File): Promise<SubtitleCue[]> => {
  const text = await file.text();
  return parseSubtitleText(text);
};