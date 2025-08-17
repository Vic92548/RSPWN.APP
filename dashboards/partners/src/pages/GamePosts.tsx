import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Layout from "@/components/Layout";
import {
    ArrowLeft,
    FileText,
    CheckCircle,
    XCircle,
    Calendar,
    ExternalLink,
    Loader2,
    Archive,
    Info
} from "lucide-react";
import apiClient from "@/lib/api-client";

interface Post {
    id: string;
    title: string;
    content: string;
    userId: string;
    username: string;
    userAvatar: string;
    userLevel: number;
    timestamp: string;
    mediaType: string;
    isApproved: boolean;
}

export default function GamePosts() {
    const { gameId } = useParams<{ gameId: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [game, setGame] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [bucketId, setBucketId] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState('all');

    useEffect(() => {
        loadData();
    }, [gameId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, gamesData, postsData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyGames(),
                apiClient.getPostsForGameManagement(gameId!)
            ]);

            setUser(userData);
            const gameData = gamesData.games.find(g => g.id === gameId);
            setGame(gameData);
            setPosts(postsData.posts);
            setBucketId(postsData.bucketId);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePost = async (post: Post) => {
        try {
            setSaving(post.id);

            // Create bucket if it doesn't exist
            if (!bucketId) {
                const bucketResponse = await apiClient.createBucket({
                    name: `Official ${game.title} Posts`,
                    description: `Curated posts showcasing ${game.title}`,
                    type: 'game_posts',
                    visibility: 'public',
                    metadata: {
                        gameId: game.id
                    }
                });
                setBucketId(bucketResponse.bucket.id);
            }

            const currentBucketId = bucketId || (await apiClient.getUserBuckets()).buckets
                .find(b => b.type === 'game_posts' && b.metadata?.gameId === game.id)?.id;

            if (post.isApproved) {
                // Remove from bucket
                const items = await apiClient.getBucketItems(currentBucketId!);
                const item = items.items.find(i => i.itemId === post.id);
                if (item) {
                    await apiClient.removeItemFromBucket(currentBucketId!, item.id);
                }
            } else {
                // Add to bucket
                await apiClient.addItemToBucket(currentBucketId!, {
                    itemId: post.id,
                    itemType: 'post',
                    notes: `Approved by ${user.username}`,
                    metadata: {
                        approvedAt: new Date().toISOString(),
                        approvedBy: user.id
                    }
                });
            }

            // Refresh data
            await loadData();
        } catch (error) {
            console.error('Failed to toggle post:', error);
        } finally {
            setSaving(null);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading posts...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!game) {
        return (
            <Layout user={user}>
                <div className="container mx-auto px-4 py-8">
                    <p>Game not found</p>
                </div>
            </Layout>
        );
    }

    const approvedPosts = posts.filter(p => p.isApproved);
    const pendingPosts = posts.filter(p => !p.isApproved);

    const filteredPosts = selectedTab === 'all' ? posts
        : selectedTab === 'approved' ? approvedPosts
            : pendingPosts;

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <FileText className="h-8 w-8" />
                            Manage Posts - {game.title}
                        </h1>
                        <p className="text-muted-foreground">
                            Review and curate posts featuring your game
                        </p>
                    </div>
                </div>

                <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        <strong>VAPR Buckets:</strong> Approved posts are stored in your game's official bucket.
                        These posts will be displayed on your game's store page and can be managed here.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Total Posts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{posts.length}</div>
                            <p className="text-sm text-muted-foreground">Featuring your game</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Approved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{approvedPosts.length}</div>
                            <p className="text-sm text-muted-foreground">In official bucket</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Pending Review</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{pendingPosts.length}</div>
                            <p className="text-sm text-muted-foreground">Awaiting approval</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">All Posts ({posts.length})</TabsTrigger>
                        <TabsTrigger value="approved">Approved ({approvedPosts.length})</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({pendingPosts.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedTab} className="mt-6">
                        {filteredPosts.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-lg font-semibold mb-2">No posts found</p>
                                    <p className="text-muted-foreground">
                                        {selectedTab === 'approved'
                                            ? "You haven't approved any posts yet"
                                            : selectedTab === 'pending'
                                                ? "No posts are pending review"
                                                : "No posts have tagged your game yet"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredPosts.map((post) => (
                                    <Card key={post.id} className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex gap-4 p-4">
                                                {/* Thumbnail */}
                                                <div className="w-48 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                    {post.mediaType === 'video' ? (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={post.content}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-lg line-clamp-1">
                                                                {post.title}
                                                            </h3>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                <div className="flex items-center gap-1">
                                                                    <img
                                                                        src={post.userAvatar ?
                                                                            `https://cdn.discordapp.com/avatars/${post.userId}/${post.userAvatar}.png`
                                                                            : '/default-avatar.png'}
                                                                        alt={post.username}
                                                                        className="h-4 w-4 rounded-full"
                                                                    />
                                                                    <span>{post.username}</span>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Lvl {post.userLevel}
                                                                    </Badge>
                                                                </div>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(post.timestamp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant={post.isApproved ? "secondary" : "outline"}
                                                            className={post.isApproved ? "text-green-600" : ""}
                                                        >
                                                            {post.isApproved ? (
                                                                <>
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Approved
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Not Approved
                                                                </>
                                                            )}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant={post.isApproved ? "destructive" : "default"}
                                                                size="sm"
                                                                onClick={() => handleTogglePost(post)}
                                                                disabled={saving === post.id}
                                                            >
                                                                {saving === post.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : post.isApproved ? (
                                                                    <>
                                                                        <XCircle className="h-4 w-4 mr-1" />
                                                                        Remove
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Approve
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <a
                                                                href={`https://vapr.club/post/${post.id}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                >
                                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                                View Post
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    </Card>
                                    ))}
                            </div>
                            )}
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}