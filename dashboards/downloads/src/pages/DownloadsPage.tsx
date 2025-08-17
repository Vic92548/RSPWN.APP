import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pause, Play, X, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { invoke } from '@tauri-apps/api/core'

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
}

interface DownloadsPageProps {
    downloads: Map<string, DownloadInfo>
}

export default function DownloadsPage({ downloads }: DownloadsPageProps) {
    // Add a refresh mechanism
    useEffect(() => {
        // Request current downloads when component mounts
        const getActiveDownloads = async () => {
            try {
                // You might want to add a command to get current downloads
                // For now, the downloads will populate as events come in
            } catch (error) {
                console.error('Failed to get active downloads:', error)
            }
        }

        getActiveDownloads()
    }, [])

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatSpeed = (bytesPerSecond: number) => {
        return formatBytes(bytesPerSecond * 1024 * 1024) + '/s'
    }

    const formatETA = (seconds: number) => {
        if (seconds === 0 || !isFinite(seconds)) return '-'

        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`
        } else {
            return `${secs}s`
        }
    }

    const handlePause = async (downloadId: string) => {
        try {
            await invoke('pause_download', { downloadId })
        } catch (error) {
            console.error('Failed to pause download:', error)
        }
    }

    const handleResume = async (downloadId: string) => {
        try {
            await invoke('resume_download', { downloadId })
        } catch (error) {
            console.error('Failed to resume download:', error)
        }
    }

    const handleCancel = async (downloadId: string) => {
        try {
            await invoke('cancel_download', { downloadId })
        } catch (error) {
            console.error('Failed to cancel download:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'starting':
                return <Badge className="bg-gray-500">Starting</Badge>
            case 'downloading':
                return <Badge className="bg-blue-500">Downloading</Badge>
            case 'paused':
                return <Badge className="bg-yellow-500">Paused</Badge>
            case 'completed':
                return <Badge className="bg-green-500">Completed</Badge>
            case 'error':
                return <Badge variant="destructive">Error</Badge>
            case 'extracting':
                return <Badge className="bg-purple-500">Extracting</Badge>
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const downloadsArray = Array.from(downloads.values())

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Downloads</h1>
                    <p className="text-muted-foreground">Manage your game downloads</p>
                </div>

                {downloadsArray.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Download className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-lg">No active downloads</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {downloadsArray.map((download) => (
                            <Card key={download.download_id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {download.game_name || `Game ${download.game_id}`}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {download.statusMessage ||
                                                    (download.status === 'starting' ? 'Preparing download...' :
                                                        download.status === 'completed' ? 'Download complete' :
                                                            download.status === 'error' ? download.error :
                                                                `${formatBytes(download.downloaded || 0)} / ${formatBytes(download.total || 0)}`)}
                                            </p>
                                        </div>
                                        {getStatusBadge(download.status)}
                                    </div>

                                    {download.status === 'starting' && (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    )}

                                    {(download.status === 'downloading' || download.status === 'paused') && (
                                        <>
                                            <Progress value={download.percentage || 0} className="mb-4" />

                                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                                <span>{(download.percentage || 0).toFixed(1)}%</span>
                                                <span>{formatSpeed(download.speed || 0)}</span>
                                                <span>ETA: {formatETA(download.eta || 0)}</span>
                                            </div>
                                        </>
                                    )}

                                    {download.status === 'extracting' && (
                                        <Progress value={100} className="mb-4 animate-pulse" />
                                    )}

                                    <div className="flex gap-2">
                                        {download.status === 'downloading' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handlePause(download.download_id)}
                                            >
                                                <Pause className="h-4 w-4 mr-1" />
                                                Pause
                                            </Button>
                                        )}

                                        {download.status === 'paused' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleResume(download.download_id)}
                                            >
                                                <Play className="h-4 w-4 mr-1" />
                                                Resume
                                            </Button>
                                        )}

                                        {(download.status === 'downloading' || download.status === 'paused' || download.status === 'starting') && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleCancel(download.download_id)}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                        )}

                                        {download.status === 'completed' && (
                                            <Button size="sm" variant="outline" disabled>
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Completed
                                            </Button>
                                        )}

                                        {download.status === 'error' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleResume(download.download_id)}
                                            >
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                Retry
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}