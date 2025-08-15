// dashboards/partners/src/components/TebexSettings.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Settings, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function TebexSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [webstoreToken, setWebstoreToken] = useState('');
    const [storeName, setStoreName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getTebexConfig();
            if (response.config) {
                setConfig(response.config);
                setWebstoreToken(response.config.webstoreToken || '');
                setStoreName(response.config.storeName || '');
            }
        } catch (error) {
            console.error('Failed to load Tebex config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await apiClient.setTebexConfig({
                webstoreToken: webstoreToken.trim(),
                storeName: storeName.trim() || undefined
            });

            setSuccess('Tebex configuration updated successfully!');
            await loadConfig();
        } catch (err: any) {
            setError(err.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to remove your Tebex configuration?')) {
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            await apiClient.removeTebexConfig();

            setConfig(null);
            setWebstoreToken('');
            setStoreName('');
            setSuccess('Tebex configuration removed');
        } catch (err: any) {
            setError(err.message || 'Failed to remove configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Payment Settings
                        </CardTitle>
                        <CardDescription>
                            Configure your Tebex integration for accepting payments
                        </CardDescription>
                    </div>
                    {config?.hasConfig && (
                        <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="webstoreToken">
                        Tebex Webstore Token <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="webstoreToken"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={webstoreToken}
                        onChange={(e) => setWebstoreToken(e.target.value)}
                        className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground">
                        Your public webstore token from{' '}
                        <a
                            href="https://creators.tebex.io/settings/webstores"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline inline-flex items-center gap-1"
                        >
                            Tebex dashboard
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                        id="storeName"
                        placeholder="My Game Store"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                    />
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={saving || !webstoreToken.trim()}
                    >
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                    {config?.hasConfig && (
                        <Button
                            variant="outline"
                            onClick={handleRemove}
                            disabled={saving}
                        >
                            Remove Configuration
                        </Button>
                    )}
                </div>

                <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                        Don't have a Tebex account?{' '}
                        <a
                            href="https://www.tebex.io/register"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline inline-flex items-center gap-1"
                        >
                            Create one for free
                            <ExternalLink className="h-3 w-3" />
                        </a>
                        {' '}to start accepting payments.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}