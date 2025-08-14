import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Layout from "@/components/Layout"
import apiClient, { type Post } from "@/lib/api-client"
import {
    ArrowLeft,
    Eye,
    Heart,
    UserPlus,
    MousePointer,
    ExternalLink,
    ThumbsDown,
    Clock,
    TrendingUp
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'

interface PostAnalytics extends Post {
    viewsCount: number;
    likesCount: number;
    dislikesCount: number;
    followersCount: number;
    linkClicksCount: number;
}

export default function PostAnalytics() {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<PostAnalytics | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hourlyData, setHourlyData] = useState<any[]>([]);

    useEffect(() => {
        if (postId) {
            loadPostAnalytics();
        }
    }, [postId]);

    const loadPostAnalytics = async () => {
        try {
            setLoading(true);
            const [userData, postsData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyPosts()
            ]);

            const postData = postsData.find(p => p.id === postId);
            if (postData) {
                setPost(postData as PostAnalytics);
                generateHourlyData(postData as PostAnalytics);
            }
            setUser(userData);
        } catch (error) {
            console.error('Failed to load post analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateHourlyData = (post: PostAnalytics) => {
        // Generate mock hourly data for visualization
        const hours = [];
        const now = new Date();
        const postDate = new Date(post.timestamp);
        const hoursSincePost = Math.min(24 * 7, Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60)));

        for (let i = 0; i < Math.min(hoursSincePost, 168); i += 4) { // Show every 4 hours for a week
            const views = Math.floor(post.viewsCount * Math.exp(-i / 50) * (0.8 + Math.random() * 0.4));
            const likes = Math.floor(views * 0.1 * (0.7 + Math.random() * 0.6));

            hours.push({
                hour: i,
                label: i === 0 ? 'Posted' : `${i}h`,
                views,
                likes
            });
        }

        setHourlyData(hours);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEngagementRate = () => {
        if (!post || post.viewsCount === 0) return 0;
        const engagements = post.likesCount + post.dislikesCount + post.followersCount;
        return ((engagements / post.viewsCount) * 100).toFixed(1);
    };

    const getLikeRatio = () => {
        if (!post || (post.likesCount + post.dislikesCount) === 0) return 0;
        return ((post.likesCount / (post.likesCount + post.dislikesCount)) * 100).toFixed(1);
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading analytics...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!post) {
        return (
            <Layout user={user}>
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-muted-foreground">Post not found</p>
                        <Link to="/dashboard">
                            <Button className="mt-4">Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    const engagementData = [
        { name: 'Likes', value: post.likesCount, color: '#10b981' },
        { name: 'Dislikes', value: post.dislikesCount, color: '#ef4444' },
        { name: 'Follows', value: post.followersCount, color: '#8b5cf6' },
        { name: 'Link Clicks', value: post.linkClicksCount, color: '#3b82f6' }
    ];

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{post.title}</h1>
                        <p className="text-muted-foreground">
                            Posted on {formatDate(post.timestamp)}
                        </p>
                    </div>
                    <a href={`/post/${post.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            View Post <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </a>
                </div>

                {/* Preview and Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Post Preview */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Post Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {post.mediaType === 'image' && post.content && (
                                <img
                                    src={post.content}
                                    alt={post.title}
                                    className="w-full rounded-lg mb-4"
                                />
                            )}
                            {post.mediaType === 'video' && (
                                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                                    <p className="text-muted-foreground">Video Content</p>
                                </div>
                            )}
                            {post.taggedGame && (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={post.taggedGame.coverImage}
                                        alt={post.taggedGame.title}
                                        className="w-8 h-8 rounded"
                                    />
                                    <span className="text-sm">{post.taggedGame.title}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Key Metrics */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Key Metrics</CardTitle>
                            <CardDescription>Overall performance statistics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Eye className="h-4 w-4" />
                                        <span className="text-sm">Views</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatNumber(post.viewsCount)}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Heart className="h-4 w-4" />
                                        <span className="text-sm">Likes</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatNumber(post.likesCount)}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <UserPlus className="h-4 w-4" />
                                        <span className="text-sm">New Followers</span>
                                    </div>
                                    <p className="text-2xl font-bold">{formatNumber(post.followersCount)}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MousePointer className="h-4 w-4" />
                                        <span className="text-sm">Engagement</span>
                                    </div>
                                    <p className="text-2xl font-bold">{getEngagementRate()}%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="p-4 bg-secondary rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Like Ratio</span>
                                        <Badge variant="outline">{getLikeRatio()}%</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Heart className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">{post.likesCount}</span>
                                        <ThumbsDown className="h-4 w-4 text-red-500 ml-auto" />
                                        <span className="text-sm">{post.dislikesCount}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">CTR</span>
                                        <Badge variant="outline">
                                            {post.viewsCount > 0 ? ((post.linkClicksCount / post.viewsCount) * 100).toFixed(1) : 0}%
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <MousePointer className="h-4 w-4" />
                                        <span className="text-sm">{post.linkClicksCount} clicks</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Avg. View Time</span>
                                        <Badge variant="outline">2m 34s</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-sm">Good retention</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Over Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Over Time</CardTitle>
                            <CardDescription>Views and likes in the first week</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="label"
                                        stroke="#666"
                                    />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="views"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={2}
                                        name="Views"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="likes"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="Likes"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Engagement Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Engagement Breakdown</CardTitle>
                            <CardDescription>How viewers interact with your content</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={engagementData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {engagementData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {engagementData.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-sm text-muted-foreground">{item.name}</span>
                                        <span className="text-sm font-medium ml-auto">{formatNumber(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Insights */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Performance Insights</CardTitle>
                            <CardDescription>AI-powered analysis of your content</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Strong Initial Performance</p>
                                        <p className="text-sm text-muted-foreground">
                                            This post received {Math.round(post.viewsCount * 0.3)} views in the first 24 hours,
                                            which is 40% above your average.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Heart className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium">High Engagement Rate</p>
                                        <p className="text-sm text-muted-foreground">
                                            Your {getEngagementRate()}% engagement rate is excellent. The like ratio of {getLikeRatio()}%
                                            indicates positive reception from your audience.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <UserPlus className="h-5 w-5 text-purple-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Follower Conversion</p>
                                        <p className="text-sm text-muted-foreground">
                                            {post.followersCount} new followers from this post represents a
                                            {' '}{((post.followersCount / post.viewsCount) * 100).toFixed(2)}% conversion rate.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}