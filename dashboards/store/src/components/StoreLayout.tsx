import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Gamepad2,
    Search,
    Heart,
    User,
    LogOut,
    Menu,
    X
} from "lucide-react";
import apiClient from "@/lib/api-client";

interface StoreLayoutProps {
    children: ReactNode;
    isAuthenticated?: boolean | null;
}

export default function StoreLayout({ children, isAuthenticated }: StoreLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (isAuthenticated) {
            loadUser();
        }
    }, [isAuthenticated]);

    const loadUser = async () => {
        try {
            const userData = await apiClient.getMe();
            setUser(userData);
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const handleLogin = () => {
        apiClient.login();
    };

    const handleLogout = () => {
        apiClient.logout();
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                                <Gamepad2 className="h-8 w-8 text-primary" />
                                <span className="text-xl font-bold">VAPR Store</span>
                            </Link>

                            <nav className="hidden md:flex items-center space-x-6">
                                <Link
                                    to="/"
                                    className={`text-sm font-medium transition-colors hover:text-primary ${
                                        isActive('/') ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    Store
                                </Link>
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
                            <form onSubmit={handleSearch} className="hidden md:block">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search games..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 w-64"
                                    />
                                </div>
                            </form>

                            {isAuthenticated ? (
                                <>
                                    <Link to="/wishlist">
                                        <Button variant="ghost" size="icon">
                                            <Heart className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                    <div className="flex items-center space-x-2">
                                        {user && (
                                            <Link to="/profile" className="flex items-center space-x-2 hover:opacity-80">
                                                <img
                                                    src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/default-avatar.png'}
                                                    alt={user.username}
                                                    className="h-8 w-8 rounded-full"
                                                />
                                                <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                                            </Link>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                                            <LogOut className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <Button onClick={handleLogin} className="gap-2">
                                    <User className="h-4 w-4" />
                                    Sign In
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t">
                        <div className="container mx-auto px-4 py-4 space-y-4">
                            <form onSubmit={handleSearch}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search games..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 w-full"
                                    />
                                </div>
                            </form>
                            <nav className="flex flex-col space-y-2">
                                <Link
                                    to="/"
                                    className={`text-sm font-medium transition-colors hover:text-primary ${
                                        isActive('/') ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Store
                                </Link>
                                {isAuthenticated && (
                                    <Link
                                        to="/wishlist"
                                        className={`text-sm font-medium transition-colors hover:text-primary ${
                                            isActive('/wishlist') ? 'text-primary' : 'text-muted-foreground'
                                        }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Wishlist
                                    </Link>
                                )}
                            </nav>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t bg-background/50 mt-16">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="font-semibold mb-4">VAPR Store</h3>
                            <p className="text-sm text-muted-foreground">
                                Discover amazing indie games and support independent developers.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/" className="text-muted-foreground hover:text-foreground">Store</Link></li>
                                <li><Link to="/wishlist" className="text-muted-foreground hover:text-foreground">Wishlist</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Community</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/" className="text-muted-foreground hover:text-foreground">Main Site</a></li>
                                <li><a href="https://discord.gg/vapr" className="text-muted-foreground hover:text-foreground">Discord</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/support" className="text-muted-foreground hover:text-foreground">Help Center</a></li>
                                <li><a href="/terms" className="text-muted-foreground hover:text-foreground">Terms</a></li>
                                <li><a href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                        © 2025 VAPR. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}