import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Layout from "@/components/Layout"
import apiClient from "@/lib/api-client"
import {
    DollarSign,
    Percent,
    Zap,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    TrendingUp,
    Users,
    ShoppingCart,
    Copy,
    ExternalLink,
    Gamepad2,
    LogIn
} from "lucide-react"

interface User {
    id: string;
    username: string;
    email: string;
    avatar: string;
    level: number;
}

interface CreatorStats {
    totalClicks: number;
    totalSales: number;
    totalRevenue: number;
}

interface CreatorProgramProps {
    isAuthenticated: boolean | null;
}

export default function CreatorProgram({ isAuthenticated }: CreatorProgramProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatorStatus, setCreatorStatus] = useState<any>(null);
    const [stats, setStats] = useState<CreatorStats | null>(null);
    const [tebexWalletId, setTebexWalletId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadCreatorData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadCreatorData = async () => {
        try {
            setLoading(true);
            const [userData, statusData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getCreatorStatus()
            ]);

            setUser(userData);
            setCreatorStatus(statusData);

            if (statusData.isCreator) {
                const statsData = await apiClient.getCreatorStats();
                setStats(statsData.stats);
            }
        } catch (error) {
            console.error('Failed to load creator data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tebexWalletId.trim()) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await apiClient.applyForCreatorProgram(tebexWalletId);
            if (response.success) {
                await loadCreatorData();
                setTebexWalletId('');
            }
        } catch (error) {
            console.error('Failed to apply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const copyCreatorCode = () => {
        if (creatorStatus?.creatorCode) {
            navigator.clipboard.writeText(creatorStatus.creatorCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const handleLogin = () => {
        apiClient.login();
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading creator program...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Creator Dashboard View (authenticated and approved)
    if (isAuthenticated && creatorStatus?.isCreator) {
        return (
            <Layout user={user}>
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                        <p className="text-muted-foreground">Track your performance and earnings</p>
                    </div>

                    {/* Creator Code */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Your Creator Code</CardTitle>
                            <CardDescription>Share this code with your audience. They get 10% off and you earn 20% commission!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <code className="text-2xl font-mono font-bold text-primary bg-secondary px-4 py-2 rounded-lg block text-center">
                                        {creatorStatus.creatorCode}
                                    </code>
                                </div>
                                <Button onClick={copyCreatorCode} variant="outline" size="lg">
                                    {copied ? (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(stats?.totalClicks || 0)}</div>
                                <p className="text-xs text-muted-foreground">Code usage & game tag clicks</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(stats?.totalSales || 0)}</div>
                                <p className="text-xs text-muted-foreground">Successful conversions</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-500">
                                    ${stats?.totalRevenue?.toFixed(2) || '0.00'}
                                </div>
                                <p className="text-xs text-muted-foreground">20% commission earned</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tips for Success</CardTitle>
                            <CardDescription>Maximize your earnings with these strategies</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Gamepad2 className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium">Tag Games in Your Posts</p>
                                        <p className="text-sm text-muted-foreground">
                                            When you tag a VAPR game in your posts, viewers who click on the game tag automatically have your creator code applied!
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium">Create Quality Content</p>
                                        <p className="text-sm text-muted-foreground">
                                            Showcase games effectively with engaging videos and screenshots to drive more interest and sales.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium">Engage Your Audience</p>
                                        <p className="text-sm text-muted-foreground">
                                            Build a community around your content. Engaged followers are more likely to use your creator code.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                            <CardDescription>How you get paid</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">
                                Your earnings are automatically deposited to your Tebex wallet. You can request a PayPal payout at any time.
                            </p>
                            <Button variant="outline" asChild>
                                <a href="https://docs.tebex.io/creators/tebex-checkout/wallet" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Tebex Wallet Guide
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Application Status Views (authenticated with pending/rejected application)
    if (isAuthenticated && creatorStatus?.application) {
        const { status, createdAt, message } = creatorStatus.application;

        return (
            <Layout user={user}>
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Creator Program</h1>
                        <p className="text-muted-foreground">Application Status</p>
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            {status === 'pending' && (
                                <div className="text-center py-12">
                                    <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold mb-2">Application Pending</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Your creator application is being reviewed. We'll get back to you within 24 hours (up to a week in some cases).
                                    </p>
                                    <Badge variant="outline" className="text-sm">
                                        Applied on {new Date(createdAt).toLocaleDateString()}
                                    </Badge>
                                </div>
                            )}

                            {status === 'rejected' && (
                                <div className="text-center py-12">
                                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold mb-2">Application Not Approved</h3>
                                    <p className="text-muted-foreground mb-6">
                                        {message || 'Your application was not approved at this time.'}
                                    </p>
                                    <Button onClick={() => window.location.reload()}>
                                        Learn More About Requirements
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Public View (unauthenticated or authenticated without application)
    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">VAPR Creator Program</h1>
                    <p className="text-muted-foreground">Earn money while helping VAPR grow</p>
                </div>

                {/* Hero Section */}
                <Card className="mb-8 border-primary/50 bg-primary/5">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <DollarSign className="h-16 w-16 text-primary mx-auto mb-4" />
                            <h2 className="text-3xl font-bold mb-4">Turn Your Content Into Revenue</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Join the VAPR Creator Program and earn 20% commission on every sale made with your creator code,
                                while your viewers enjoy 10% off their purchases!
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* How it Works */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="text-center">
                            <Percent className="h-10 w-10 text-primary mx-auto mb-2" />
                            <CardTitle className="text-lg">20% Commission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-center text-muted-foreground">
                                Earn 20% on every sale made with your code
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="text-center">
                            <DollarSign className="h-10 w-10 text-primary mx-auto mb-2" />
                            <CardTitle className="text-lg">10% Discount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-center text-muted-foreground">
                                Your viewers get 10% off their purchase
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="text-center">
                            <Zap className="h-10 w-10 text-primary mx-auto mb-2" />
                            <CardTitle className="text-lg">Instant Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-center text-muted-foreground">
                                Receive earnings instantly to your Tebex wallet
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="text-center">
                            <CreditCard className="h-10 w-10 text-primary mx-auto mb-2" />
                            <CardTitle className="text-lg">PayPal Payout</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-center text-muted-foreground">
                                Request PayPal payouts anytime
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Game Tag System */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gamepad2 className="h-5 w-5" />
                            Game Tag System - Automatic Creator Attribution
                        </CardTitle>
                        <CardDescription>
                            The easiest way to earn commissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">
                            When you create posts on VAPR, you can now <strong>tag games</strong> from our catalog.
                            This powerful feature automatically applies your creator code when viewers interact with your content!
                        </p>

                        <div className="bg-secondary rounded-lg p-6">
                            <h4 className="font-semibold mb-3">How it works:</h4>
                            <ol className="space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold">1.</span>
                                    <span>Tag a VAPR game when creating your post</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold">2.</span>
                                    <span>When viewers click on the game tag in your post, your creator code is <strong>automatically applied</strong> to their session</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary font-bold">3.</span>
                                    <span>If they purchase the game, you earn your <strong>20% commission</strong> - no code entry needed!</span>
                                </li>
                            </ol>
                        </div>

                        <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                            <p className="text-sm">
                                <strong className="text-primary">Pro tip:</strong> Always tag the games you're showcasing in your content to maximize your earning potential!
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Info */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>How will I get paid?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">
                            Every time someone uses your creator code and makes a purchase on VAPR, you will receive 20% instantly on your
                            <strong> Tebex Wallet</strong> and you will be able to ask for a PayPal payout right away.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                                Learn more about Tebex wallet:
                                <a href="https://docs.tebex.io/creators/tebex-checkout/wallet"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-primary hover:underline ml-1">
                                    Tebex Wallet Documentation
                                </a>
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Application Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Join the Creator Program</CardTitle>
                        <CardDescription>
                            To join the creator program, you just need to have an active VAPR account and a Tebex account.
                            {!isAuthenticated && " Sign in to apply for the program."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isAuthenticated ? (
                            <form onSubmit={handleApply} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tebex-wallet-id">
                                        Tebex Wallet ID <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="tebex-wallet-id"
                                        value={tebexWalletId}
                                        onChange={(e) => setTebexWalletId(e.target.value)}
                                        placeholder="Enter your Tebex wallet ID"
                                        required
                                        pattern="[a-zA-Z0-9_-]+"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        You can find this in your Tebex dashboard
                                    </p>
                                </div>

                                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                                    {submitting ? 'Submitting...' : 'Submit Application'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Sign in to Apply</h3>
                                <p className="text-muted-foreground mb-4">
                                    You need to be signed in to apply for the creator program
                                </p>
                                <Button onClick={handleLogin} size="lg">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Sign in with Discord
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}