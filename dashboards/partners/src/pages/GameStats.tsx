import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/Layout";
import { ArrowLeft, BarChart3, Eye, Heart, Users, Calendar, TrendingUp, Clock, Activity, GamepadIcon } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function GameStats() {
    const { gameId } = useParams<{ gameId: string }>();
    const [loading, setLoading] = useState(true);
    const [game, setGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [timeRange, setTimeRange] = useState(30);

    useEffect(() => {
        loadData();
    }, [gameId, timeRange]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, keysData, postsData, analyticsData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getGameKeys(gameId!),
                apiClient.getMyPosts(),
                apiClient.getGameAnalytics(gameId!, timeRange)
            ]);

            setUser(userData);
            const gameData = gamesData.games.find(g => g.id === gameId);
            setGame(gameData);
            setAnalytics(analyticsData.analytics);

            const gamePosts = postsData.filter(post => post.taggedGame?.id === gameId);

            const totalViews = gamePosts.reduce((sum, post) => sum + post.viewsCount, 0);
            const totalLikes = gamePosts.reduce((sum, post) => sum + post.likesCount, 0);
            const totalFollows = gamePosts.reduce((sum, post) => sum + post.followersCount, 0);

            const redeemedKeys = keysData.keys.filter(key => key.usedBy);

            setStats({
                totalPlayers: redeemedKeys.length,
                totalKeys: keysData.keys.length,
                usedKeys: redeemedKeys.length,
                totalViews,
                totalLikes,
                totalFollows,
                posts: gamePosts
            });

            setPlayers(redeemedKeys.map(key => key.userInfo).filter(Boolean));
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading statistics...</p>
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
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-8 w-8" />
                            Game Analytics - {game.title}
                        </h1>
                        <p className="text-muted-foreground">Detailed analytics and player information</p>
                    </div>
                    <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics?.overview.totalPlayers || 0}</div>
                            <p className="text-xs text-muted-foreground">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics?.overview.activePlayers || 0}</div>
                            <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Playtime</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.overview.totalPlaytimeHours || 0)}h</div>
                            <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
                            <GamepadIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics?.overview.avgSessionMinutes || 0}m</div>
                            <p className="text-xs text-muted-foreground">Per session</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.overview.totalSessions || 0)}</div>
                            <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="daily" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="daily">Daily Stats</TabsTrigger>
                        <TabsTrigger value="retention">Retention</TabsTrigger>
                        <TabsTrigger value="playtime">Playtime</TabsTrigger>
                        <TabsTrigger value="peakhours">Peak Hours</TabsTrigger>
                        <TabsTrigger value="players">Players</TabsTrigger>
                        <TabsTrigger value="posts">Posts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="daily" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Active Users & Playtime</CardTitle>
                                <CardDescription>Player activity over the last {timeRange} days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-sm font-medium mb-4">Active Users</h4>
                                        <div className="h-[200px] w-full">
                                            <div className="flex h-full items-end justify-between gap-1">
                                                {analytics?.charts.daily.slice(-30).map((day: any, index: number) => {
                                                    const maxUsers = Math.max(...analytics.charts.daily.map((d: any) => d.activeUsers));
                                                    const height = maxUsers > 0 ? (day.activeUsers / maxUsers) * 100 : 0;
                                                    return (
                                                        <div key={index} className="flex-1 flex flex-col items-center">
                                                            <div className="w-full bg-primary/20 rounded-t" style={{ height: `${height}%` }}>
                                                                <div className="w-full bg-primary rounded-t hover:bg-primary/80 transition-colors"
                                                                     style={{ height: '100%' }}
                                                                     title={`${formatDate(day.date)}: ${day.activeUsers} users`} />
                                                            </div>
                                                            {index % 5 === 0 && (
                                                                <span className="text-xs text-muted-foreground mt-1">
                                                                    {new Date(day.date).getDate()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium mb-4">Average Playtime per User</h4>
                                        <div className="h-[200px] w-full">
                                            <div className="flex h-full items-end justify-between gap-1">
                                                {analytics?.charts.daily.slice(-30).map((day: any, index: number) => {
                                                    const maxHours = Math.max(...analytics.charts.daily.map((d: any) => d.avgPlaytimeHours));
                                                    const height = maxHours > 0 ? (day.avgPlaytimeHours / maxHours) * 100 : 0;
                                                    return (
                                                        <div key={index} className="flex-1 flex flex-col items-center">
                                                            <div className="w-full bg-green-500/20 rounded-t" style={{ height: `${height}%` }}>
                                                                <div className="w-full bg-green-500 rounded-t hover:bg-green-500/80 transition-colors"
                                                                     style={{ height: '100%' }}
                                                                     title={`${formatDate(day.date)}: ${day.avgPlaytimeHours}h avg`} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="retention" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Player Retention</CardTitle>
                                <CardDescription>Percentage of players returning each day</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics?.charts.retention.map((day: any) => (
                                        <div key={day.day} className="flex items-center gap-4">
                                            <div className="w-20 text-sm font-medium">Day {day.day}</div>
                                            <div className="flex-1">
                                                <div className="w-full bg-secondary rounded-full h-6">
                                                    <div
                                                        className="bg-primary h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                                                        style={{ width: `${day.retention}%` }}
                                                    >
                                                        <span className="text-xs font-medium">{day.retention}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="playtime" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Playtime Distribution</CardTitle>
                                <CardDescription>How long players are playing your game</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics?.charts.playtimeDistribution.map((bucket: any, index: number) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className="w-24 text-sm font-medium">{bucket.range}</div>
                                            <div className="flex-1">
                                                <div className="w-full bg-secondary rounded-full h-6">
                                                    <div
                                                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                                                        style={{ width: `${(bucket.count / analytics.overview.totalPlayers) * 100}%` }}
                                                    >
                                                        <span className="text-xs font-medium">{bucket.count} players</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="peakhours" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Peak Playing Hours</CardTitle>
                                <CardDescription>When players are most active (UTC)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <div className="flex h-full items-end justify-between gap-1">
                                        {analytics?.charts.peakHours.map((hour: any, index: number) => {
                                            const maxSessions = Math.max(...analytics.charts.peakHours.map((h: any) => h.sessions));
                                            const height = maxSessions > 0 ? (hour.sessions / maxSessions) * 100 : 0;
                                            return (
                                                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                                                    <div className="w-full bg-purple-500/20 rounded-t" style={{ height: `${height}%` }}>
                                                        <div className="w-full bg-purple-500 rounded-t hover:bg-purple-500/80 transition-colors"
                                                             style={{ height: '100%' }}
                                                             title={`${hour.hour}: ${hour.sessions} sessions`} />
                                                    </div>
                                                    {index % 3 === 0 && (
                                                        <span className="text-xs text-muted-foreground mt-1">
                                                            {hour.hour}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="players" className="space-y-4">
                        {players.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-semibold mb-2">No players yet</p>
                                    <p className="text-muted-foreground">Players will appear here once they redeem keys</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Player List</CardTitle>
                                    <CardDescription>All players who have redeemed a key</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-2">
                                        {players.map((player, index) => (
                                            <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                                                <img
                                                    src={player.avatar ? `https://cdn.discordapp.com/avatars/${player.id}/${player.avatar}.png` : '/default-avatar.png'}
                                                    alt={player.username}
                                                    className="h-10 w-10 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold">{player.username}</p>
                                                    <p className="text-sm text-muted-foreground">Player ID: {player.id}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="posts" className="space-y-4">
                        {stats?.posts?.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-semibold mb-2">No posts yet</p>
                                    <p className="text-muted-foreground">Posts featuring this game will appear here</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Posts Featuring This Game</CardTitle>
                                    <CardDescription>All content posts that tagged this game</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats?.posts?.map((post: any) => (
                                            <div key={post.id} className="border rounded-lg p-4 hover:bg-muted/50">
                                                <h4 className="font-semibold mb-2">{post.title}</h4>
                                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                    {post.content}
                                                </p>
                                                <div className="flex gap-6 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {formatNumber(post.viewsCount)} views
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {formatNumber(post.likesCount)} likes
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {formatNumber(post.followersCount)} follows
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(post.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}