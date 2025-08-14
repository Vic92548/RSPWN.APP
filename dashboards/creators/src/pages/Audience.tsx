import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Layout from "@/components/Layout"
import apiClient, { type Analytics, type PopularPostWithFollowers } from "@/lib/api-client"
import {
    Users,
    UserPlus,
    TrendingUp,
    Heart,
    Activity,
    Eye,
    ThumbsUp,
    MessageSquare,
    Zap
} from "lucide-react"
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts'

interface User {
    id: string;
    username: string;
    email: string;
    avatar: string;
    level: number;
}

interface EngagedFollower {
    id: string;
    username: string;
    avatar: string;
    level: number;
    followedAt: string;
    engagementScore: number;
    engagementStats: {
        likes: number;
        views: number;
        reactions: number;
        follows: number;
    };
}

export default function Audience() {
    const [user, setUser] = useState<User | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [topFollowers, setTopFollowers] = useState<EngagedFollower[]>([]);
    const [popularPosts, setPopularPosts] = useState<PopularPostWithFollowers[]>([]);
    const [loadingFollowers, setLoadingFollowers] = useState(false);
    const [loadingPopular, setLoadingPopular] = useState(false);

    useEffect(() => {
        loadAudienceData();
    }, [timeRange]);

    useEffect(() => {
        if (user) {
            loadFollowers();
            loadPopularContent();
        }
    }, [user, timeRange]);

    const loadAudienceData = async () => {
        try {
            setLoading(true);
            const [userData, analyticsData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getAnalytics(timeRange)
            ]);

            setUser(userData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Failed to load audience data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFollowers = async () => {
        if (!user) return;

        try {
            setLoadingFollowers(true);
            const followersData = await apiClient.getTopEngagedFollowers(user.id, 8, parseInt(timeRange));
            setTopFollowers(followersData.followers || []);
        } catch (error) {
            console.error('Failed to load followers:', error);
            setTopFollowers([]);
        } finally {
            setLoadingFollowers(false);
        }
    };

    const loadPopularContent = async () => {
        if (!user) return;

        try {
            setLoadingPopular(true);
            const popularData = await apiClient.getPopularContentLovedByFollowers(
                user.id,
                6,
                parseInt(timeRange)
            );
            setPopularPosts(popularData.posts || []);
        } catch (error) {
            console.error('Failed to load popular content:', error);
            setPopularPosts([]);
        } finally {
            setLoadingPopular(false);
        }
    };

    const formatNumber = (num: number | undefined | null) => {
        if (num === undefined || num === null || isNaN(num)) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getAvatarUrl = (userId: string, avatar: string | null) => {
        if (!avatar) return '/default-avatar.png';
        return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`;
    };

    const getEngagementBadge = (score: number) => {
        if (score >= 1000) return { label: 'Super Fan', variant: 'default' as const };
        if (score >= 500) return { label: 'Top Fan', variant: 'secondary' as const };
        if (score >= 100) return { label: 'Active Fan', variant: 'outline' as const };
        return { label: 'Fan', variant: 'outline' as const };
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading audience insights...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Audience Insights</h1>
                        <p className="text-muted-foreground">Understand your followers and optimize your content</p>
                    </div>
                    <Tabs value={timeRange} onValueChange={setTimeRange}>
                        <TabsList>
                            <TabsTrigger value="7">7 Days</TabsTrigger>
                            <TabsTrigger value="30">30 Days</TabsTrigger>
                            <TabsTrigger value="90">90 Days</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.totals?.followers || 0)}</div>
                            <p className="text-xs text-muted-foreground">Active community members</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Followers</CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatNumber(analytics?.totals?.newFollowers || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">In last {timeRange} days</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {analytics?.totals?.views && analytics.totals.views > 0
                                    ? ((((analytics.totals.likes || 0) + (analytics.totals.follows || 0)) / analytics.totals.views) * 100).toFixed(1)
                                    : '0'}%
                            </div>
                            <p className="text-xs text-muted-foreground">Per post interaction</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${
                                analytics?.comparison?.follows && parseFloat(analytics.comparison.follows.change) > 0
                                    ? 'text-green-500'
                                    : analytics?.comparison?.follows && parseFloat(analytics.comparison.follows.change) < 0
                                        ? 'text-red-500'
                                        : 'text-muted-foreground'
                            }`}>
                                {analytics?.comparison?.follows
                                    ? `${parseFloat(analytics.comparison.follows.change) > 0 ? '+' : ''}${analytics.comparison.follows.change}%`
                                    : '0%'}
                            </div>
                            <p className="text-xs text-muted-foreground">vs previous {timeRange} days</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Follower Growth</CardTitle>
                            <CardDescription>Track your audience expansion</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={analytics?.charts.followerGrowth || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatDate}
                                        stroke="#666"
                                    />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))'
                                        }}
                                        labelFormatter={formatDate}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="followers"
                                        stroke="#8b5cf6"
                                        fill="#8b5cf6"
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Popular Posts Your Followers Love</CardTitle>
                            <CardDescription>Content from other creators that resonates with your audience</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingPopular ? (
                                <div className="flex items-center justify-center h-[300px]">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : popularPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        {analytics?.totals?.followers === 0
                                            ? "You don't have followers yet"
                                            : "Your followers haven't liked any posts recently"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {popularPosts.slice(0, 5).map((post, index) => (
                                        <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="text-lg font-bold text-muted-foreground w-6">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{post.title}</p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                        <span>@{post.creator.username}</span>
                                                        {post.taggedGame && (
                                                            <Badge variant="outline" className="text-xs py-0">
                                                                {post.taggedGame.title}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-3 text-xs mb-1">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {formatNumber(post.metrics.totalViews)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {formatNumber(post.metrics.totalLikes)}
                                                    </span>
                                                </div>
                                                <div className="text-xs font-medium text-primary">
                                                    {formatNumber(post.metrics.followerLikes)} of your followers
                                                    <span className="text-muted-foreground"> ({post.metrics.followerLikePercentage}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {popularPosts.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-4 text-center">
                                    Create similar content to appeal to your audience
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Most Engaged Community Members</CardTitle>
                        <CardDescription>Your top fans based on their interactions in the last {timeRange} days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingFollowers ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : topFollowers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No engaged followers in this time period. Keep creating great content!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topFollowers.map((follower, index) => {
                                    const badge = getEngagementBadge(follower.engagementScore);
                                    return (
                                        <div key={follower.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-lg font-bold text-muted-foreground w-8">
                                                    #{index + 1}
                                                </div>
                                                <img
                                                    src={getAvatarUrl(follower.id, follower.avatar)}
                                                    alt={follower.username}
                                                    className="h-10 w-10 rounded-full bg-muted"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{follower.username}</p>
                                                        <Badge variant={badge.variant} className="text-xs">
                                                            {badge.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                                        <span>Level {follower.level}</span>
                                                        <span className="flex items-center gap-1">
                                                           <Eye className="h-3 w-3" />
                                                            {formatNumber(follower.engagementStats.views)}
                                                       </span>
                                                        <span className="flex items-center gap-1">
                                                           <ThumbsUp className="h-3 w-3" />
                                                            {formatNumber(follower.engagementStats.likes)}
                                                       </span>
                                                        <span className="flex items-center gap-1">
                                                           <MessageSquare className="h-3 w-3" />
                                                            {formatNumber(follower.engagementStats.reactions)}
                                                       </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm font-medium">
                                                    <Zap className="h-4 w-4 text-yellow-500" />
                                                    {formatNumber(follower.engagementScore)}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Engagement score
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}