
export const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes * 1024 * 1024) / Math.log(k));
    return `${parseFloat((bytes * 1024 * 1024 / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
};

export const formatDuration = (seconds: number) => {
    if (!seconds) return 'Unknown';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};

export const formatProgress = (progress: number) => {
    if (!progress) return 'Unknown';
    const m = Math.floor(progress/ 60);
    const s = Math.floor(progress % 60);
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};
