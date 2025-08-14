import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import {
    ArrowLeft,
    Play,
    Clock,
    Calendar,
    Package,
    Globe
} from "lucide-react";
import apiClient from "@/lib/api-client";

export default function GameDetail() {
    const { gameId } = useParams<{ gameId: string }>();
    const [user, setUser] = useState<any>(null);
    const [game, setGame] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGameData();
    }, [gameId]);

    const loadGameData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, versionsData, playtimeData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getGameVersions(gameId!),
                apiClient.getPlaytimeTotals()
            ]);

            setUser(userData);

            const gameData = gamesData.games.find(g => g.id === gameId);
            if (gameData) {
                const playtime = playtimeData.totals.find(t => t.gameId === gameId);
                setGame({
                    ...gameData,
                    totalPlaytimeSeconds: playtime?.totalSeconds || 0
                });
            }

            setVersions(versionsData.versions);
        } catch (error) {
            console.error('Failed to load game data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPlaytime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours} hours ${minutes} minutes`;
        }
        return `${minutes} minutes`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading game details...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!game) {
        return (
            <Layout user={user}>
                <div className="container mx-auto px-4 py-8">
                    <p>Game not found</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/library">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* Game Hero */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-1">
                        <img
                            src={game.coverImage}
                            alt={game.title}
                            className="w-full rounded-lg shadow-lg"
                        />
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
                            <p className="text-lg text-muted-foreground">{game.description}</p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Card className="flex-1 min-w-[200px]">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Playtime</p>
                                            <p className="font-semibold">{formatPlaytime(game.totalPlaytimeSeconds)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex-1 min-w-[200px]">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Owned Since</p>
                                            <p className="font-semibold">{formatDate(game.ownedAt)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex-1 min-w-[200px]">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Current Version</p>
                                            <p className="font-semibold">v{game.currentVersion}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex gap-4">
                            <Button size="lg" className="gap-2">
                                <Play className="h-5 w-5" />
                                Play Now
                            </Button>
                            <Button size="lg" variant="outline" className="gap-2">
                                <Globe className="h-5 w-5" />
                                View Store Page
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="updates">Updates & Versions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Game Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Release Date</p>
                                        <p className="font-medium">{formatDate(game.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Last Played</p>
                                        <p className="font-medium">Yesterday</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Install Size</p>
                                        <p className="font-medium">2.5 GB</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Download URL</p>
                                        <p className="font-medium">
                                            {game.downloadUrl ? 'Available' : 'Not available'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="updates" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Version History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {versions.length === 0 ? (
                                    <p className="text-muted-foreground">No version history available</p>
                                ) : (
                                    <div className="space-y-4">
                                        {versions.map((version) => (
                                            <div key={version.id} className="border-l-2 border-muted pl-4 pb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold">v{version.version}</h4>
                                                        {version.isRequired && (
                                                            <Badge variant="destructive">Required</Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(version.createdAt)}
                                                    </span>
                                                </div>
                                                {version.changelog && (
                                                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                        {version.changelog}
                                                    </pre>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}