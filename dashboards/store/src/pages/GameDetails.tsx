import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StoreLayout from "@/components/StoreLayout";
import { ShoppingCart, Heart, Download, Star, Calendar, User, Monitor, HardDrive, ArrowLeft, ExternalLink } from "lucide-react";
import apiClient from "@/lib/api-client";

interface GameDetailsProps {
    isAuthenticated?: boolean | null;
}

export default function GameDetails({ isAuthenticated }: GameDetailsProps) {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const [game, setGame] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inCart, setInCart] = useState(false);
    const [owned, setOwned] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState(0);

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

            // Enhance game with mock data for store display
            const enhancedGame = {
                ...gameData.game,
                price: gameData.game.price || 0,
                tags: gameData.game.tags || ['indie', 'action'],
                publisher: gameData.game.publisher || 'VAPR Developer',
                screenshots: [
                    gameData.game.coverImage,
                    gameData.game.coverImage,
                    gameData.game.coverImage,
                    gameData.game.coverImage
                ],
                systemRequirements: {
                    minimum: 'OS: Windows 10 64-bit\nProcessor: Intel Core i3-2100\nMemory: 4 GB RAM\nGraphics: NVIDIA GeForce GTX 660\nDirectX: Version 11\nStorage: 2 GB available space',
                    recommended: 'OS: Windows 11 64-bit\nProcessor: Intel Core i7-4770\nMemory: 8 GB RAM\nGraphics: NVIDIA GeForce RTX 3060\nDirectX: Version 12\nStorage: 2 GB available space'
                },
                rating: 4.5,
                reviewCount: 3,
                releaseDate: gameData.game.createdAt || new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                fileSize: '1.5 GB',
                languages: ['English'],
                features: ['Single-player', 'Controller support']
            };

            setGame(enhancedGame);

            // Check if in cart
            const cart = apiClient.getCart();
            setInCart(cart.includes(gameId!));

            // Check if in wishlist
            setInWishlist(apiClient.isInWishlist(gameId!));

            // Check if owned
            if (isAuthenticated) {
                try {
                    const myGames = await apiClient.getMyLibrary();
                    setOwned(myGames.games.some(g => g.id === gameId));
                } catch (error) {
                    console.error('Failed to check ownership:', error);
                }
            }

            // Load reviews from local storage
            const reviewsData = await apiClient.getGameReviews(gameId!);
            setReviews(reviewsData.reviews);

        } catch (error) {
            console.error('Failed to load game details:', error);
            setGame(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (game?.externalLink) {
            window.open(game.externalLink, '_blank');
        } else if (gameId) {
            apiClient.addToCart(gameId);
            setInCart(true);
        }
    };

    const handleRemoveFromCart = () => {
        if (gameId) {
            apiClient.removeFromCart(gameId);
            setInCart(false);
        }
    };

    const handleBuyNow = () => {
        if (game?.externalLink) {
            window.open(game.externalLink, '_blank');
        } else {
            if (gameId && !inCart) {
                apiClient.addToCart(gameId);
            }
            navigate('/cart');
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

    const formatPrice = (price: number) => {
        return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
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
                                <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {game.publisher}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(game.releaseDate).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                    <span>{game.rating}/5 ({game.reviewCount} reviews)</span>
                                </div>
                            </div>
                        </div>

                        {/* Media Gallery */}
                        <div className="space-y-4">
                            {/* Main Display */}
                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                <img
                                    src={game.screenshots[selectedImage]}
                                    alt={`Screenshot ${selectedImage + 1}`}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Thumbnails */}
                            <div className="grid grid-cols-4 gap-2">
                                {game.screenshots?.map((screenshot: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`aspect-video rounded overflow-hidden ${
                                            selectedImage === index ? 'ring-2 ring-primary' : ''
                                        }`}
                                    >
                                        <img
                                            src={screenshot}
                                            alt={`Screenshot ${index + 1}`}
                                            className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="about">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="about">About</TabsTrigger>
                                <TabsTrigger value="requirements">System Requirements</TabsTrigger>
                                <TabsTrigger value="reviews">Reviews ({game.reviewCount})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="about" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>About This Game</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-muted-foreground">{game.description}</p>

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
                                            {game.reviewCount} reviews • {game.rating}/5 average rating
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
                                <img
                                    src={game.coverImage || '/default-game-cover.png'}
                                    alt={game.title}
                                    className="w-full rounded-lg mb-4"
                                />
                                <div className="text-3xl font-bold mb-4">{formatPrice(game.price)}</div>

                                {owned ? (
                                    <div className="space-y-2">
                                        <Button className="w-full" size="lg" disabled>
                                            <Download className="h-4 w-4 mr-2" />
                                            You Own This Game
                                        </Button>
                                        <Button variant="outline" className="w-full" onClick={() => navigate('/library')}>
                                            View in Library
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {game.externalLink ? (
                                            <Button className="w-full" size="lg" onClick={handleBuyNow}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Get Game
                                            </Button>
                                        ) : (
                                            <>
                                                <Button className="w-full" size="lg" onClick={handleBuyNow}>
                                                    Buy Now
                                                </Button>
                                                {inCart ? (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={handleRemoveFromCart}
                                                    >
                                                        Remove from Cart
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={handleAddToCart}
                                                    >
                                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                                        Add to Cart
                                                    </Button>
                                                )}
                                            </>
                                        )}
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
                                    <span>{game.publisher}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Release Date</span>
                                    <span>{new Date(game.releaseDate).toLocaleDateString()}</span>
                                </div>
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
                    </div>
                </div>
            </div>
        </StoreLayout>
    );
}