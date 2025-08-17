// dashboards/store/src/pages/StorePage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreLayout from "@/components/StoreLayout";
import GameCard from "@/components/GameCard";
import HtmlParser from "@/components/HtmlParser";
import { Gamepad2, ExternalLink } from "lucide-react";
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
    isEarlyAccess?: boolean;
}

interface StorePageProps {
    isAuthenticated?: boolean | null;
}

export default function StorePage({ isAuthenticated }: StorePageProps) {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEarlyAccess, setShowEarlyAccess] = useState<boolean | null>(null);

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

    // Filter games based on early access status
    const filteredGames = games.filter(game => {
        if (showEarlyAccess === null) return true;
        return game.isEarlyAccess === showEarlyAccess;
    });

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
                    {filteredGames.length > 0 && (
                        <Link to={`/game/${filteredGames[0].id}`}>
                            <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all mb-8">
                                <div className="grid md:grid-cols-2 gap-0">
                                    <div className="aspect-video md:aspect-auto md:h-full relative bg-background">
                                        <img
                                            src={filteredGames[0].coverImage || '/default-game-cover.png'}
                                            alt={filteredGames[0].title}
                                            className="absolute inset-0 w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-8 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Badge className="w-fit">Featured</Badge>
                                            {filteredGames[0].isEarlyAccess && (
                                                <Badge className="w-fit bg-blue-600 text-white border-blue-600">
                                                    Early Access
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-bold mb-4">{filteredGames[0].title}</h2>
                                        <div className="mb-6 line-clamp-3">
                                            <HtmlParser html={filteredGames[0].description} className="text-muted-foreground" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {filteredGames[0].onSale && filteredGames[0].originalPrice ? (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-primary">
                                                        {formatPrice(filteredGames[0].price, filteredGames[0].currency)}
                                                    </span>
                                                    <span className="text-lg text-muted-foreground line-through">
                                                        {formatPrice(filteredGames[0].originalPrice, filteredGames[0].currency)}
                                                    </span>
                                                    {filteredGames[0].discount && (
                                                        <Badge variant="destructive">-{filteredGames[0].discount}%</Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-2xl font-bold">
                                                    {formatPrice(filteredGames[0].price, filteredGames[0].currency)}
                                                </span>
                                            )}
                                            <Button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleBuyNow(filteredGames[0].id);
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
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold">All Games</h2>
                            <span className="text-muted-foreground">({filteredGames.length})</span>
                        </div>

                        {/* Filter buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showEarlyAccess === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowEarlyAccess(null)}
                            >
                                All Games
                            </Button>
                            <Button
                                variant={showEarlyAccess === false ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowEarlyAccess(false)}
                            >
                                Released
                            </Button>
                            <Button
                                variant={showEarlyAccess === true ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowEarlyAccess(true)}
                            >
                                Early Access
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredGames.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                onBuyNow={handleBuyNow}
                                onAddToWishlist={handleAddToWishlist}
                                //@ts-ignore
                                isAuthenticated={isAuthenticated}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </StoreLayout>
    );
}