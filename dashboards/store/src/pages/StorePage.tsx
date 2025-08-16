import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreLayout from "@/components/StoreLayout";
import { ShoppingCart, Heart, Gamepad2, ExternalLink } from "lucide-react";
import apiClient from "@/lib/api-client";

interface Game {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    price?: number;
    currency?: string;
    tags?: string[];
    releaseDate?: string;
    publisher?: string;
    externalLink?: string | null;
    onSale?: boolean;
    originalPrice?: number;
    discount?: number;
    isTebexProduct?: boolean;
}

interface StorePageProps {
    isAuthenticated?: boolean | null;
}

export default function StorePage({ isAuthenticated }: StorePageProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoreData();
    }, []);

    const loadStoreData = async () => {
        try {
            setLoading(true);
            const gamesData = await apiClient.getAllGames();
            setGames(gamesData.games);
        } catch (error) {
            console.error('Failed to load store data:', error);
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
                        <p className="text-muted-foreground">Loading store...</p>
                    </div>
                </div>
            </StoreLayout>
        );
    }

    if (games.length === 0) {
        return (
            <StoreLayout isAuthenticated={isAuthenticated}>
                <div className="container mx-auto px-4 py-8">
                    <Card>
                        <CardContent className="text-center py-12">
                            <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">No games available at the moment</p>
                        </CardContent>
                    </Card>
                </div>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout isAuthenticated={isAuthenticated}>
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <section className="mb-12">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-4">Welcome to VAPR Store</h1>
                        <p className="text-xl text-muted-foreground">Discover amazing games from independent developers</p>
                    </div>

                    {/* Featured Game - First game as hero */}
                    {games.length > 0 && (
                        <Link to={`/game/${games[0].id}`}>
                            <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all mb-8">
                                <div className="grid md:grid-cols-2 gap-0">
                                    <div className="aspect-video md:aspect-auto">
                                        <img
                                            src={games[0].coverImage || '/default-game-cover.png'}
                                            alt={games[0].title}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div className="p-8 flex flex-col justify-center">
                                        <Badge className="mb-4 w-fit">Featured</Badge>
                                        <h2 className="text-3xl font-bold mb-4">{games[0].title}</h2>
                                        <p className="text-muted-foreground mb-6 line-clamp-3">{games[0].description}</p>
                                        <div className="flex items-center gap-4">
                                            {games[0].onSale && games[0].originalPrice ? (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-primary">
                                                        {formatPrice(games[0].price, games[0].currency)}
                                                    </span>
                                                    <span className="text-lg text-muted-foreground line-through">
                                                        {formatPrice(games[0].originalPrice, games[0].currency)}
                                                    </span>
                                                    {games[0].discount && (
                                                        <Badge variant="destructive">-{games[0].discount}%</Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-2xl font-bold">
                                                    {formatPrice(games[0].price, games[0].currency)}
                                                </span>
                                            )}
                                            <Button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleBuyNow(games[0].id);
                                                }}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Buy Now
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    )}
                </section>

                {/* All Games Grid */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Gamepad2 className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">All Games</h2>
                        <span className="text-muted-foreground">({games.length})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <Link key={game.id} to={`/game/${game.id}`}>
                                <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all h-full">
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
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold mb-1 line-clamp-1">{game.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{game.publisher || 'VAPR Developer'}</p>
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                            {game.description}
                                        </p>
                                        <div className="flex items-center justify-between">
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
                                                {isAuthenticated && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            apiClient.addToWishlist(game.id);
                                                        }}
                                                        title="Add to Wishlist"
                                                    >
                                                        <Heart className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </StoreLayout>
    );
}