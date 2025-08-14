import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Download,
    Play,
    Clock,
    Package,
    Key,
    ArrowUp,
    Search
} from "lucide-react";
import apiClient from "@/lib/api-client";

interface LibraryGame {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    downloadUrl: string;
    currentVersion: string;
    ownedAt: string;
    totalPlaytimeSeconds: number;
    isInstalled?: boolean;
    installedVersion?: string;
    hasUpdate?: boolean;
    latestVersion?: string;
}

export default function Library() {
    const [user, setUser] = useState<any>(null);
    const [games, setGames] = useState<LibraryGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [redeemModalOpen, setRedeemModalOpen] = useState(false);
    const [redeemKey, setRedeemKey] = useState('');
    const [redeeming, setRedeeming] = useState(false);
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        loadLibraryData();
        checkForUpdates();
    }, []);

    const loadLibraryData = async () => {
        try {
            setLoading(true);
            const [userData, libraryData, playtimeData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getPlaytimeTotals()
            ]);

            setUser(userData);

            // Map playtime to games
            const playtimeMap = new Map(
                playtimeData.totals.map(t => [t.gameId, t.totalSeconds])
            );

            const gamesWithPlaytime = libraryData.games.map(game => ({
                ...game,
                totalPlaytimeSeconds: playtimeMap.get(game.id) || 0
            }));

            setGames(gamesWithPlaytime);
        } catch (error) {
            console.error('Failed to load library:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkForUpdates = async () => {
        try {
            const response = await apiClient.checkForUpdates();
            if (response.updates.length > 0) {
                setUpdates(response.updates);
                // Update games with update info
                setGames(prev => prev.map(game => {
                    const update = response.updates.find(u => u.gameId === game.id);
                    return update ? {
                        ...game,
                        hasUpdate: true,
                        latestVersion: update.toVersion
                    } : game;
                }));
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
        }
    };

    const handleRedeemKey = async () => {
        if (!redeemKey.trim()) return;

        try {
            setRedeeming(true);
            const response = await apiClient.redeemKey(redeemKey);

            if (response.success) {
                setRedeemModalOpen(false);
                setRedeemKey('');
                // Reload library to show new game
                await loadLibraryData();

                // Show success notification
                alert(`Successfully redeemed ${response.game.title}!`);
            }
        } catch (error) {
            alert('Invalid key or key already redeemed');
        } finally {
            setRedeeming(false);
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

    const filteredGames = games.filter(game =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <Layout user={user}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading your library...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">My Library</h1>
                        <p className="text-muted-foreground">
                            {games.length} game{games.length !== 1 ? 's' : ''} in your collection
                        </p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search games..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full md:w-64"
                            />
                        </div>
                        <Button onClick={() => setRedeemModalOpen(true)}>
                            <Key className="h-4 w-4 mr-2" />
                            Redeem Key
                        </Button>
                    </div>
                </div>

                {/* Update Notification */}
                {updates.length > 0 && (
                    <Card className="mb-8 border-primary/50 bg-primary/10">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <ArrowUp className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">Updates Available</p>
                                    <p className="text-sm text-muted-foreground">
                                        {updates.length} game{updates.length !== 1 ? 's have' : ' has'} updates ready to install
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Games Grid */}
                {filteredGames.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {searchTerm ? 'No games found' : 'No games in your library'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm
                                    ? 'Try a different search term'
                                    : 'Redeem a key to add your first game'
                                }
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => setRedeemModalOpen(true)}>
                                    <Key className="h-4 w-4 mr-2" />
                                    Redeem Your First Key
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredGames.map((game) => (
                            <Card key={game.id} className="overflow-hidden group hover:shadow-lg transition-all">
                                <div className="relative overflow-hidden bg-muted">
                                    <img
                                        src={game.coverImage}
                                        alt={game.title}
                                        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {game.hasUpdate && (
                                        <Badge className="absolute top-2 right-2" variant="default">
                                            Update Available
                                        </Badge>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg line-clamp-1">{game.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {game.description}
                                    </p>
                                </CardHeader>

                                <CardContent>
                                    <div className="flex items-center justify-between mb-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatPlaytime(game.totalPlaytimeSeconds)}</span>
                                        </div>
                                        <Badge variant="secondary">
                                            v{game.currentVersion}
                                        </Badge>
                                    </div>

                                    <div className="flex gap-2">
                                        {game.isInstalled ? (
                                            <>
                                                <Button size="sm" className="flex-1">
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Play
                                                </Button>
                                                {game.hasUpdate && (
                                                    <Button size="sm" variant="outline">
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Button size="sm" className="flex-1">
                                                <Download className="h-4 w-4 mr-2" />
                                                Install
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Redeem Key Modal */}
                <Dialog open={redeemModalOpen} onOpenChange={setRedeemModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Redeem Game Key</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                value={redeemKey}
                                onChange={(e) => setRedeemKey(e.target.value)}
                                className="font-mono"
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setRedeemModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleRedeemKey}
                                    disabled={redeeming || !redeemKey.trim()}
                                >
                                    {redeeming ? 'Redeeming...' : 'Redeem'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}