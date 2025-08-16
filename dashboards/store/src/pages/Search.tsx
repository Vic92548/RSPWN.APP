import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreLayout from "@/components/StoreLayout";
import { ShoppingCart, Heart, Search as SearchIcon } from "lucide-react";
import apiClient from "@/lib/api-client";

interface SearchProps {
    isAuthenticated?: boolean | null;
}

export default function Search({ isAuthenticated }: SearchProps) {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            searchGames();
        }
    }, [query]);

    const searchGames = async () => {
        try {
            setLoading(true);
            const searchResults = await apiClient.searchGames(query);
            setGames(searchResults.games);
        } catch (error) {
            console.error('Failed to search games:', error);
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

    const handleAddToWishlist = async (gameId: string) => {
        if (!isAuthenticated) {
            apiClient.login();
            return;
        }
        try {
            await apiClient.addToWishlist(gameId);
        } catch (error) {
            console.error('Failed to add to wishlist:', error);
        }
    };

    const formatPrice = (price?: number, currency?: string) => {
        const curr = currency || 'USD';
        const currencySymbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr + ' ';
        return `${currencySymbol}${price?.toFixed(2) || '0.00'}`;
    };

    if (loading) {
        return (
            <StoreLayout isAuthenticated={isAuthenticated}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Searching...</p>
                    </div>
                </div>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout isAuthenticated={isAuthenticated}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Search Results</h1>
                    <p className="text-muted-foreground">
                        {games.length} result{games.length !== 1 ? 's' : ''} for "{query}"
                    </p>
                </div>

                {games.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground mb-2">
                                No games found matching your search.
                            </p>
                            <p className="text-sm text-muted-foreground mb-6">
                                Try searching with different keywords.
                            </p>
                            <Link to="/">
                                <Button>Browse All Games</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <Card key={game.id} className="overflow-hidden hover:ring-2 hover:ring-primary transition-all h-full flex flex-col">
                                <Link to={`/game/${game.id}`} className="flex-1 flex flex-col">
                                    <div className="aspect-[3/4] relative">
                                        <img
                                            src={game.coverImage || '/default-game-cover.png'}
                                            alt={game.title}
                                            className="object-cover w-full h-full"
                                        />
                                        {game.onSale && game.discount && (
                                            <Badge className="absolute top-2 right-2" variant="destructive">
                                                -{game.discount}%
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-semibold mb-1 line-clamp-1">{game.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{game.publisher || 'VAPR Developer'}</p>
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                                            {game.description}
                                        </p>
                                        {game.tags && game.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {game.tags.slice(0, 2).map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {game.tags.length > 2 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{game.tags.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-auto">
                                            {game.onSale && game.originalPrice ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        {formatPrice(game.originalPrice, game.currency)}
                                                    </span>
                                                    <span className="text-lg font-bold text-primary">
                                                        {formatPrice(game.price, game.currency)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-lg font-bold">
                                                    {formatPrice(game.price, game.currency)}
                                                </span>
                                            )}
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleBuyNow(game.id);
                                                    }}
                                                    title="Buy Now"
                                                >
                                                    <ShoppingCart className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddToWishlist(game.id);
                                                    }}
                                                    title="Add to wishlist"
                                                >
                                                    <Heart className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </StoreLayout>
    );
}