import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import DownloadsPage from './pages/DownloadsPage'
import { listen } from '@tauri-apps/api/event'
import './App.css'
import {invoke} from "@tauri-apps/api/core";

interface DownloadProgress {
    game_cover: string | undefined;
    game_name: string | undefined;
    download_id: string
    game_id: string
    downloaded: number
    total: number
    percentage: number
    speed: number
    eta: number
}

interface DownloadStatus {
    download_id: string
    game_id: string
    game_name?: string
    game_cover?: string
    status: string
    message?: string
    version?: string
    is_update?: boolean
}

interface DownloadComplete {
    download_id: string
    game_id: string
    install_path: string
    executable: string
    version?: string
    is_update?: boolean
}

interface DownloadError {
    download_id: string
    game_id: string
    error: string
}

interface DownloadInfo {
    download_id: string
    game_id: string
    game_name?: string
    game_cover?: string
    downloaded: number
    total: number
    percentage: number
    speed: number
    eta: number
    status: 'starting' | 'downloading' | 'paused' | 'completed' | 'error' | 'extracting'
    statusMessage?: string
    error?: string
    install_path?: string
    executable?: string
    version?: string
    is_update?: boolean
    lastUpdate?: number
    smoothedPercentage?: number
    smoothedSpeed?: number
}

