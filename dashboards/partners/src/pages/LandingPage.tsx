import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    CheckCircle2
} from "lucide-react"
import apiClient from "@/lib/api-client"

export default function LandingPage() {
    const [stats, setStats] = useState({
        users: 0,
        games: 0,
        posts: 0
    });

    useEffect(() => {
        loadStats();
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
                posts: Math.floor(gamesData.games.length * 12.5) // Estimate based on average posts per game
            });
        } catch (error) {
            console.error('Failed to load stats:', error);
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
        <div className="min-h-screen w-full bg-gradient-to-b from-background to-background/95">
            {/* Navigation */}
            <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Gamepad2 className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold">VAPR Partners</span>
                        </div>
                        <Button onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                            Sign In with Discord
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="w-full">
                <div className="container mx-auto px-4 py-20 text-center">
                    <Badge className="mb-4 bg-primary/20 text-primary border-primary/30" variant="secondary">
                        🎮 Game Developer Platform
                    </Badge>
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Grow Your Game on <span className="text-primary">VAPR</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Join the next generation gaming community platform. Share your games,
                        connect with players, and build a thriving community around your creations.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" onClick={handleGetStarted} className="gap-2 bg-primary hover:bg-primary/90">
                            Get Started <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/10">
                            Learn More
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{formatNumber(stats.users)}</div>
                            <div className="text-muted-foreground">Active Gamers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{formatNumber(stats.games)}</div>
                            <div className="text-muted-foreground">Games Published</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{formatNumber(stats.posts)}</div>
                            <div className="text-muted-foreground">Community Posts</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full bg-background/50">
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            VAPR provides powerful tools and features designed specifically for game developers
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Analytics Dashboard</CardTitle>
                                <CardDescription>
                                    Track your game's performance with detailed analytics and insights
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Real-time view tracking
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Player engagement metrics
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Conversion analytics
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <Users className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Community Building</CardTitle>
                                <CardDescription>
                                    Connect directly with your player base and grow your community
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Direct player feedback
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Community posts & updates
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Follower notifications
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <Key className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Key Management</CardTitle>
                                <CardDescription>
                                    Generate and manage game keys for distribution and promotions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Bulk key generation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Usage tracking
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        CSV export
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <Zap className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Version Control</CardTitle>
                                <CardDescription>
                                    Manage game updates and notify players of new versions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Automatic update notifications
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Changelog management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Version history
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Creator Program</CardTitle>
                                <CardDescription>
                                    Partner with content creators to expand your game's reach
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Creator partnerships
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Revenue sharing
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Performance tracking
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <Globe className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Global Reach</CardTitle>
                                <CardDescription>
                                    Reach players worldwide with VAPR's growing community
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        International exposure
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Multi-language support
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Global payment options
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="w-full">
                <div className="container mx-auto px-4 py-20">
                    <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="text-center py-12">
                            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <h3 className="text-3xl font-bold mb-4">Ready to Launch Your Game?</h3>
                            <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
                                Join VAPR today and start building your gaming community.
                                It's free to get started!
                            </p>
                            <Button
                                size="lg"
                                onClick={handleGetStarted}
                                className="gap-2 bg-primary hover:bg-primary/90"
                            >
                                Sign Up Now <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full border-t border-border bg-background/50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <Gamepad2 className="h-6 w-6 text-primary" />
                            <span className="font-semibold">VAPR Partners</span>
                        </div>
                        <div className="flex space-x-6 text-sm text-muted-foreground">
                            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
                            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="https://discord.gg/vapr" className="hover:text-foreground transition-colors">Discord</a>
                            <a href="mailto:partners@vapr.club" className="hover:text-foreground transition-colors">Contact</a>
                        </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        © 2025 VAPR. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}