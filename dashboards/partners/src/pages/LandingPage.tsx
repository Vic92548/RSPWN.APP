import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Gamepad2,
    TrendingUp,
    Users,
    BarChart3,
    Key,
    Zap,
    Shield,
    Globe,
    ArrowRight,
    CheckCircle2,
    DollarSign,
    Crown,
    Heart,
    Star,
    Github,
    Code2,
    Sparkles
} from "lucide-react"
import apiClient from "@/lib/api-client"

export default function LandingPage() {
    const [stats, setStats] = useState({
        users: 0,
        games: 0,
        posts: 0
    });
    const [githubStats, setGithubStats] = useState({
        stars: 0,
        forks: 0
    });

    useEffect(() => {
        loadStats();
        loadGithubStats();
    }, []);

    const loadStats = async () => {
        try {
            const [userCount, gamesData] = await Promise.all([
                apiClient.getUserCount(),
                apiClient.getAllGames()
            ]);

            setStats({
                users: userCount.count,
                games: gamesData.games.length,
                posts: Math.floor(gamesData.games.length * 12.5)
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadGithubStats = async () => {
        try {
            const response = await fetch('https://api.github.com/repos/Vic92548/VAPR');
            const data = await response.json();
            setGithubStats({
                stars: data.stargazers_count || 0,
                forks: data.forks_count || 0
            });
        } catch (error) {
            console.error('Failed to load GitHub stats:', error);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const handleGetStarted = () => {
        apiClient.login();
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Gamepad2 className="h-7 w-7 text-primary" />
                            <span className="text-xl font-semibold">VAPR Partners</span>
                        </div>
                        <Button onClick={handleGetStarted}>
                            Sign In with Discord
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-24">
                <div className="container mx-auto px-6 text-center">
                    <Badge variant="secondary" className="mb-4">
                        <Sparkles className="h-3 w-3 mr-1" />
                        0% Commission • Open Source
                    </Badge>

                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
                        The Open Source Platform for
                        <span className="text-primary"> Game Distribution</span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                        Keep 100% of your game sales. Build your community.
                        Offer premium subscriptions with only 10% platform fee.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" onClick={handleGetStarted} className="text-base">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline" className="text-base">
                            View Documentation
                        </Button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-y bg-muted/30">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-3xl font-bold">{formatNumber(stats.users)}</div>
                            <div className="text-sm text-muted-foreground mt-1">Active Players</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">{formatNumber(stats.games)}</div>
                            <div className="text-sm text-muted-foreground mt-1">Games Published</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">{formatNumber(githubStats.stars)}</div>
                            <div className="text-sm text-muted-foreground mt-1">GitHub Stars</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-green-600">$0</div>
                            <div className="text-sm text-muted-foreground mt-1">Platform Fees</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Zero Commission Section */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4">Keep Every Dollar You Earn</h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                While other platforms take up to 30%, VAPR charges 0% commission on game sales
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Direct Payments</h3>
                                        <p className="text-muted-foreground">Connect your payment processor and receive funds instantly</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Secure Transactions</h3>
                                        <p className="text-muted-foreground">Enterprise-grade security with fraud protection</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Global Reach</h3>
                                        <p className="text-muted-foreground">Accept payments worldwide in any currency</p>
                                    </div>
                                </div>
                            </div>

                            <Card>
                                <CardContent className="p-8">
                                    <h3 className="text-lg font-semibold mb-6 text-center">Platform Comparison</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="font-medium">VAPR</span>
                                                <span className="font-bold text-green-600">0%</span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full w-[1%] bg-green-600 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span>Steam</span>
                                                <span className="text-muted-foreground">30%</span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full w-[30%] bg-muted-foreground/50 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span>Epic Games</span>
                                                <span className="text-muted-foreground">12%</span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <div className="h-full w-[12%] bg-muted-foreground/50 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Subscriptions */}
            <section className="py-24 bg-muted/30">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <Badge variant="secondary" className="mb-4">10% Commission</Badge>
                            <h2 className="text-4xl font-bold mb-4">Premium Subscriptions</h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Create recurring revenue streams with subscription tiers for your most dedicated fans
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="border-2">
                                <CardContent className="p-6">
                                    <Crown className="h-8 w-8 text-primary mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Tiered Benefits</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Create multiple tiers with unique rewards
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Exclusive content
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Early access
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Special perks
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardContent className="p-6">
                                    <Heart className="h-8 w-8 text-primary mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Fan Engagement</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Build deeper connections with supporters
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Private streams
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Dev updates
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Direct feedback
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-2">
                                <CardContent className="p-6">
                                    <TrendingUp className="h-8 w-8 text-primary mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Predictable Revenue</h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Sustainable income from loyal players
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Monthly recurring
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Auto billing
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                            Analytics
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Open Source Section */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <Badge variant="secondary" className="mb-4">
                                <Code2 className="h-3 w-3 mr-1" />
                                100% Open Source
                            </Badge>
                            <h2 className="text-4xl font-bold mb-4">Built in the Open</h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                VAPR is completely open source. Audit the code, contribute features, or self-host your own instance.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Complete Transparency</h3>
                                        <p className="text-muted-foreground">Every line of code is public and auditable</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Community Driven</h3>
                                        <p className="text-muted-foreground">Built by developers, for developers</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Zap className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">No Vendor Lock-in</h3>
                                        <p className="text-muted-foreground">Fork or self-host anytime you want</p>
                                    </div>
                                </div>
                            </div>

                            <Card>
                                <CardContent className="p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Github className="h-6 w-6" />
                                        <h3 className="text-lg font-semibold">VAPR on GitHub</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="text-center p-4 bg-muted rounded-lg">
                                            <div className="text-2xl font-bold flex items-center justify-center gap-2">
                                                <Star className="h-5 w-5" />
                                                {formatNumber(githubStats.stars)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Stars</div>
                                        </div>
                                        <div className="text-center p-4 bg-muted rounded-lg">
                                            <div className="text-2xl font-bold">{formatNumber(githubStats.forks)}</div>
                                            <div className="text-sm text-muted-foreground">Forks</div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={() => window.open('https://github.com/Vic92548/VAPR', '_blank')}
                                    >
                                        <Github className="mr-2 h-4 w-4" />
                                        View on GitHub
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-muted/30">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Professional tools designed for modern game developers
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <Card>
                            <CardContent className="p-6">
                                <BarChart3 className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold mb-2">Analytics</h3>
                                <p className="text-sm text-muted-foreground">
                                    Real-time insights into player behavior and revenue
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <Key className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold mb-2">Key Management</h3>
                                <p className="text-sm text-muted-foreground">
                                    Generate and track distribution keys with ease
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <Users className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold mb-2">Community Tools</h3>
                                <p className="text-sm text-muted-foreground">
                                    Build and engage your player community
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <Zap className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold mb-2">Auto Updates</h3>
                                <p className="text-sm text-muted-foreground">
                                    Push updates instantly to all players
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <Globe className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold mb-2">Global CDN</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fast downloads from servers worldwide
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <Shield className="h-8 w-8 text-primary mb-4" />
                                <h3 className="font-semibold mb-2">Security</h3>
                                <p className="text-sm text-muted-foreground">
                                    Advanced DRM and anti-piracy protection
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Join thousands of developers building their success on VAPR.
                        Free forever for indie developers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" onClick={handleGetStarted}>
                            Launch Your Game
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline">
                            Read Documentation
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Gamepad2 className="h-5 w-5 text-primary" />
                            <span className="font-semibold">VAPR Partners</span>
                        </div>
                        <div className="flex space-x-6 text-sm text-muted-foreground">
                            <a href="/terms" className="hover:text-foreground">Terms</a>
                            <a href="/privacy" className="hover:text-foreground">Privacy</a>
                            <a href="https://github.com/Vic92548/VAPR" className="hover:text-foreground">GitHub</a>
                            <a href="https://discord.gg/vapr" className="hover:text-foreground">Discord</a>
                        </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground mt-8">
                        © 2025 RSPWN LTD. MIT Licensed. Built with ❤️ by the community.
                    </div>
                </div>
            </footer>
        </div>
    )
}