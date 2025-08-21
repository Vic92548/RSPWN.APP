// dashboards/partners/src/components/TebexOnboardingModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react";
import apiClient from "@/lib/api-client";

interface TebexOnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
    canSkip?: boolean;
}

export default function TebexOnboardingModal({ isOpen, onComplete, canSkip = false }: TebexOnboardingModalProps) {
    const [webstoreToken, setWebstoreToken] = useState('');
    const [storeName, setStoreName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'intro' | 'setup'>('intro');

    const handleSaveTebexConfig = async () => {
        if (!webstoreToken.trim()) {
            setError('Please enter your Tebex webstore token');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await apiClient.setTebexConfig({
                webstoreToken: webstoreToken.trim(),
                storeName: storeName.trim() || undefined
            });

            // Success - close modal and refresh
            onComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to save Tebex configuration. Please check your token and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (canSkip) {
            onComplete();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
                {step === 'intro' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <ShoppingCart className="h-6 w-6 text-primary" />
                                Welcome to VAPR Partners!
                            </DialogTitle>
                            <DialogDescription className="text-base">
                                Let's set up your payment system to start monetizing your games
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-3">Why Tebex?</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>Secure payment processing trusted by thousands of game developers</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>Support for multiple payment methods including PayPal, credit cards, and crypto</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>Automated key delivery and player management</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>Built-in fraud protection and chargeback handling</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Don't have a Tebex account yet?{' '}
                                    <a
                                        href="https://www.tebex.io/register"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium underline inline-flex items-center gap-1"
                                    >
                                        Create one for free
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-3 justify-end">
                                {canSkip && (
                                    <Button variant="outline" onClick={handleSkip}>
                                        Skip for now
                                    </Button>
                                )}
                                <Button onClick={() => setStep('setup')}>
                                    Continue to Setup
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Configure Tebex Integration</DialogTitle>
                            <DialogDescription>
                                Connect your Tebex webstore to start accepting payments
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="webstoreToken">
                                    Tebex Public Token <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="webstoreToken"
                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                    value={webstoreToken}
                                    onChange={(e) => setWebstoreToken(e.target.value)}
                                    className="font-mono"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Find this in your Tebex dashboard under{' '}
                                    <a
                                        href="https://creator.tebex.io/developers/api-keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline inline-flex items-center gap-1"
                                    >
                                        Integrations → API Keys
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="storeName">Store Name (Optional)</Label>
                                <Input
                                    id="storeName"
                                    placeholder="My Game Store"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    A friendly name for your store (defaults to your username)
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Card className="bg-muted/50">
                                <CardContent className="pt-6">
                                    <h4 className="font-medium mb-2">How to find your Webstore Token:</h4>
                                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                        <li>Log in to your Tebex account</li>
                                        <li>Go to Settings → Webstores</li>
                                        <li>Click on your webstore name</li>
                                        <li>Copy the "Public Token" value</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <div className="flex gap-3 justify-between">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep('intro')}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                                <div className="flex gap-3">
                                    {canSkip && (
                                        <Button
                                            variant="outline"
                                            onClick={handleSkip}
                                            disabled={loading}
                                        >
                                            Skip for now
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSaveTebexConfig}
                                        disabled={loading || !webstoreToken.trim()}
                                    >
                                        {loading ? 'Validating...' : 'Complete Setup'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}