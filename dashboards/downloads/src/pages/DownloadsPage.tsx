import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Pause,
    Play,
    X,
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Gamepad2,
    Clock,
    Zap,
    RefreshCw
} from "lucide-react"
import { invoke } from '@tauri-apps/api/core'

// Add custom styles
const customStyles = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`

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

interface DownloadsPageProps {
    downloads: Map<string, DownloadInfo>
}

export default function DownloadsPage({ downloads }: DownloadsPageProps) {
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'active' | 'completed'>('all')

    useEffect(() => {
        // Inject custom styles
        const styleSheet = document.createElement("style")
        styleSheet.textContent = customStyles
        document.head.appendChild(styleSheet)

        return () => {
            document.head.removeChild(styleSheet)
        }
    }, [])

    useEffect(() => {
        const getActiveDownloads = async () => {
            try {
                // Request current downloads when component mounts
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
        if (seconds === 0 || !isFinite(seconds)) return '--'

        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)

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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'downloading':
                return <Download className="h-4 w-4" />
            case 'paused':
                return <Pause className="h-4 w-4" />
            case 'completed':
                return <CheckCircle2 className="h-4 w-4" />
            case 'error':
                return <AlertCircle className="h-4 w-4" />
            case 'extracting':
                return <RefreshCw className="h-4 w-4 animate-spin" />
            default:
                return <Loader2 className="h-4 w-4 animate-spin" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'downloading':
                return 'text-blue-500'
            case 'paused':
                return 'text-yellow-500'
            case 'completed':
                return 'text-green-500'
            case 'error':
                return 'text-red-500'
            case 'extracting':
                return 'text-purple-500'
            default:
                return 'text-gray-500'
        }
    }

    const downloadsArray = Array.from(downloads.values())

    // Filter downloads based on selected category
    const filteredDownloads = downloadsArray.filter(download => {
        if (selectedCategory === 'all') return true
        if (selectedCategory === 'active') return ['downloading', 'paused', 'starting', 'extracting'].includes(download.status)
        if (selectedCategory === 'completed') return download.status === 'completed'
        return true
    })

    // Calculate summary stats
    const activeDownloads = downloadsArray.filter(d => d.status === 'downloading').length
    const totalSpeed = downloadsArray
        .filter(d => d.status === 'downloading')
        .reduce((sum, d) => sum + (d.speed || 0), 0)

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold">Downloads</h1>
                            {activeDownloads > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    <span>{formatSpeed(totalSpeed)}</span>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span>{activeDownloads} active</span>
                                </div>
                            )}
                        </div>

                        {/* Category Tabs */}
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setSelectedCategory('active')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    selectedCategory === 'active'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setSelectedCategory('completed')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                    selectedCategory === 'completed'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {filteredDownloads.length === 0 ? (
                    <Card className="border-dashed">
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="rounded-full bg-muted/50 p-4 mb-4">
                                <Download className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-lg font-medium">No downloads</p>
                            <p className="text-muted-foreground text-sm mt-1">
                                {selectedCategory === 'active' ? 'No active downloads' :
                                    selectedCategory === 'completed' ? 'No completed downloads' :
                                        'Your downloads will appear here'}
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredDownloads.map((download) => (
                            <Card
                                key={download.download_id}
                                className={`overflow-hidden transition-all duration-200 ${
                                    download.status === 'downloading' ? 'ring-1 ring-blue-500/20' : ''
                                }`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Game Icon Placeholder */}
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                                <Gamepad2 className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg truncate">
                                                        {download.game_name || `Game ${download.game_id}`}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`flex items-center gap-1.5 text-sm ${getStatusColor(download.status)}`}>
                                                            {getStatusIcon(download.status)}
                                                            <span className="capitalize">{download.status}</span>
                                                        </span>
                                                        {download.status === 'error' && download.error && (
                                                            <span className="text-sm text-muted-foreground">• {download.error}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2">
                                                    {download.status === 'downloading' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handlePause(download.download_id)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Pause className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {download.status === 'paused' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleResume(download.download_id)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Play className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {(download.status === 'downloading' || download.status === 'paused' || download.status === 'starting') && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleCancel(download.download_id)}
                                                            className="h-8 w-8 p-0 hover:text-destructive"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {download.status === 'error' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleResume(download.download_id)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress Section */}
                                            {(download.status === 'downloading' || download.status === 'paused') && (
                                                <>
                                                    <div className="relative w-full h-3 bg-muted/50 rounded-full overflow-hidden mb-2">
                                                        <div
                                                            className="absolute inset-0 h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                                                            style={{ width: `${download.percentage || 0}%` }}
                                                        />
                                                        <div className="absolute inset-0 h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">
                                                            {formatBytes(download.downloaded || 0)} / {formatBytes(download.total || 0)}
                                                        </span>
                                                        <div className="flex items-center gap-4 text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Zap className="h-3 w-3" />
                                                                {formatSpeed(download.speed || 0)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatETA(download.eta || 0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {download.status === 'extracting' && (
                                                <div className="mt-2">
                                                    <div className="relative w-full h-3 bg-muted/50 rounded-full overflow-hidden">
                                                        <div
                                                            className="absolute inset-0 h-full bg-gradient-to-r from-purple-600 to-purple-500 animate-pulse"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {download.statusMessage || 'Extracting files...'}
                                                    </p>
                                                </div>
                                            )}

                                            {download.status === 'starting' && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {download.statusMessage || 'Preparing download...'}
                                                </p>
                                            )}

                                            {download.status === 'completed' && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Download complete • {formatBytes(download.total || 0)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}