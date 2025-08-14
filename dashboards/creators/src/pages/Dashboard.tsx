import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Layout from "@/components/Layout"
import apiClient, { type Analytics, type PostWithStats } from "@/lib/api-client"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Eye,
    Heart,
    UserPlus,
    MousePointer,
    MessageSquare,
    ArrowRight,
    Calendar,
    ExternalLink,
    Minus, Users
} from "lucide-react"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart
} from 'recharts'

interface User {
    id: string;
    username: string;
    email: string;
    avatar: string;
    level: number;
    xp: number;
    xp_required: number;
}

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [posts, setPosts] = useState<PostWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7');
    const [creatorStatus, setCreatorStatus] = useState<any>(null);

    useEffect(() => {
        loadDashboardData();
    }, [timeRange]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [userData, analyticsData, postsData, creatorData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getAnalytics(timeRange),
                apiClient.getMyPosts(),
                apiClient.getCreatorStatus().catch(() => null)
            ]);

            setUser(userData);
            setAnalytics(analyticsData);
            setPosts(postsData);
            setCreatorStatus(creatorData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getEngagementRate = (post: PostWithStats) => {
        if (!post.viewsCount || post.viewsCount === 0) return 0;
        const engagements = post.likesCount + post.dislikesCount + post.followersCount;
        return ((engagements / post.viewsCount) * 100).toFixed(1);
    };

    const getChangeIcon = (change: string | undefined) => {
        if (!change) return <Minus className="h-4 w-4 text-muted-foreground" />;
        const changeNum = parseFloat(change);
        if (changeNum > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (changeNum < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const topPosts = [...posts]
        .sort((a, b) => b.viewsCount - a.viewsCount)
        .slice(0, 5);

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                {/* Header with Time Range Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
                        <p className="text-muted-foreground">Track your content performance and grow your audience</p>
                    </div>
                    <Tabs value={timeRange} onValueChange={setTimeRange}>
                        <TabsList>
                            <TabsTrigger value="7">7 Days</TabsTrigger>
                            <TabsTrigger value="30">30 Days</TabsTrigger>
                            <TabsTrigger value="90">90 Days</TabsTrigger>
                            <TabsTrigger value="all">All Time</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Creator Program Status */}
                {creatorStatus && !creatorStatus.isCreator && (
                    <Card className="mb-6 border-primary/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle>Join the Creator Program</CardTitle>
                            <CardDescription>
                                Earn revenue from your content through our creator program
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link to="/creator-program">
                                <Button>
                                    Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.totals.views || 0)}</div>
                            {analytics?.comparison && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {getChangeIcon(analytics.comparison.views.change)}
                                    <span className={
                                        parseFloat(analytics.comparison.views.change) > 0 ? 'text-green-500' :
                                            parseFloat(analytics.comparison.views.change) < 0 ? 'text-red-500' : ''
                                    }>
                                        {analytics.comparison.views.change}%
                                    </span>
                                    vs previous period
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.totals.likes || 0)}</div>
                            {analytics?.comparison && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {getChangeIcon(analytics.comparison.likes.change)}
                                    <span className={
                                        parseFloat(analytics.comparison.likes.change) > 0 ? 'text-green-500' :
                                            parseFloat(analytics.comparison.likes.change) < 0 ? 'text-red-500' : ''
                                    }>
                                        {analytics.comparison.likes.change}%
                                    </span>
                                    vs previous period
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Followers</CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(analytics?.totals.followers || 0)}</div>
                            {analytics?.comparison && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {getChangeIcon(analytics.comparison.follows.change)}
                                    <span className={
                                        parseFloat(analytics.comparison.follows.change) > 0 ? 'text-green-500' :
                                            parseFloat(analytics.comparison.follows.change) < 0 ? 'text-red-500' : ''
                                    }>
                                        {analytics.comparison.follows.change}%
                                    </span>
                                    new followers
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                            <MousePointer className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {
                                    //@ts-ignore
                                    analytics?.totals.views > 0
                                        //@ts-ignore
                                    ? ((analytics.totals.likes + analytics.totals.dislikes + analytics.totals.follows) / analytics.totals.views * 100).toFixed(1)
                                    : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Average across all posts
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Views Over Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Views Over Time</CardTitle>
                            <CardDescription>Track your content reach</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={analytics?.charts.timeSeries || []}>
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
                                        dataKey="views"
                                        stroke="hsl(var(--primary))"
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Engagement Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Engagement Metrics</CardTitle>
                            <CardDescription>Likes and clicks performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics?.charts.timeSeries || []}>
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
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="likes"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="clicks"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Follower Growth */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Follower Growth</CardTitle>
                            <CardDescription>Your audience expansion over time</CardDescription>
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

                    {/* Reactions Breakdown */}
                    {analytics?.totals.reactions && Object.keys(analytics.totals.reactions).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Reactions Breakdown</CardTitle>
                                <CardDescription>How people react to your content</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={Object.entries(analytics.totals.reactions).map(([emoji, count]) => ({
                                            emoji,
                                            count
                                        }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="emoji" stroke="#666" />
                                        <YAxis stroke="#666" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Top Posts */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Top Performing Posts</CardTitle>
                                <CardDescription>Your best content in the selected period</CardDescription>
                            </div>
                            <Link to="/content">
                                <Button variant="outline" size="sm">
                                    View All <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topPosts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No posts yet. Create your first post to start tracking performance!</p>
                                    <Link to="/content">
                                        <Button className="mt-4">Create Post</Button>
                                    </Link>
                                </div>
                            ) : (
                                topPosts.map((post, index) => (
                                    <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="text-2xl font-bold text-muted-foreground">
                                                #{index + 1}
                                            </div>
                                            {post.mediaType === 'image' && post.content && (
                                                <img
                                                    src={post.content}
                                                    alt={post.title}
                                                    className="w-16 h-16 rounded object-cover"
                                                />
                                            )}
                                            {post.mediaType === 'video' && (
                                                <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                                                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold truncate">{post.title}</h4>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {formatNumber(post.viewsCount)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {formatNumber(post.likesCount)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <UserPlus className="h-3 w-3" />
                                                        {formatNumber(post.followersCount)}
                                                    </span>
                                                    <Badge variant="outline" className="ml-auto">
                                                        {getEngagementRate(post)}% engagement
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Link to={`/analytics/${post.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <BarChart3 className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <a href={`/post/${post.id}`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <Link to="/content">
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Create New Post
                                </CardTitle>
                                <CardDescription>
                                    Share new content with your audience
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Link to="/audience">
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    View Audience
                                </CardTitle>
                                <CardDescription>
                                    Understand your followers better
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <a href={`/@${user?.username}`} target="_blank" rel="noopener noreferrer">
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ExternalLink className="h-5 w-5" />
                                    View Profile
                                </CardTitle>
                                <CardDescription>
                                    See your public creator profile
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </a>
                </div>
            </div>
        </Layout>
    );
}