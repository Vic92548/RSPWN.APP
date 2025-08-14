import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { ArrowLeft, BarChart3, Eye, Heart, Users, Calendar, TrendingUp } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function GameStats() {
    const { gameId } = useParams<{ gameId: string }>();
    const [loading, setLoading] = useState(true);
    const [game, setGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [gameId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, keysData, postsData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getGameKeys(gameId!),
                apiClient.getMyPosts()
            ]);

            setUser(userData);
            const gameData = gamesData.games.find(g => g.id === gameId);
            setGame(gameData);

            // Filter posts that tagged this game
            const gamePosts = postsData.filter(post => post.taggedGame?.id === gameId);

            // Calculate stats
            const totalViews = gamePosts.reduce((sum, post) => sum + post.viewsCount, 0);
            const totalLikes = gamePosts.reduce((sum, post) => sum + post.likesCount, 0);
            const totalFollows = gamePosts.reduce((sum, post) => sum + post.followersCount, 0);

            // Get players who redeemed keys
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
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-8 w-8" />
                            Game Statistics - {game.title}
                        </h1>
                        <p className="text-muted-foreground">Detailed analytics and player information</p>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalPlayers || 0}</div>
                            <p className="text-xs text-muted-foreground">Active players</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Key Usage</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {((stats?.usedKeys / stats?.totalKeys) * 100 || 0).toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.usedKeys || 0} of {stats?.totalKeys || 0} keys
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(stats?.totalViews || 0)}</div>
                            <p className="text-xs text-muted-foreground">Content views</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(stats?.totalLikes || 0)}</div>
                            <p className="text-xs text-muted-foreground">Total likes</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Stats Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="players">Players ({players.length})</TabsTrigger>
                        <TabsTrigger value="posts">Posts ({stats?.posts?.length || 0})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Key Redemption Progress</CardTitle>
                                <CardDescription>Track how many keys have been redeemed</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Redeemed Keys</span>
                                        <span className="font-bold">
                                            {stats?.usedKeys || 0} / {stats?.totalKeys || 0}
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-4">
                                        <div
                                            className="bg-primary h-4 rounded-full transition-all"
                                            style={{ width: `${(stats?.usedKeys / stats?.totalKeys) * 100 || 0}%` }}
                                        />
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {((stats?.usedKeys / stats?.totalKeys) * 100 || 0).toFixed(1)}% redemption rate
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Game Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Current Version</span>
                                        <span className="font-mono">v{game.currentVersion}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Published</span>
                                        <span>{formatDate(game.createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Playtime</span>
                                        <span>{Math.floor(game.totalPlaytimeSeconds / 3600)}h</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Engagement Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Avg. Views per Post</span>
                                        <span>{Math.round(stats?.totalViews / (stats?.posts?.length || 1))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Avg. Likes per Post</span>
                                        <span>{Math.round(stats?.totalLikes / (stats?.posts?.length || 1))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Follows</span>
                                        <span>{stats?.totalFollows || 0}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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