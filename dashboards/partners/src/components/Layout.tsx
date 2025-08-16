import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Gamepad2,
    LayoutDashboard,
    LogOut,
    ExternalLink,
    Home,
    AlertTriangle
} from "lucide-react";
import apiClient from "@/lib/api-client";

interface LayoutProps {
    children: ReactNode;
    user?: {
        id: string;
        username: string;
        avatar: string;
        level: number;
    } | null;
}

export default function Layout({ children, user }: LayoutProps) {
    const location = useLocation();
    const [compliance, setCompliance] = useState<any>(null);
    const [loadingCompliance, setLoadingCompliance] = useState(true);

    useEffect(() => {
        if (user) {
            checkCompliance();
        }
    }, [user]);

    const checkCompliance = async () => {
        try {
            setLoadingCompliance(true);
            const complianceData = await apiClient.checkPartnerCompliance();
            setCompliance(complianceData);
        } catch (error) {
            console.error('Failed to check compliance:', error);
        } finally {
            setLoadingCompliance(false);
        }
    };

    const handleLogout = () => {
        apiClient.logout();
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleBackToVapr = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                                <Gamepad2 className="h-8 w-8 text-primary" />
                                <span className="text-xl font-bold">VAPR Partners</span>
                            </Link>

                            <nav className="hidden md:flex items-center space-x-6">
                                <Link
                                    to="/dashboard"
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                                        isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                                    }`}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>

                                <button
                                    onClick={handleBackToVapr}
                                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                                >
                                    <Home className="h-4 w-4" />
                                    Back to VAPR
                                    <ExternalLink className="h-3 w-3" />
                                </button>
                            </nav>
                        </div>

                        {user && (
                            <div className="flex items-center space-x-4">
                                <div className="text-right hidden sm:block">
                                    <p className="font-semibold text-sm">{user.username}</p>
                                    <p className="text-xs text-muted-foreground">Level {user.level}</p>
                                </div>
                                <img
                                    src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '/default-avatar.png'}
                                    alt={user.username}
                                    className="h-9 w-9 rounded-full"
                                />
                                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="md:hidden border-b">
                <div className="container mx-auto px-4 py-2">
                    <nav className="flex items-center space-x-4">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                                isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>

                        <button
                            onClick={handleBackToVapr}
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            <Home className="h-4 w-4" />
                            VAPR
                            <ExternalLink className="h-3 w-3" />
                        </button>
                    </nav>
                </div>
            </div>

            {!loadingCompliance && compliance && !compliance.isCompliant && (
                <div className="bg-destructive/10 border-b border-destructive/20">
                    <div className="container mx-auto px-4 py-3">
                        <Alert className="border-0 bg-transparent p-0">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <AlertDescription className="text-sm">
                                <strong>Action Required:</strong> You need to add {compliance.missingCreators} creator{compliance.missingCreators !== 1 ? 's' : ''} to your Tebex store before your games can be public.
                                All partners must add all approved creators to their Tebex creator codes system.
                                <Link to="/creator-codes" className="ml-2 underline font-medium">
                                    Manage Creator Codes
                                </Link>
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            )}

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}