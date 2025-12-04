import React from "react";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Rewind,
    FastForward,
    Upload,
    Music,
    FileText,
    Folder,
    List,
    Library,
    ChevronLeft,
    ChevronDown,
    Plus,
    MoreHorizontal,
    Trash2,
    Circle,
    CheckCircle,
    Save,
    Info,
    X,
    Repeat,
    Headphones,
    Edit3,
    BookMarked
} from "lucide-react-native";

interface IconProps {
    size?: number;
    color?: string;
}

/* ========== BASIC PLAYER ICONS ========== */

export const PlayIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Play size={size} color={color} />;

export const PauseIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Pause size={size} color={color} />;

export const SkipBackIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <SkipBack size={size} color={color} />;

export const SkipForwardIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <SkipForward size={size} color={color} />;

export const Rewind10Icon = ({ size = 28, color = "#fff" }: IconProps) =>
    <Rewind size={size} color={color} />;

export const Forward10Icon = ({ size = 28, color = "#fff" }: IconProps) =>
    <FastForward size={size} color={color} />;

/* ========== UI ICONS ========== */

export const UploadIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Upload size={size} color={color} />;

export const MusicIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Music size={size} color={color} />;

export const FileTextIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <FileText size={size} color={color} />;

export const FolderIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Folder size={size} color={color} />;

export const ListIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <List size={size} color={color} />;

export const LibraryIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Library size={size} color={color} />;

/* ========== NAV + ACTION ICONS ========== */

export const ChevronLeftIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <ChevronLeft size={size} color={color} />;

export const ChevronDownIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <ChevronDown size={size} color={color} />;

export const PlusIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Plus size={size} color={color} />;

export const MoreHorizontalIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <MoreHorizontal size={size} color={color} />;

export const TrashIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Trash2 size={size} color={color} />;

export const CircleIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Circle size={size} color={color} />;

export const CheckCircleIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <CheckCircle size={size} color={color} />;

export const SaveIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Save size={size} color={color} />;

export const InfoIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Info size={size} color={color} />;

export const XIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <X size={size} color={color} />;

/* ========== SPECIAL ICONS ========== */

export const RepeatIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Repeat size={size} color={color} />;

export const HeadphoneIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Headphones size={size} color={color} />;

export const PencilIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Edit3 size={size} color={color} />;

export const ChaptersIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <BookMarked size={size} color={color} />;
