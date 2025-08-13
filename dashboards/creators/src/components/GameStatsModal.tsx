import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Heart, Users, Calendar } from "lucide-react";
import apiClient from "@/lib/api-client";

interface GameStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameId: string;
    gameTitle: string;
}

export default function GameStatsModal({ isOpen, onClose, gameId, gameTitle }: GameStatsModalProps) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [players, setPlayers] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && gameId) {
            loadGameStats();
        }
    }, [isOpen, gameId]);

    const loadGameStats = async () => {
        try {
            setLoading(true);
            // Get game-specific stats
            const [keysData, postsData] = await Promise.all([
                apiClient.getGameKeys(gameId),
                apiClient.getMyPosts()
            ]);

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
            console.error('Failed to load game stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Game Statistics - {gameTitle}</DialogTitle>
                    <DialogDescription>
                        Detailed analytics and player information for your game
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="players">Players</TabsTrigger>
                            <TabsTrigger value="posts">Posts</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Players</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.totalPlayers || 0}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Key Usage</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {stats?.usedKeys || 0}/{stats?.totalKeys || 0}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Views</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatNumber(stats?.totalViews || 0)}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Engagement</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatNumber(stats?.totalLikes || 0)}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Key Redemption Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Redeemed</span>
                                            <span>{((stats?.usedKeys / stats?.totalKeys) * 100 || 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${(stats?.usedKeys / stats?.totalKeys) * 100 || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="players" className="space-y-4">
                            {players.length === 0 ? (
                                <Card>
                                    <CardContent className="text-center py-8">
                                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No players yet</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-2">
                                    {players.map((player, index) => (
                                        <Card key={index}>
                                            <CardContent className="flex items-center gap-4 p-4">
                                                <img
                                                    src={player.avatar ? `https://cdn.discordapp.com/avatars/${player.id}/${player.avatar}.png` : '/default-avatar.png'}
                                                    alt={player.username}
                                                    className="h-10 w-10 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-semibold">{player.username}</p>
                                                    <p className="text-sm text-muted-foreground">Player ID: {player.id}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="posts" className="space-y-4">
                            {stats?.posts?.length === 0 ? (
                                <Card>
                                    <CardContent className="text-center py-8">
                                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No posts featuring this game yet</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {stats?.posts?.map((post: any) => (
                                        <Card key={post.id}>
                                            <CardContent className="p-4">
                                                <h4 className="font-semibold mb-2">{post.title}</h4>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {formatNumber(post.viewsCount)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {formatNumber(post.likesCount)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {formatNumber(post.followersCount)}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}