import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Upload, Package, Calendar } from "lucide-react";
import apiClient from "@/lib/api-client";

interface GameUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameId: string;
    gameTitle: string;
    currentVersion: string;
}

export default function GameUpdateModal({ isOpen, onClose, gameId, gameTitle, currentVersion }: GameUpdateModalProps) {
    const [loading, setLoading] = useState(true);
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
        if (isOpen && gameId) {
            loadVersions();
            // Set next version suggestion
            const versionParts = currentVersion.split('.');
            const patch = parseInt(versionParts[2] || '0') + 1;
            setNewVersion(`${versionParts[0] || '1'}.${versionParts[1] || '0'}.${patch}`);
        }
    }, [isOpen, gameId, currentVersion]);

    const loadVersions = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getGameVersions(gameId);
            setVersions(response.versions);
        } catch (error) {
            console.error('Failed to load versions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVersion = async () => {
        try {
            setCreating(true);
            await apiClient.createGameVersion(gameId, {
                version: newVersion,
                downloadUrl,
                size: fileSize ? parseInt(fileSize) * 1024 * 1024 : undefined, // Convert MB to bytes
                changelog,
                releaseNotes,
                isRequired,
                minimumVersion: isRequired ? currentVersion : undefined
            });

            // Reset form
            setDownloadUrl('');
            setFileSize('');
            setChangelog('');
            setReleaseNotes('');
            setIsRequired(false);

            // Reload versions
            await loadVersions();

            // Close modal after successful update
            onClose();
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Game Updates - {gameTitle}</DialogTitle>
                    <DialogDescription>
                        Release new versions and manage updates for your game
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Current Version */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Current Version</p>
                                    <p className="text-xl font-bold">v{currentVersion}</p>
                                </div>
                                <Badge variant="secondary">Live</Badge>
                            </div>
                        </div>

                        {/* Create New Version */}
                        <div className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold">Release New Version</h3>

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
                            </div>

                            <div>
                                <Label htmlFor="changelog">Changelog</Label>
                                <Textarea
                                    id="changelog"
                                    placeholder="- Fixed bug with player movement&#10;- Added new level&#10;- Improved performance"
                                    rows={4}
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

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="required"
                                    checked={isRequired}
                                    onCheckedChange={setIsRequired}
                                />
                                <Label htmlFor="required">
                                    Make this a required update
                                </Label>
                            </div>

                            <Button
                                onClick={handleCreateVersion}
                                disabled={creating || !newVersion || !downloadUrl}
                                className="w-full"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {creating ? 'Publishing...' : 'Publish Update'}
                            </Button>
                        </div>

                        {/* Version History */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Version History</h3>
                            <div className="border rounded-lg divide-y">
                                {versions.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No version history available
                                    </div>
                                ) : (
                                    versions.map((version) => (
                                        <div key={version.id} className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-semibold">v{version.version}</span>
                                                    {version.isRequired && (
                                                        <Badge variant="destructive">Required</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(version.createdAt)}
                                                </div>
                                            </div>
                                            {version.changelog && (
                                                <div className="text-sm text-muted-foreground whitespace-pre-line">
                                                    {version.changelog}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>Size: {formatFileSize(version.size)}</span>
                                                <span>Downloads: {version.downloads}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}