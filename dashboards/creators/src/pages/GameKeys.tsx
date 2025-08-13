import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Copy, Download, Plus, Check, ArrowLeft, Key } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function GameKeys() {
    const { gameId } = useParams<{ gameId: string }>();
    const [loading, setLoading] = useState(true);
    const [game, setGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [keys, setKeys] = useState<any[]>([]);
    const [generating, setGenerating] = useState(false);
    const [keyCount, setKeyCount] = useState(5);
    const [keyTag, setKeyTag] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [gameId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, keysData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getGameKeys(gameId!)
            ]);

            setUser(userData);
            const gameData = gamesData.games.find(g => g.id === gameId);
            setGame(gameData);
            setKeys(keysData.keys);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateKeys = async () => {
        try {
            setGenerating(true);
            await apiClient.generateGameKeys(gameId!, keyCount, keyTag || undefined);
            await loadData();
            setKeyTag('');
            setKeyCount(5);
        } catch (error) {
            console.error('Failed to generate keys:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyKey = async (key: string) => {
        await navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDownloadKeys = async () => {
        try {
            await apiClient.downloadKeysCSV(gameId!);
        } catch (error) {
            console.error('Failed to download keys:', error);
        }
    };

    const unusedKeys = keys.filter(k => !k.usedBy);
    const usedKeys = keys.filter(k => k.usedBy);

    if (loading) {
        return (
            <Layout user={user}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
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
                            <Key className="h-8 w-8" />
                            Game Keys - {game.title}
                        </h1>
                        <p className="text-muted-foreground">Generate and manage distribution keys for your game</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Total Keys</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{keys.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Available Keys</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{unusedKeys.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Redeemed Keys</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{usedKeys.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Generate Keys Section */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Generate New Keys</CardTitle>
                        <CardDescription>Create new game keys for distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="keyCount">Number of Keys</Label>
                                <Input
                                    id="keyCount"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={keyCount}
                                    onChange={(e) => setKeyCount(parseInt(e.target.value) || 1)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="keyTag">Tag (Optional)</Label>
                                <Input
                                    id="keyTag"
                                    placeholder="e.g., streamer-giveaway"
                                    value={keyTag}
                                    onChange={(e) => setKeyTag(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleGenerateKeys}
                                    disabled={generating}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {generating ? 'Generating...' : 'Generate Keys'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Keys List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Keys List</CardTitle>
                                <CardDescription>All generated keys for this game</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleDownloadKeys}>
                                <Download className="h-4 w-4 mr-2" />
                                Download CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
                            {keys.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No keys generated yet
                                </div>
                            ) : (
                                keys.map((key) => (
                                    <div key={key.key} className="p-3 flex items-center justify-between hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{key.key}</code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyKey(key.key)}
                                            >
                                                {copiedKey === key.key ? (
                                                    <Check className="h-3 w-3" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {key.tag && (
                                                <Badge variant="secondary">{key.tag}</Badge>
                                            )}
                                            {key.usedBy ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="destructive">Used</Badge>
                                                    {key.userInfo && (
                                                        <span className="text-sm text-muted-foreground">
                                                            by {key.userInfo.username}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-green-600">Available</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}