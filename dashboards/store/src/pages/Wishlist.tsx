import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreLayout from "@/components/StoreLayout";
import { Heart, Trash2, ExternalLink } from "lucide-react";
import apiClient from "@/lib/api-client";

export default function Wishlist() {
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            const wishlistData = await apiClient.getWishlistGames();
            setGames(wishlistData.games);
        } catch (error) {
            console.error('Failed to load wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = async (gameId: string) => {
        try {
            await apiClient.checkoutTebexGame(gameId);
        } catch (error) {
            console.error('Failed to start checkout:', error);
        }
    };

    const handleRemoveFromWishlist = async (gameId: string) => {
        await apiClient.removeFromWishlist(gameId);
        setGames(games.filter(game => game.id !== gameId));
    };

    const formatPrice = (price: number, currency?: string) => {
        const curr = currency || 'USD';
        const currencySymbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr + ' ';
        return `${currencySymbol}${price.toFixed(2)}`;
    };

    if (loading) {
        return (
            <StoreLayout isAuthenticated={true}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading wishlist...</p>
                    </div>
                </div>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout isAuthenticated={true}>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

                {games.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground mb-4">Your wishlist is empty</p>
                            <Link to="/">
                                <Button>Browse Games</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <Card key={game.id} className="overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                                <Link to={`/game/${game.id}`}>
                                    <div className="relative bg-background overflow-hidden" style={{ aspectRatio: '3/4' }}>
                                        <img
                                            src={game.coverImage || '/default-game-cover.png'}
                                            alt={game.title}
                                            className="w-full h-full object-contain"
                                        />
                                        {game.onSale && game.discount && (
                                            <Badge className="absolute top-2 right-2" variant="destructive">
                                                -{game.discount}%
                                            </Badge>
                                        )}
                                        {game.isEarlyAccess && (
                                            <Badge className="absolute top-2 left-2 bg-blue-600 text-white border-blue-600">
                                                Early Access
                                            </Badge>
                                        )}
                                    </div>
                                </Link>
                                <CardContent className="p-4">
                                    <Link to={`/game/${game.id}`}>
                                        <h3 className="font-semibold mb-1 line-clamp-1 hover:text-primary transition-colors">
                                            {game.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-muted-foreground mb-2">{game.publisher || 'VAPR Developer'}</p>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {game.tags?.slice(0, 2).map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-lg font-bold">{formatPrice(game.price || 0, game.currency)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleBuyNow(game.id)}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            Buy Now
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRemoveFromWishlist(game.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </StoreLayout>
    );
}