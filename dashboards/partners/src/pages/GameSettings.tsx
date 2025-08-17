// dashboards/partners/src/pages/GameSettings.tsx

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/Layout";
import {
    ArrowLeft,
    Settings,
    Save,
    AlertCircle,
    Loader2,
    Key,
    BarChart3,
    Package,
    FileText,
    ExternalLink,
    Globe,
    EyeOff,
    Gamepad2,
    ArrowRight
} from "lucide-react";
import apiClient from "@/lib/api-client";

export default function GameSettings() {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [game, setGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isHidden, setIsHidden] = useState(false);
    const [isEarlyAccess, setIsEarlyAccess] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        players: 0,
        keys: 0,
        usedKeys: 0
    });

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

            if (!gameData) {
                navigate('/dashboard');
                return;
            }

            setGame(gameData);
            setTitle(gameData.title || '');
            setDescription(gameData.description || '');
            setIsHidden(gameData.isHidden || false);
            setIsEarlyAccess(gameData.isEarlyAccess || false);

            // Calculate stats
            const usedKeys = keysData.keys.filter(k => k.usedBy);
            setStats({
                players: usedKeys.length,
                keys: keysData.keys.length,
                usedKeys: usedKeys.length
            });

        } catch (error) {
            console.error('Failed to load data:', error);
            setError('Failed to load game data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess(false);

            const updates: any = {};

            // Only include changed fields
            if (title !== game.title) updates.title = title;
            if (description !== game.description) updates.description = description;
            if (isHidden !== game.isHidden) updates.isHidden = isHidden;
            if (isEarlyAccess !== game.isEarlyAccess) updates.isEarlyAccess = isEarlyAccess;

            if (Object.keys(updates).length === 0) {
                setError('No changes to save');
                setSaving(false);
                return;
            }

            await apiClient.updateGame(game.id, updates);

            setSuccess(true);
            // Reload data to get updated game info
            await loadData();

            setTimeout(() => {
                setSuccess(false);
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Failed to update game settings');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = () => {
        if (!game) return false;
        return title !== game.title ||
            description !== game.description ||
            isHidden !== game.isHidden ||
            isEarlyAccess !== game.isEarlyAccess;
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
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading game settings...</p>
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
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Gamepad2 className="h-8 w-8" />
                                {game.title}
                            </h1>
                            {game.isHidden && (
                                <Badge variant="destructive" className="gap-1">
                                    <EyeOff className="h-3 w-3" />
                                    Hidden
                                </Badge>
                            )}
                            {game.isEarlyAccess && (
                                <Badge variant="secondary">
                                    Early Access
                                </Badge>
                            )}
                            <Badge variant="outline">
                                v{game.currentVersion}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Manage your game settings and content
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        asChild
                    >
                        <a
                        href={`/games/${game.slug || game.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        <Globe className="h-4 w-4 mr-2" />
                        View Game Page
                    </a>
                </Button>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Link to={`/games/${gameId}/stats`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Analytics</p>
                                    <p className="text-2xl font-bold">{stats.players}</p>
                                    <p className="text-xs text-muted-foreground">Players</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 mt-2 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link to={`/games/${gameId}/keys`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Game Keys</p>
                                    <p className="text-2xl font-bold">{stats.keys - stats.usedKeys}</p>
                                    <p className="text-xs text-muted-foreground">Available</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <Key className="h-6 w-6 text-green-500" />
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 mt-2 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link to={`/games/${gameId}/updates`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Updates</p>
                                    <p className="text-2xl font-bold">v{game.currentVersion}</p>
                                    <p className="text-xs text-muted-foreground">Current</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-blue-500" />
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 mt-2 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>

                <Link to={`/games/${gameId}/posts`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Posts</p>
                                    <p className="text-2xl font-bold">Manage</p>
                                    <p className="text-xs text-muted-foreground">Content</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-purple-500" />
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 mt-2 text-muted-foreground" />
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Main Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Game Settings
                    </CardTitle>
                    <CardDescription>
                        Manage your game's basic information and visibility
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Game Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter game title"
                            disabled={saving}
                        />
                        <p className="text-sm text-muted-foreground">
                            This is how your game will appear across VAPR
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your game..."
                            rows={6}
                            disabled={saving}
                        />
                        <p className="text-sm text-muted-foreground">
                            A compelling description helps players discover your game
                        </p>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                        <h3 className="font-semibold">Visibility Settings</h3>

                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="hidden"
                                checked={isHidden}
                                onCheckedChange={(checked: boolean) => setIsHidden(checked as boolean)}
                                disabled={saving}
                                className="mt-1"
                            />
                            <div className="space-y-0.5">
                                <Label
                                    htmlFor="hidden"
                                    className="text-base font-normal cursor-pointer"
                                >
                                    Hidden Game
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Game requires a key to access. Perfect for beta testing or private releases.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="earlyaccess"
                                checked={isEarlyAccess}
                                onCheckedChange={(checked: boolean) => setIsEarlyAccess(checked as boolean)}
                                disabled={saving}
                                className="mt-1"
                            />
                            <div className="space-y-0.5">
                                <Label
                                    htmlFor="earlyaccess"
                                    className="text-base font-normal cursor-pointer"
                                >
                                    Early Access
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show early access badge on your game to indicate it's still in development
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Game settings updated successfully!</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={saving || !title.trim() || !description.trim() || !hasChanges()}
                            className="w-full sm:w-auto"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Download URL</CardTitle>
                        <CardDescription>
                            Current download location for your game
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={game.downloadUrl || 'No download URL set'}
                                    disabled
                                    className="flex-1"
                                />
                                {game.downloadUrl && (
                                    <Button variant="outline" size="icon" asChild>
                                        <a href={game.downloadUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Update download URL when releasing new versions
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Game Info</CardTitle>
                        <CardDescription>
                            Additional game information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm font-medium">Created Date</p>
                            <p className="text-sm text-muted-foreground">
                                {formatDate(game.createdAt || game.ownedAt)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Game ID</p>
                            <p className="text-sm text-muted-foreground font-mono">
                                {game.id}
                            </p>
                        </div>
                        {game.externalLink && (
                            <div>
                                <p className="text-sm font-medium">External Link</p>
                                <a
                                    href={game.externalLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    Visit Store Page
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
</Layout>
);
}