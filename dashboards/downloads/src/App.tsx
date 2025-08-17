import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import DownloadsPage from './pages/DownloadsPage'
import { listen } from '@tauri-apps/api/event'
import './App.css'

interface DownloadProgress {
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
    status: string
    message?: string
}

interface DownloadComplete {
    download_id: string
    game_id: string
    install_path: string
    executable: string
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
}

function App() {
    const [downloads, setDownloads] = useState<Map<string, DownloadInfo>>(new Map())

    useEffect(() => {
        // Set up event listeners
        const unlistenProgress = listen<DownloadProgress>('download-progress', (event) => {
            setDownloads(prev => {
                const newMap = new Map(prev)
                const existing = newMap.get(event.payload.download_id) || {} as DownloadInfo
                newMap.set(event.payload.download_id, {
                    ...existing,
                    download_id: event.payload.download_id,
                    game_id: event.payload.game_id,
                    downloaded: event.payload.downloaded,
                    total: event.payload.total,
                    percentage: event.payload.percentage,
                    speed: event.payload.speed,
                    eta: event.payload.eta,
                    status: 'downloading'
                })
                return newMap
            })
        })

        const unlistenStatus = listen<DownloadStatus>('download-status', (event) => {
            setDownloads(prev => {
                const newMap = new Map(prev)
                const existing = newMap.get(event.payload.download_id) || {} as DownloadInfo

                // Handle different status types
                let status: DownloadInfo['status'] = existing.status || 'starting'
                if (event.payload.status === 'starting') {
                    status = 'starting'
                } else if (event.payload.status.includes('Extracting')) {
                    status = 'extracting'
                }

                newMap.set(event.payload.download_id, {
                    ...existing,
                    download_id: event.payload.download_id,
                    game_id: event.payload.game_id,
                    game_name: event.payload.game_name || existing.game_name,
                    statusMessage: event.payload.message,
                    status: status,
                    // Initialize default values if this is the first event
                    downloaded: existing.downloaded || 0,
                    total: existing.total || 0,
                    percentage: existing.percentage || 0,
                    speed: existing.speed || 0,
                    eta: existing.eta || 0
                })
                return newMap
            })
        })

        const unlistenComplete = listen<DownloadComplete>('download-complete', (event) => {
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
                    downloaded: existing.total || existing.downloaded || 0,
                    total: existing.total || existing.downloaded || 0,
                    speed: 0,
                    eta: 0
                })
                return newMap
            })
        })

        const unlistenError = listen<DownloadError>('download-error', (event) => {
            setDownloads(prev => {
                const newMap = new Map(prev)
                const existing = newMap.get(event.payload.download_id) || {} as DownloadInfo
                newMap.set(event.payload.download_id, {
                    ...existing,
                    download_id: event.payload.download_id,
                    game_id: event.payload.game_id,
                    status: 'error',
                    error: event.payload.error,
                    // Preserve existing values
                    downloaded: existing.downloaded || 0,
                    total: existing.total || 0,
                    percentage: existing.percentage || 0,
                    speed: 0,
                    eta: 0
                })
                return newMap
            })
        })

        // Cleanup listeners
        return () => {
            Promise.all([
                unlistenProgress,
                unlistenStatus,
                unlistenComplete,
                unlistenError
            ]).then(unsubs => unsubs.forEach(fn => fn()))
        }
    }, [])

    // Clean up completed downloads after a delay (optional)
    useEffect(() => {
        const interval = setInterval(() => {
            setDownloads(prev => {
                const newMap = new Map(prev)

                // Remove completed downloads after 5 minutes
                for (const [_id, download] of newMap.entries()) {
                    if (download.status === 'completed') {
                        // You could add a completedAt timestamp to track this better
                        // For now, we'll keep them until manually cleared
                    }
                }

                return newMap
            })
        }, 60000) // Check every minute

        return () => clearInterval(interval)
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