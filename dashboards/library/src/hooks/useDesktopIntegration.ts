import { useEffect, useState } from 'react';

export function useDesktopIntegration() {
    const [isDesktopApp, setIsDesktopApp] = useState(false);

    useEffect(() => {
        // @ts-ignore
        setIsDesktopApp(typeof window.__TAURI__ !== 'undefined');
    }, []);

    const downloadGame = async (gameId: string, downloadUrl: string) => {
        if (!isDesktopApp) {
            // Open download in browser
            window.open(downloadUrl, '_blank');
            return;
        }

        // Use Tauri API to download
        try {
            // @ts-ignore
            await window.__TAURI__.core.invoke('download_game', {
                gameId,
                downloadUrl
            });
        } catch (error) {
            console.error('Failed to download game:', error);
        }
    };

    const launchGame = async (gameId: string, executablePath: string) => {
        if (!isDesktopApp) {
            alert('Please use the VAPR desktop app to launch games');
            return;
        }

        try {
            // @ts-ignore
            await window.__TAURI__.core.invoke('launch_game', {
                gameId,
                executablePath
            });
        } catch (error) {
            console.error('Failed to launch game:', error);
        }
    };

    return {
        isDesktopApp,
        downloadGame,
        launchGame
    };
}