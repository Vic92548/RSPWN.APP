import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Layout from "@/components/Layout"
import apiClient, { type PostWithStats, type Game } from "@/lib/api-client"
import {
    Plus,
    Calendar,
    Clock,
    Eye,
    Heart,
    UserPlus,
    Image,
    Video,
    BarChart3,
    ExternalLink,
    Upload
} from "lucide-react"
import { Link } from 'react-router-dom'

interface User {
    id: string;
    username: string;
    email: string;
    avatar: string;
    level: number;
}

export default function ContentCalendar() {
    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<PostWithStats[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [newPost, setNewPost] = useState({
        title: '',
        taggedGameId: ''
    });

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            setLoading(true);
            const [userData, postsData, gamesData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getMyPosts(),
                apiClient.getAllGames()
            ]);

            setUser(userData);
            setPosts(postsData);
            setGames(gamesData.games);
        } catch (error) {
            console.error('Failed to load content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.title || !selectedFile) {
            alert('Please provide a title and select a file');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', newPost.title);
            formData.append('file', selectedFile);
            if (newPost.taggedGameId) {
                formData.append('taggedGameId', newPost.taggedGameId);
            }

            await apiClient.createPost(formData);

            // Reload posts
            const postsData = await apiClient.getMyPosts();
            setPosts(postsData);

            // Reset form
            setNewPost({ title: '', taggedGameId: '' });
            setSelectedFile(null);
            setCreateDialogOpen(false);
        } catch (error) {
            console.error('Failed to create post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getEngagementRate = (post: PostWithStats) => {
        if (!post.viewsCount || post.viewsCount === 0) return 0;
        const engagements = post.likesCount + post.dislikesCount + post.followersCount;
        return ((engagements / post.viewsCount) * 100).toFixed(1);
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading content...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const sortedPosts = [...posts].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Content Manager</h1>
                        <p className="text-muted-foreground">Create and manage your posts</p>
                    </div>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Post
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                                <DialogTitle>Create New Post</DialogTitle>
                                <DialogDescription>
                                    Share new content with your audience
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        placeholder="Enter post title..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="file">Media</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                        <input
                                            id="file"
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <label htmlFor="file" className="cursor-pointer">
                                            {selectedFile ? (
                                                <div className="space-y-2">
                                                    {selectedFile.type.startsWith('image/') ? (
                                                        <Image className="h-12 w-12 mx-auto text-muted-foreground" />
                                                    ) : (
                                                        <Video className="h-12 w-12 mx-auto text-muted-foreground" />
                                                    )}
                                                    <p className="text-sm font-medium">{selectedFile.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Click to upload image or video
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Max size: 50MB
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="game">Tag a Game (Optional)</Label>
                                    <select
                                        id="game"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        value={newPost.taggedGameId}
                                        onChange={(e) => setNewPost({ ...newPost, taggedGameId: e.target.value })}
                                    >
                                        <option value="">No game selected</option>
                                        {games.map((game) => (
                                            <option key={game.id} value={game.id}>
                                                {game.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleCreatePost}
                                    disabled={uploading || !newPost.title || !selectedFile}
                                >
                                    {uploading ? 'Creating...' : 'Create Post'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{posts.length}</div>
                            <p className="text-xs text-muted-foreground">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatNumber(posts.reduce((sum, post) => sum + post.viewsCount, 0))}
                            </div>
                            <p className="text-xs text-muted-foreground">Across all posts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {posts.length > 0
                                    //@ts-ignore
                                    ? (posts.reduce((sum, post) => sum + parseFloat(getEngagementRate(post)),0) / posts.length).toFixed(1)
                                    : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">Average across posts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {posts.filter(p => {
                                    const postDate = new Date(p.timestamp);
                                    const now = new Date();
                                    return postDate.getMonth() === now.getMonth() &&
                                        postDate.getFullYear() === now.getFullYear();
                                }).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Posts this month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Posts List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Posts</CardTitle>
                        <CardDescription>Manage and track performance of your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sortedPosts.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first post to start building your audience
                                </p>
                                <Button onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Post
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sortedPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        {/* Media Preview */}
                                        <div className="flex-shrink-0">
                                            {post.mediaType === 'image' && post.content && (
                                                <img
                                                    src={post.content}
                                                    alt={post.title}
                                                    className="w-20 h-20 rounded object-cover"
                                                />
                                            )}
                                            {post.mediaType === 'video' && (
                                                <div className="w-20 h-20 rounded bg-muted flex items-center justify-center">
                                                    <Video className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Post Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-semibold truncate">{post.title}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Posted on {formatDate(post.timestamp)}
                                                    </p>
                                                </div>
                                                {post.taggedGame && (
                                                    <Badge variant="secondary" className="flex-shrink-0">
                                                        {post.taggedGame.title}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mt-2 text-sm">
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

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Link to={`/analytics/${post.id}`}>
                                                <Button variant="ghost" size="icon" title="View Analytics">
                                                    <BarChart3 className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <a href={`/post/${post.id}`} target="_blank" rel="noopener noreferrer">
                                                <Button variant="ghost" size="icon" title="View Post">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}