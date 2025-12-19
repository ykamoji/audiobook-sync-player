import TrackPlayer from 'react-native-track-player';

const SKIP_INTERVAL = 10;

module.exports = async function () {
    TrackPlayer.addEventListener('remote-play', () => {
        TrackPlayer.play();
    });

    TrackPlayer.addEventListener('remote-pause', () => {
        TrackPlayer.pause();
    });

    TrackPlayer.addEventListener('remote-next', () => {
        TrackPlayer.skipToNext().catch(() => {});
    });

    TrackPlayer.addEventListener('remote-previous', () => {
        TrackPlayer.skipToPrevious().catch(() => {});
    });

    TrackPlayer.addEventListener('remote-seek', (event) => {
        TrackPlayer.seekTo(event.position);
    });

    TrackPlayer.addEventListener('remote-jump-forward', async () => {
        const position = await TrackPlayer.getPosition();
        const duration = await TrackPlayer.getDuration();

        await TrackPlayer.seekTo(
            Math.min(position + SKIP_INTERVAL, duration)
        );
    });

    TrackPlayer.addEventListener('remote-jump-backward', async () => {
        const position = await TrackPlayer.getPosition();

        await TrackPlayer.seekTo(
            Math.max(position - SKIP_INTERVAL, 0)
        );
    });
};