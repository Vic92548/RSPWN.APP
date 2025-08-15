import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    TrendingUp,
    Users,
    BarChart3,
    DollarSign,
    Zap,
    Eye,
    Heart,
    Calendar,
    ArrowRight,
    CheckCircle2,
    Video,
    Image,
    Share2,
    Gamepad2,
    UserPlus
} from "lucide-react"
import apiClient from "@/lib/api-client"

export default function LandingPage() {
    const [stats, setStats] = useState({
        users: 0,
        creators: 0,
        posts: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [userCount] = await Promise.all([
                apiClient.getUserCount()
            ]);

            setStats({
                users: userCount.count,
                creators: Math.floor(userCount.count * 0.15), // Estimate 15% are creators
                posts: Math.floor(userCount.count * 2.8) // Estimate based on engagement
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
                            <TrendingUp className="h-8 w-8 text-primary" />
                            <span className="text-2xl font-bold">VAPR Creators</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/creator-program">
                                <Button variant="outline">Creator Program</Button>
                            </Link>
                            <Button onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                                Sign In with Discord
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="w-full">
                <div className="container mx-auto px-4 py-20 text-center">
                    <Badge className="mb-4 bg-muted text-foreground border-border" variant="secondary">
                        🎮 Content Creator Platform
                    </Badge>
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Grow Your Audience on <span className="text-primary">VAPR</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Join the next generation gaming social platform. Share your content,
                        track your performance, and earn money through our creator program.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" onClick={handleGetStarted} className="gap-2 bg-primary hover:bg-primary/90">
                            Start Creating <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Link to="/creator-program">
                            <Button size="lg" variant="outline" className="border-border hover:bg-accent">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Creator Program
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{formatNumber(stats.users)}</div>
                            <div className="text-muted-foreground">Active Community</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{formatNumber(stats.creators)}</div>
                            <div className="text-muted-foreground">Content Creators</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-primary">{formatNumber(stats.posts)}</div>
                            <div className="text-muted-foreground">Posts Created</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full bg-background/50">
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Everything Creators Need to Succeed</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            VAPR provides powerful tools designed specifically for gaming content creators
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="bg-card border-border hover:border-accent transition-colors">
                            <CardHeader>
                                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Advanced Analytics</CardTitle>
                                <CardDescription>
                                    Track your content performance with professional analytics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Real-time view tracking
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Engagement metrics
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Follower insights
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-accent transition-colors">
                            <CardHeader>
                                <Users className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Audience Insights</CardTitle>
                                <CardDescription>
                                    Understand your followers and what content they love
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Top engaged followers
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Content preferences
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Growth tracking
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-accent transition-colors">
                            <CardHeader>
                                <DollarSign className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Monetization</CardTitle>
                                <CardDescription>
                                    Earn 20% commission through our creator program
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        20% revenue share
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Instant payments
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Game tag attribution
                                    </li>
                                </ul>
                                <Link to="/creator-program" className="mt-4 inline-block">
                                    <Button variant="outline" size="sm">
                                        Learn More <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-accent transition-colors">
                            <CardHeader>
                                <Calendar className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Content Management</CardTitle>
                                <CardDescription>
                                    Organize and manage all your posts in one place
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Post scheduling
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Media management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Performance tracking
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-accent transition-colors">
                            <CardHeader>
                                <Gamepad2 className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Game Tagging</CardTitle>
                                <CardDescription>
                                    Tag games in your posts for automatic creator attribution
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Auto-apply creator codes
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Increase conversions
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Track performance
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border hover:border-accent transition-colors">
                            <CardHeader>
                                <Zap className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Real-time Engagement</CardTitle>
                                <CardDescription>
                                    See how your audience interacts with your content instantly
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Live view counts
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Reaction tracking
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        Follower notifications
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="w-full">
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">How VAPR Works for Creators</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Start creating content and growing your audience in minutes
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserPlus className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">1. Sign Up</h3>
                            <p className="text-sm text-muted-foreground">
                                Create your account with Discord in seconds
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Share2 className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">2. Share Content</h3>
                            <p className="text-sm text-muted-foreground">
                                Post images and videos of your gaming content
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Eye className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">3. Track Performance</h3>
                            <p className="text-sm text-muted-foreground">
                                Monitor views, engagement, and follower growth
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">4. Earn Money</h3>
                            <p className="text-sm text-muted-foreground">
                                Join the creator program and monetize your content
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Types Section */}
            <section className="w-full bg-background/50">
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Content That Performs on VAPR</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Share your best gaming moments and build your community
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <Card className="bg-card border-border">
                            <CardHeader className="text-center">
                                <Image className="h-12 w-12 text-primary mx-auto mb-2" />
                                <CardTitle>Screenshots</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Epic gaming moments, beautiful landscapes, character showcases
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="text-center">
                                <Video className="h-12 w-12 text-primary mx-auto mb-2" />
                                <CardTitle>Video Clips</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Gameplay highlights, tutorials, funny moments, speedruns
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="text-center">
                                <Heart className="h-12 w-12 text-primary mx-auto mb-2" />
                                <CardTitle>Community Posts</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Game reviews, tips & tricks, memes, fan art
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="w-full">
                <div className="container mx-auto px-4 py-20">
                    <Card className="bg-secondary border-border">
                        <CardContent className="text-center py-12">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <h3 className="text-3xl font-bold mb-4">Ready to Grow Your Audience?</h3>
                            <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
                                Join thousands of creators on VAPR. Track your performance,
                                engage with your audience, and earn money from your content.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button
                                    size="lg"
                                    onClick={handleGetStarted}
                                    className="gap-2 bg-primary hover:bg-primary/90"
                                >
                                    Start Creating <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Link to="/creator-program">
                                    <Button size="lg" variant="outline">
                                        Learn About Monetization
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full border-t border-border bg-background/50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            <span className="font-semibold">VAPR Creators</span>
                        </div>
                        <div className="flex space-x-6 text-sm text-muted-foreground">
                            <Link to="/creator-program" className="hover:text-foreground transition-colors">
                                Creator Program
                            </Link>
                            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
                            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
                            <a href="https://discord.gg/vapr" className="hover:text-foreground transition-colors">Discord</a>
                            <a href="mailto:creators@vapr.club" className="hover:text-foreground transition-colors">Contact</a>
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