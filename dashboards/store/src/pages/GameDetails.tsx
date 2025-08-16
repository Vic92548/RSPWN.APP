// dashboards/store/src/pages/GameDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StoreLayout from "@/components/StoreLayout";
import HtmlParser from "@/components/HtmlParser";
import {
    Heart,
    Download,
    Star,
    Calendar,
    User,
    Monitor,
    HardDrive,
    ArrowLeft,
    ExternalLink,
    Users,
    Info,
    ChevronDown,
    Gift
} from "lucide-react";
import apiClient from "@/lib/api-client";

interface GameDetailsProps {
    isAuthenticated?: boolean | null;
}

export default function GameDetails({ isAuthenticated }: GameDetailsProps) {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const [game, setGame] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [owned, setOwned] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [playerCount, setPlayerCount] = useState(0);
    const [developer, setDeveloper] = useState<{ username: string; id: string } | null>(null);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useEffect(() => {
        if (gameId) {
            loadGameDetails();
        }
    }, [gameId]);

    const loadGameDetails = async () => {
        try {
            setLoading(true);

            // Get game details
            const gameData = await apiClient.getGame(gameId!);
            if (!gameData.success || !gameData.game) {
                setGame(null);
                setLoading(false);
                return;
            }

            let enhancedGame = gameData.game;

            // Get player count if it's a VAPR game
            try {
                const keysResponse = await apiClient.getGameKeys(gameId!);
                if (keysResponse.success) {
                    const usedKeys = keysResponse.keys.filter(k => k.usedBy).length;
                    setPlayerCount(usedKeys);
                }
            } catch (error) {
                console.error('Failed to get player count:', error);
            }

            // Get developer info
            if (enhancedGame.ownerId) {
                try {
                    const userInfo = await apiClient.getUser(enhancedGame.ownerId);
                    setDeveloper({
                        username: userInfo.username,
                        id: userInfo.id
                    });
                } catch (error) {
                    console.error('Failed to get developer info:', error);
                }
            }

            // Enhance game with additional data
            // @ts-ignore
            enhancedGame = {
                ...enhancedGame,
                price: enhancedGame.price || 0,
                currency: enhancedGame.currency || 'USD',
                tags: enhancedGame.tags || ['indie', 'action'],
                publisher: enhancedGame.publisher || developer?.username || 'VAPR Developer',
                // @ts-ignore
                screenshots: [
                    enhancedGame.coverImage,
                    enhancedGame.coverImage,
                    enhancedGame.coverImage,
                    enhancedGame.coverImage
                ],
                systemRequirements: {
                    minimum: 'OS: Windows 10 64-bit\nProcessor: Intel Core i3-2100\nMemory: 4 GB RAM\nGraphics: NVIDIA GeForce GTX 660\nDirectX: Version 11\nStorage: 2 GB available space',
                    recommended: 'OS: Windows 11 64-bit\nProcessor: Intel Core i7-4770\nMemory: 8 GB RAM\nGraphics: NVIDIA GeForce RTX 3060\nDirectX: Version 12\nStorage: 2 GB available space'
                },
                rating: 4.5,
                reviewCount: reviews.length,
                releaseDate: enhancedGame.createdAt || new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                fileSize: '1.5 GB',
                languages: ['English'],
                features: ['Single-player', 'Controller support']
            };

            setGame(enhancedGame);

            // Check if in wishlist
            setInWishlist(apiClient.isInWishlist(gameId!));

            // Check if owned
            if (isAuthenticated) {
                try {
                    const myGames = await apiClient.getMyLibrary();
                    const isOwned = myGames.games.some(g => {
                        // Check direct ID match
                        if (g.id === gameId) return true;
                        // Check if it's a Tebex game and title matches
                        if (enhancedGame.isTebexProduct) {
                            return g.title.toLowerCase() === enhancedGame.title.toLowerCase();
                        }
                        return false;
                    });
                    setOwned(isOwned);
                } catch (error) {
                    console.error('Failed to check ownership:', error);
                }
            }

            // Load reviews
            const reviewsData = await apiClient.getGameReviews(gameId!);
            setReviews(reviewsData.reviews);

            // Track game view if coming from a post
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('from_post');
            if (postId) {
                await apiClient.trackGameClick(gameId!, postId);
            }

        } catch (error) {
            console.error('Failed to load game details:', error);
            setGame(null);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = async () => {
        if (game?.isTebexProduct) {
            try {
                await apiClient.checkoutTebexGame(game.id);
            } catch (error) {
                console.error('Failed to checkout:', error);
                if (game.externalLink) {
                    window.open(game.externalLink, '_blank');
                }
            }
        } else if (game?.externalLink) {
            window.open(game.externalLink, '_blank');
        }
    };

    const handleAddToWishlist = async () => {
        if (!isAuthenticated) {
            apiClient.login();
            return;
        }
        try {
            if (gameId) {
                if (inWishlist) {
                    await apiClient.removeFromWishlist(gameId);
                    setInWishlist(false);
                } else {
                    await apiClient.addToWishlist(gameId);
                    setInWishlist(true);
                }
            }
        } catch (error) {
            console.error('Failed to update wishlist:', error);
        }
    };

    const formatPrice = (price: number, currency?: string) => {
        const curr = currency || 'USD';
        const currencySymbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr + ' ';
        return `${currencySymbol}${price.toFixed(2)}`;
    };

    if (loading) {
        return (
            <StoreLayout isAuthenticated={isAuthenticated}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading game details...</p>
                    </div>
                </div>
            </StoreLayout>
        );
    }

    if (!game) {
        return (
            <StoreLayout isAuthenticated={isAuthenticated}>
                <div className="container mx-auto px-4 py-8">
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-lg text-muted-foreground mb-4">Game not found</p>
                            <Button onClick={() => navigate('/')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Store
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout isAuthenticated={isAuthenticated}>
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/')}
                        className="gap-1 px-2"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Store
                    </Button>
                    <span>/</span>
                    <span>{game.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Game Header */}
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
                            <div className="flex items-center gap-4 text-muted-foreground">
                                {developer ? (
                                    <a
                                        href={`/@${developer.username}`}
                                        className="flex items-center gap-1 hover:text-primary transition-colors"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.location.href = `/@${developer.username}`;
                                        }}
                                    >
                                        <User className="h-4 w-4" />
                                        @{developer.username}
                                    </a>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        {game.publisher}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(game.releaseDate).toLocaleDateString()}
                                </span>
                                {playerCount > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {playerCount} players
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Media Gallery */}
                        <div className="space-y-4">
                            {/* Main Display */}
                            <div className="aspect-video rounded-lg overflow-hidden bg-background relative">
                                <img
                                    src={game.screenshots[selectedImage]}
                                    alt={`Screenshot ${selectedImage + 1}`}
                                    className="absolute inset-0 w-full h-full object-contain"
                                />
                            </div>

                            {/* Thumbnails */}
                            <div className="grid grid-cols-4 gap-2">
                                {game.screenshots?.map((screenshot: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-video rounded overflow-hidden bg-background relative ${
                                            selectedImage === index ? 'ring-2 ring-primary' : ''
                                        }`}
                                    >
                                        <img
                                            src={screenshot}
                                            alt={`Screenshot ${index + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover hover:opacity-80 transition-opacity"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tebex Disclaimer */}
                        {game.isTebexProduct && (
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader
                                    className="cursor-pointer select-none"
                                    onClick={() => setShowDisclaimer(!showDisclaimer)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-5 w-5 text-primary" />
                                            <h3 className="text-lg font-semibold">How to activate your game</h3>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${showDisclaimer ? 'rotate-180' : ''}`} />
                                    </div>
                                </CardHeader>
                                {showDisclaimer && (
                                    <CardContent>
                                        <ol className="list-decimal list-inside space-y-2 text-sm">
                                            <li>After purchase, you'll receive a VAPR.CLUB key by email</li>
                                            <li>Go to <strong>My Library</strong> in the VAPR menu</li>
                                            <li>Click <strong>Redeem Key</strong> button</li>
                                            <li>Enter your key in the format: <code className="bg-muted px-1 py-0.5 rounded">XXXX-XXXX-XXXX-XXXX</code></li>
                                            <li>Your game will be added to your library instantly!</li>
                                        </ol>
                                        <p className="mt-4 text-sm text-muted-foreground">
                                            <Info className="inline h-4 w-4 mr-1" />
                                            Check your email inbox (including spam folder) for your activation key
                                        </p>
                                    </CardContent>
                                )}
                            </Card>
                        )}

                        {/* Tabs */}
                        <Tabs defaultValue="about">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="about">About</TabsTrigger>
                                <TabsTrigger value="requirements">System Requirements</TabsTrigger>
                                <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="about" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>About This Game</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Use HtmlParser for game description */}
                                        <HtmlParser html={game.description} />

                                        {game.changelog && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Latest Updates</h4>
                                                <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/20 p-4 rounded">
                                                    {game.changelog}
                                                </div>
                                            </div>
                                        )}

                                        {game.features && game.features.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Features</h4>
                                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                                    {game.features.map((feature: string, index: number) => (
                                                        <li key={index}>{feature}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {game.tags?.map((tag: string) => (
                                                <Badge key={tag} variant="secondary">{tag}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="requirements" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Minimum Requirements</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                                                {game.systemRequirements?.minimum}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Recommended Requirements</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                                                {game.systemRequirements?.recommended}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">User Reviews</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {reviews.length} reviews • {game.rating}/5 average rating
                                        </p>
                                    </div>
                                    {isAuthenticated && owned && (
                                        <Button>Write a Review</Button>
                                    )}
                                </div>

                                {reviews.length === 0 ? (
                                    <Card>
                                        <CardContent className="text-center py-8">
                                            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    reviews.map((review) => (
                                        <Card key={review.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-4">
                                                    <img
                                                        src={review.avatar ? `https://cdn.discordapp.com/avatars/${review.userId}/${review.avatar}.png` : '/default-avatar.png'}
                                                        alt={review.username}
                                                        className="h-10 w-10 rounded-full"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold">{review.username}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`h-4 w-4 ${
                                                                                    i < review.rating
                                                                                        ? 'fill-yellow-500 text-yellow-500'
                                                                                        : 'text-muted-foreground'
                                                                                }`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(review.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-muted-foreground mb-2">{review.content}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="aspect-[3/4] relative bg-background rounded-lg overflow-hidden mb-4">
                                    <img
                                        src={game.coverImage || '/default-game-cover.png'}
                                        alt={game.title}
                                        className="absolute inset-0 w-full h-full object-contain"
                                    />
                                </div>

                                {/* Price Display */}
                                <div className="mb-4">
                                    {game.onSale && game.originalPrice ? (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-primary">
                                                {formatPrice(game.price, game.currency)}
                                            </span>
                                            <span className="text-xl text-muted-foreground line-through">
                                                {formatPrice(game.originalPrice, game.currency)}
                                            </span>
                                            {game.discount && (
                                                <Badge variant="destructive">-{game.discount}%</Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-bold">
                                            {formatPrice(game.price, game.currency)}
                                        </div>
                                    )}
                                </div>

                                {owned ? (
                                    <div className="space-y-2">
                                        <Button className="w-full" size="lg" disabled>
                                            <Download className="h-4 w-4 mr-2" />
                                            You Own This Game
                                        </Button>
                                        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/library'}>
                                            View in Library
                                        </Button>
                                        {game.isTebexProduct && (
                                            <Button
                                                variant="secondary"
                                                className="w-full"
                                                onClick={handleBuyNow}
                                            >
                                                <Gift className="h-4 w-4 mr-2" />
                                                Purchase as Gift
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Button className="w-full" size="lg" onClick={handleBuyNow}>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Buy Now
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full"
                                            onClick={handleAddToWishlist}
                                        >
                                            <Heart className={`h-4 w-4 mr-2 ${inWishlist ? 'fill-current' : ''}`} />
                                            {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Game Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Developer</span>
                                    {developer ? (
                                        <a
                                            href={`/@${developer.username}`}
                                            className="hover:text-primary transition-colors"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.location.href = `/@${developer.username}`;
                                            }}
                                        >
                                            @{developer.username}
                                        </a>
                                    ) : (
                                        <span>{game.publisher}</span>
                                    )}
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Release Date</span>
                                    <span>{new Date(game.releaseDate).toLocaleDateString()}</span>
                                </div>
                                {game.currentVersion && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Version</span>
                                        <span className="flex items-center gap-1">
                                            {game.currentVersion}
                                        </span>
                                    </div>
                                )}
                                {playerCount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Players</span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {playerCount}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Size</span>
                                    <span className="flex items-center gap-1">
                                        <HardDrive className="h-3 w-3" />
                                        {game.fileSize}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Platform</span>
                                    <Monitor className="h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>

                        {game.languages && game.languages.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Languages</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {game.languages.map((lang: string) => (
                                            <Badge key={lang} variant="outline">{lang}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {game.externalLink && (
                            <Card>
                                <CardContent className="pt-6">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => window.open(game.externalLink, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Visit Official Website
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </StoreLayout>
    );
}