function App() {
    const [downloads, setDownloads] = useState<Map<string, DownloadInfo>>(new Map())
    const progressHistoryRef = useRef<Map<string, number[]>>(new Map())
    const speedHistoryRef = useRef<Map<string, number[]>>(new Map())
    const lastProgressRef = useRef<Map<string, number>>(new Map())

    const smoothValue = (downloadId: string, newValue: number, historyMap: Map<string, number[]>, maxHistory: number = 5) => {
        const history = historyMap.get(downloadId) || []
        history.push(newValue)

        if (history.length > maxHistory) {
            history.shift()
        }

        historyMap.set(downloadId, history)

        const avg = history.reduce((a, b) => a + b, 0) / history.length
        return avg
    }

    useEffect(() => {
        const unlistenStatus = listen<DownloadStatus>('download-status', (event) => {
            console.log('=== DOWNLOAD STATUS EVENT ===', event.payload);

            setDownloads(prev => {
                const newMap = new Map(prev)
                const existing = newMap.get(event.payload.download_id) || {} as DownloadInfo

                const newStatus = event.payload.status === 'starting' ? 'starting' :
                    event.payload.status.includes('Extracting') ? 'extracting' :
                        event.payload.status === 'downloading' ? 'downloading' :
                            event.payload.status === 'paused' ? 'paused' :
                                event.payload.status === 'completed' ? 'completed' :
                                    event.payload.status === 'error' ? 'error' :
                                        existing.status || 'starting';

                const updatedInfo = {
                    ...existing,
                    download_id: event.payload.download_id,
                    game_id: event.payload.game_id,
                    game_name: event.payload.game_name || existing.game_name,
                    game_cover: event.payload.game_cover || existing.game_cover,
                    statusMessage: event.payload.message,
                    status: newStatus,
                    downloaded: existing.downloaded || 0,
                    total: existing.total || 0,
                    percentage: existing.percentage || 0,
                    smoothedPercentage: existing.smoothedPercentage || 0,
                    speed: existing.speed || 0,
                    smoothedSpeed: existing.smoothedSpeed || 0,
                    eta: existing.eta || 0,
                    version: event.payload.version || existing.version,
                    is_update: event.payload.is_update !== undefined ? event.payload.is_update : existing.is_update,
                    lastUpdate: Date.now()
                };

                console.log('=== UPDATED DOWNLOAD INFO ===', updatedInfo);
                newMap.set(event.payload.download_id, updatedInfo);
                return newMap
            })
        })

        const unlistenProgress = listen<DownloadProgress>('download-progress', (event) => {
            console.log('=== DOWNLOAD PROGRESS EVENT ===', event.payload);

            setDownloads(prev => {
                const newMap = new Map(prev)
                const existing = newMap.get(event.payload.download_id) || {} as DownloadInfo

                const now = Date.now()
                const timeSinceLastUpdate = now - (existing.lastUpdate || 0)

                if (timeSinceLastUpdate < 100) {
                    return prev
                }

                const lastProgress = lastProgressRef.current.get(event.payload.download_id) || 0
                const actualPercentage = event.payload.percentage

                if (actualPercentage < lastProgress - 5) {
                    return prev
                }

                lastProgressRef.current.set(event.payload.download_id, actualPercentage)

                const smoothedPercentage = smoothValue(
                    event.payload.download_id,
                    actualPercentage,
                    progressHistoryRef.current,
                    3
                )

                const smoothedSpeed = smoothValue(
                    event.payload.download_id,
                    event.payload.speed,
                    speedHistoryRef.current,
                    5
                )

                const finalPercentage = Math.max(
                    existing.smoothedPercentage || 0,
                    Math.min(smoothedPercentage, actualPercentage)
                )

                const updatedInfo = {
                    ...existing,
                    download_id: event.payload.download_id,
                    game_id: event.payload.game_id,
                    game_name: event.payload.game_name || existing.game_name,
                    game_cover: event.payload.game_cover || existing.game_cover,
                    downloaded: event.payload.downloaded,
                    total: event.payload.total,
                    percentage: actualPercentage,
                    smoothedPercentage: finalPercentage,
                    speed: event.payload.speed,
                    smoothedSpeed: smoothedSpeed,
                    eta: event.payload.eta,
                    status: 'downloading' as const,
                    lastUpdate: now
                };

                console.log('=== UPDATED DOWNLOAD INFO ===', updatedInfo);
                newMap.set(event.payload.download_id, updatedInfo);
                return newMap
            })
        })

        const unlistenComplete = listen<DownloadComplete>('download-complete', async (event) => {
            console.log('=== DOWNLOAD COMPLETE EVENT ===', event.payload);

            const existing = downloads.get(event.payload.download_id);

            progressHistoryRef.current.delete(event.payload.download_id)
            speedHistoryRef.current.delete(event.payload.download_id)
            lastProgressRef.current.delete(event.payload.download_id)

            if (event.payload.is_update && event.payload.game_id && event.payload.version) {
                try {
                    console.log('Handling update completion for game:', event.payload.game_id);

                    await invoke('update_game_version', {
                        gameId: event.payload.game_id,
                        version: event.payload.version
                    });

                    const response = await fetch(`/api/updates/${event.payload.game_id}/downloaded`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ version: event.payload.version })
                    });

                    if (!response.ok) {
                        console.error('Failed to mark update as downloaded:', response.statusText);
                    }

                    await invoke('refresh_installed_games');

                    await invoke('emit_to_main_window', {
                        event: 'update-completed',
                        payload: {
                            gameId: event.payload.game_id,
                            version: event.payload.version,
                            gameName: existing?.game_name || 'Game'
                        }
                    });

                    await invoke('show_notification', {
                        title: 'Update Complete',
                        body: `${existing?.game_name || 'Game'} has been updated to v${event.payload.version}!`
                    });

                } catch (error) {
                    console.error('Failed to handle update completion:', error);
                }
            }

            setDownloads(prev => {
                const newMap = new Map(prev)
                const existing = newMap.get(event.payload.download_id) || {} as DownloadInfo
                newMap.set(event.payload.download_id, {
                    ...existing,
                    download_id: event.payload.download_id,
                    game_id: event.payload.game_id,
                    install_path: event.payload.install_path,
                    executable: event.payload.executable,
                    status: 'completed',
                    percentage: 100,
                    smoothedPercentage: 100,
                    downloaded: existing.total || existing.downloaded || 0,
                    total: existing.total || existing.downloaded || 0,
                    speed: 0,
                    smoothedSpeed: 0,
                    eta: 0,
                    version: event.payload.version,
                    is_update: event.payload.is_update
                })
                return newMap
            })
        })

        const unlistenError = listen<DownloadError>('download-error', (event) => {
            progressHistoryRef.current.delete(event.payload.download_id)
            speedHistoryRef.current.delete(event.payload.download_id)
            lastProgressRef.current.delete(event.payload.download_id)

            setDownloads(prev => {
                const newMap = new Map(prev)
                const existing = newMap.get(event.payload.download_id) || {} as DownloadInfo
                newMap.set(event.payload.download_id, {
                    ...existing,
                    download_id: event.payload.download_id,
                    game_id: event.payload.game_id,
                    status: 'error',
                    error: event.payload.error,
                    downloaded: existing.downloaded || 0,
                    total: existing.total || 0,
                    percentage: existing.percentage || 0,
                    smoothedPercentage: existing.smoothedPercentage || 0,
                    speed: 0,
                    smoothedSpeed: 0,
                    eta: 0
                })
                return newMap
            })
        })

        const loadActiveDownloads = async () => {
            try {
                const activeDownloads = await invoke<any[]>('get_active_downloads');
                const newMap = new Map<string, DownloadInfo>();
                activeDownloads.forEach(download => {
                    newMap.set(download.download_id, download);
                });
                setDownloads(newMap);
            } catch (error) {
                console.error('Failed to get active downloads:', error);
            }
        }

        loadActiveDownloads();

        return () => {
            Promise.all([
                unlistenProgress,
                unlistenStatus,
                unlistenComplete,
                unlistenError
            ]).then(unsubs => unsubs.forEach(fn => fn()))
        }
    }, [])

    return (
        <Router basename="/downloads">
            <Routes>
                <Route path="/" element={<DownloadsPage downloads={downloads} />} />
            </Routes>
        </Router>
    )
}

export default App