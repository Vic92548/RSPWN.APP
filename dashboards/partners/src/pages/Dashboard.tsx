import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import apiClient from "@/lib/api-client"
import {
    Gamepad2,
    Key,
    BarChart3,
    Users,
    Clock,
    Package,
    Eye,
    Heart,
    UserPlus,
    Plus
} from "lucide-react"

interface Game {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    downloadUrl: string;
    currentVersion: string;
    createdAt: string;
    ownedAt: string;
    totalPlaytimeSeconds: number;
}

interface User {
    id: string;
    username: string;
    email: string;
    avatar: string;
    level: number;
    xp: number;
    xp_required: number;
}

interface Analytics {
    totals: {
        views: number;
        likes: number;
        dislikes: number;
        follows: number;
        clicks: number;
        followers: number;
    };
}

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [games, setGames] = useState<Game[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [gamePlayers, setGamePlayers] = useState<Record<string, number>>({});

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, analyticsData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getAnalytics('30')
            ]);

            setUser(userData);
            setGames(gamesData.games);
            setAnalytics(analyticsData);

            // Load player counts for each game
            const playerCounts: Record<string, number> = {};
            for (const game of gamesData.games) {
                try {
                    const keysData = await apiClient.getGameKeys(game.id);
                    playerCounts[game.id] = keysData.keys.filter(k => k.usedBy).length;
                } catch (error) {
                    playerCounts[game.id] = 0;
                }
            }
            setGamePlayers(playerCounts);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPlaytime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <Gamepad2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.totals.views || 0)}</div>
                            <p className="text-xs text-muted-foreground">Across all content</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.totals.likes || 0)}</div>
                            <p className="text-xs text-muted-foreground">Player engagement</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Followers</CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.totals.followers || 0)}</div>
                            <p className="text-xs text-muted-foreground">Growing community</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Games</CardTitle>
                            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{games.length}</div>
                            <p className="text-xs text-muted-foreground">Published games</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Games Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">My Games</h2>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Game
                        </Button>
                    </div>

                    {games.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No games yet</h3>
                                <p className="text-muted-foreground mb-4">Start by adding your first game to VAPR</p>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Game
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {games.map((game) => (
                                <Card key={game.id} className="overflow-hidden">
                                    <div className="aspect-video relative">
                                        <img
                                            src={game.coverImage || '/default-game-cover.png'}
                                            alt={game.title}
                                            className="object-cover w-full h-full"
                                        />
                                        <Badge className="absolute top-2 right-2" variant="secondary">
                                            v{game.currentVersion}
                                        </Badge>
                                    </div>
                                    <CardHeader>
                                        <CardTitle>{game.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {game.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{formatPlaytime(game.totalPlaytimeSeconds)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{gamePlayers[game.id] || 0} players</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="grid grid-cols-3 gap-2">
                                        <Link to={`/games/${game.id}/stats`}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1 w-full"
                                            >
                                                <BarChart3 className="h-3 w-3" />
                                                Stats
                                            </Button>
                                        </Link>
                                        <Link to={`/games/${game.id}/keys`}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1 w-full"
                                            >
                                                <Key className="h-3 w-3" />
                                                Keys
                                            </Button>
                                        </Link>
                                        <Link to={`/games/${game.id}/updates`}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1 w-full"
                                            >
                                                <Package className="h-3 w-3" />
                                                Update
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}