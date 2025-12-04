import React from "react";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

interface IconProps {
    size?: number;
    color?: string;
}

/* ========== BASIC PLAYER ICONS ========== */

export const PlayIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="play" size={size} color={color} />;

export const PauseIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="pause" size={size} color={color} />;

export const SkipBackIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="skip-back" size={size} color={color} />;

export const SkipForwardIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="skip-forward" size={size} color={color} />;

export const Rewind10Icon = ({ size = 28, color = "#fff" }: IconProps) =>
    <Ionicons name="play-back-outline" size={size} color={color} />;

export const Forward10Icon = ({ size = 28, color = "#fff" }: IconProps) =>
    <Ionicons name="play-forward-outline" size={size} color={color} />;

/* ========== UI ICONS ========== */

export const UploadIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="upload" size={size} color={color} />;

export const MusicIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="music" size={size} color={color} />;

export const FileTextIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="file-text" size={size} color={color} />;

export const FolderIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="folder" size={size} color={color} />;

export const ListIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="list" size={size} color={color} />;

export const LibraryIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <MaterialCommunityIcons name="library-shelves" size={size} color={color} />;

/* ========== NAV + ACTION ICONS ========== */

export const ChevronLeftIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="chevron-left" size={size} color={color} />;

export const ChevronDownIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="chevron-down" size={size} color={color} />;

export const PlusIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="plus" size={size} color={color} />;

export const MoreHorizontalIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="more-horizontal" size={size} color={color} />;

export const TrashIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="trash" size={size} color={color} />;

export const CircleIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="circle" size={size} color={color} />;

export const CheckCircleIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="check-circle" size={size} color={color} />;

export const SaveIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="save" size={size} color={color} />;

export const InfoIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="info" size={size} color={color} />;

export const XIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="x" size={size} color={color} />;

/* ========== SPECIAL ICONS ========== */

export const RepeatIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="repeat" size={size} color={color} />;

export const HeadphoneIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="headphones" size={size} color={color} />;

export const PencilIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <Feather name="edit-3" size={size} color={color} />;

export const ChaptersIcon = ({ size = 24, color = "#fff" }: IconProps) =>
    <MaterialCommunityIcons name="bookmark-multiple-outline" size={size} color={color} />;
