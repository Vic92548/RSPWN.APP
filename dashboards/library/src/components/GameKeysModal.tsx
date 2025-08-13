import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Plus, Check } from "lucide-react";
import apiClient from "@/lib/api-client";

interface GameKeysModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameId: string;
    gameTitle: string;
}

export default function GameKeysModal({ isOpen, onClose, gameId, gameTitle }: GameKeysModalProps) {
    const [loading, setLoading] = useState(true);
    const [keys, setKeys] = useState<any[]>([]);
    const [generating, setGenerating] = useState(false);
    const [keyCount, setKeyCount] = useState(5);
    const [keyTag, setKeyTag] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && gameId) {
            loadKeys();
        }
    }, [isOpen, gameId]);

    const loadKeys = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getGameKeys(gameId);
            setKeys(response.keys);
        } catch (error) {
            console.error('Failed to load keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateKeys = async () => {
        try {
            setGenerating(true);
            await apiClient.generateGameKeys(gameId, keyCount, keyTag || undefined);
            await loadKeys();
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
            await apiClient.downloadKeysCSV(gameId);
        } catch (error) {
            console.error('Failed to download keys:', error);
        }
    };

    const unusedKeys = keys.filter(k => !k.usedBy);
    const usedKeys = keys.filter(k => k.usedBy);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Game Keys - {gameTitle}</DialogTitle>
                    <DialogDescription>
                        Generate and manage distribution keys for your game
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{keys.length}</div>
                                <p className="text-sm text-muted-foreground">Total Keys</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{unusedKeys.length}</div>
                                <p className="text-sm text-muted-foreground">Available</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{usedKeys.length}</div>
                                <p className="text-sm text-muted-foreground">Redeemed</p>
                            </div>
                        </div>

                        {/* Generate Keys */}
                        <div className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold">Generate New Keys</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <div>
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
                        </div>

                        {/* Download Button */}
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={handleDownloadKeys}>
                                <Download className="h-4 w-4 mr-2" />
                                Download All Keys (CSV)
                            </Button>
                        </div>

                        {/* Keys List */}
                        <div className="space-y-2">
                            <h3 className="font-semibold">Keys</h3>
                            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                                {keys.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No keys generated yet
                                    </div>
                                ) : (
                                    keys.map((key) => (
                                        <div key={key.key} className="p-3 flex items-center justify-between hover:bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <code className="text-sm font-mono">{key.key}</code>
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
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}