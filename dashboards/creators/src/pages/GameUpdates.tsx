import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { ArrowLeft, Upload, Package, Download } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function GameUpdates() {
    const { gameId } = useParams<{ gameId: string }>();
    const [loading, setLoading] = useState(true);
    const [game, setGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [creating, setCreating] = useState(false);

    // Form state
    const [newVersion, setNewVersion] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [fileSize, setFileSize] = useState('');
    const [changelog, setChangelog] = useState('');
    const [releaseNotes, setReleaseNotes] = useState('');
    const [isRequired, setIsRequired] = useState(false);

    useEffect(() => {
        loadData();
    }, [gameId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, versionsData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getGameVersions(gameId!)
            ]);

            setUser(userData);
            const gameData = gamesData.games.find(g => g.id === gameId);
            setGame(gameData);
            setVersions(versionsData.versions);

            // Set next version suggestion
            if (gameData) {
                const versionParts = gameData.currentVersion.split('.');
                const patch = parseInt(versionParts[2] || '0') + 1;
                setNewVersion(`${versionParts[0] || '1'}.${versionParts[1] || '0'}.${patch}`);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVersion = async () => {
        try {
            setCreating(true);
            await apiClient.createGameVersion(gameId!, {
                version: newVersion,
                downloadUrl,
                size: fileSize ? parseInt(fileSize) * 1024 * 1024 : undefined, // Convert MB to bytes
                changelog,
                releaseNotes,
                isRequired,
                minimumVersion: isRequired ? game.currentVersion : undefined
            });

            // Reset form
            setDownloadUrl('');
            setFileSize('');
            setChangelog('');
            setReleaseNotes('');
            setIsRequired(false);

            // Reload data
            await loadData();
        } catch (error) {
            console.error('Failed to create version:', error);
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

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
                            <Package className="h-8 w-8" />
                            Game Updates - {game.title}
                        </h1>
                        <p className="text-muted-foreground">Release new versions and manage updates</p>
                    </div>
                </div>

                {/* Current Version */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Current Version</p>
                                <p className="text-2xl font-bold">v{game.currentVersion}</p>
                            </div>
                            <Badge variant="secondary" className="text-lg px-3 py-1">Live</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Create New Version */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Release New Version</CardTitle>
                        <CardDescription>Publish an update for your game</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="version">Version Number</Label>
                                <Input
                                    id="version"
                                    placeholder="1.0.1"
                                    value={newVersion}
                                    onChange={(e) => setNewVersion(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="size">File Size (MB)</Label>
                                <Input
                                    id="size"
                                    type="number"
                                    placeholder="150"
                                    value={fileSize}
                                    onChange={(e) => setFileSize(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="downloadUrl">Download URL</Label>
                            <Input
                                id="downloadUrl"
                                placeholder="https://example.com/game-v1.0.1.zip"
                                value={downloadUrl}
                                onChange={(e) => setDownloadUrl(e.target.value)}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Direct download link for the game files
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="changelog">Changelog</Label>
                            <Textarea
                                id="changelog"
                                placeholder="- Fixed bug with player movement&#10;- Added new level&#10;- Improved performance"
                                rows={5}
                                value={changelog}
                                onChange={(e) => setChangelog(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="releaseNotes">Release Notes (Optional)</Label>
                            <Textarea
                                id="releaseNotes"
                                placeholder="Additional notes for this release..."
                                rows={3}
                                value={releaseNotes}
                                onChange={(e) => setReleaseNotes(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Switch
                                id="required"
                                checked={isRequired}
                                onCheckedChange={setIsRequired}
                            />
                            <div className="flex-1">
                                <Label htmlFor="required" className="text-base cursor-pointer">
                                    Make this a required update
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Players will be prompted to update before playing
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleCreateVersion}
                            disabled={creating || !newVersion || !downloadUrl}
                            size="lg"
                            className="w-full"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {creating ? 'Publishing...' : 'Publish Update'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Version History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Version History</CardTitle>
                        <CardDescription>All published versions of your game</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {versions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No version history available
                                </div>
                            ) : (
                                versions.map((version) => (
                                    <div key={version.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                <span className="text-lg font-semibold">v{version.version}</span>
                                                {version.isRequired && (
                                                    <Badge variant="destructive">Required</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDate(version.createdAt)}
                                            </div>
                                        </div>

                                        {version.changelog && (
                                            <div className="bg-muted/50 rounded-lg p-3">
                                                <p className="text-sm font-medium mb-1">Changelog:</p>
                                                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                                                    {version.changelog}
                                                </pre>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Download className="h-3 w-3" />
                                                {version.downloads} downloads
                                            </span>
                                            <span>Size: {formatFileSize(version.size)}</span>
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