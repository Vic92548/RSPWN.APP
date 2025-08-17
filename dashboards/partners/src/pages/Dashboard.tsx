// dashboards/partners/src/pages/Dashboard.tsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import TebexOnboardingModal from "@/components/TebexOnboardingModal"
import apiClient from "@/lib/api-client"
import {
    Gamepad2,
    Users,
    Clock,
    UserPlus,
    Plus,
    EyeOff,
    ShoppingCart,
    Activity,
    TrendingUp,
    Settings
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
    isHidden?: boolean;
    isEarlyAccess?: boolean;
    ownerId?: string;
    stats?: {
        playerCount: number;
        totalKeys: number;
        usedKeys: number;
        availableKeys: number;
        totalPlaytimeSeconds: number;
    };
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
    const [gameAnalytics, setGameAnalytics] = useState<Record<string, any>>({});
    const [showTebexOnboarding, setShowTebexOnboarding] = useState(false);
    const [hasTebexConfig, setHasTebexConfig] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, analyticsData, tebexData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getAnalytics('30'),
                apiClient.getTebexConfig()
            ]);

            setUser(userData);
            setGames(gamesData.games);
            setAnalytics(analyticsData);

            const hasConfig = tebexData.config && tebexData.config.hasConfig;
            // @ts-ignore
            setHasTebexConfig(hasConfig);

            if (gamesData.games.length > 0 && !hasConfig) {
                setShowTebexOnboarding(true);
            }

            const playerCounts: Record<string, number> = {};
            const gameAnalyticsData: Record<string, any> = {};

            for (const game of gamesData.games) {
                try {
                    const [keysData, analyticsResponse] = await Promise.all([
                        apiClient.getGameKeys(game.id),
                        apiClient.getGameAnalytics(game.id, 7)
                    ]);

                    playerCounts[game.id] = keysData.keys.filter(k => k.usedBy).length;
                    gameAnalyticsData[game.id] = analyticsResponse.analytics;
                } catch (error) {
                    playerCounts[game.id] = 0;
                    gameAnalyticsData[game.id] = null;
                }
            }

            setGamePlayers(playerCounts);
            setGameAnalytics(gameAnalyticsData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTebexOnboardingComplete = () => {
        setShowTebexOnboarding(false);
        setHasTebexConfig(true);
        loadDashboardData();
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

    const calculateTotalMetrics = () => {
        let totalPlayers = 0;
        let totalActivePlayers = 0;
        let totalPlaytimeHours = 0;
        let totalSessions = 0;

        Object.values(gameAnalytics).forEach(analytics => {
            if (analytics) {
                totalPlayers += analytics.overview.totalPlayers || 0;
                totalActivePlayers += analytics.overview.activePlayers || 0;
                totalPlaytimeHours += analytics.overview.totalPlaytimeHours || 0;
                totalSessions += analytics.overview.totalSessions || 0;
            }
        });

        return { totalPlayers, totalActivePlayers, totalPlaytimeHours, totalSessions };
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

    const totals = calculateTotalMetrics();

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                {games.length > 0 && !hasTebexConfig && !showTebexOnboarding && (
                    <Card className="mb-8 border-yellow-600/50 bg-yellow-600/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="h-5 w-5 text-yellow-600" />
                                    <div>
                                        <p className="font-semibold">Complete Your Setup</p>
                                        <p className="text-sm text-muted-foreground">
                                            Configure Tebex to start accepting payments for your games
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowTebexOnboarding(true)}
                                >
                                    Setup Payments
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(totals.totalPlayers)}</div>
                            <p className="text-xs text-muted-foreground">Across all games</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(totals.totalActivePlayers)}</div>
                            <p className="text-xs text-muted-foreground">Last 7 days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Playtime</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPlaytime(totals.totalPlaytimeHours * 3600)}</div>
                            <p className="text-xs text-muted-foreground">Last 7 days</p>
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
                </div>

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
                            {games.map((game) => {
                                const gameStats = gameAnalytics[game.id];
                                const activePlayers = gameStats?.overview?.activePlayers || 0;
                                const avgSession = gameStats?.overview?.avgSessionMinutes || 0;
                                const recentPlaytime = gameStats?.overview?.totalPlaytimeHours || 0;

                                return (
                                    <Link to={`/games/${game.id}`} key={game.id} className="block">
                                        <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
                                            <div className="aspect-video relative">
                                                <img
                                                    src={game.coverImage || '/default-game-cover.png'}
                                                    alt={game.title}
                                                    className="object-cover w-full h-full"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <Badge variant="secondary">
                                                        v{game.currentVersion}
                                                    </Badge>
                                                    {game.isHidden && (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <EyeOff className="h-3 w-3" />
                                                            Hidden
                                                        </Badge>
                                                    )}
                                                    {game.isEarlyAccess && (
                                                        <Badge variant="secondary" className="gap-1">
                                                            Early Access
                                                        </Badge>
                                                    )}
                                                </div>
                                                {game.totalPlaytimeSeconds > 0 && (
                                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                                                        {formatPlaytime(game.totalPlaytimeSeconds)} total
                                                    </div>
                                                )}
                                            </div>
                                            <CardHeader>
                                                <CardTitle>{game.title}</CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {game.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span>{gamePlayers[game.id] || 0} players</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                                        <span>{activePlayers} active</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span>{formatPlaytime(recentPlaytime * 3600)} (7d)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                        <span>{avgSession}m avg</span>
                                                    </div>
                                                </div>
                                                {game.isHidden && (
                                                    <div className="mt-3 p-2 bg-muted rounded-md">
                                                        <p className="text-xs text-muted-foreground">
                                                            This game requires a key to access
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter>
                                                <Button variant="outline" className="w-full" onClick={(e) => e.preventDefault()}>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Manage Game
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <TebexOnboardingModal
                isOpen={showTebexOnboarding}
                onComplete={handleTebexOnboardingComplete}
                canSkip={false}
            />
        </Layout>
    );
}