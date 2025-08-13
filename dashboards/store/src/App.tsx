import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StorePage from './pages/StorePage'
import GameDetails from './pages/GameDetails'
import Wishlist from './pages/Wishlist'
import Search from './pages/Search'
import apiClient from './lib/api-client'
import './App.css'

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Force dark mode on the document
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            await apiClient.getMe();
            setIsAuthenticated(true);
        } catch (error) {
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading VAPR Store...</p>
                </div>
            </div>
        );
    }

    return (
        <Router basename="/store">
            <Routes>
                <Route path="/" element={<StorePage isAuthenticated={isAuthenticated} />} />
                <Route path="/game/:gameId" element={<GameDetails isAuthenticated={isAuthenticated} />} />
                <Route path="/wishlist" element={isAuthenticated ? <Wishlist /> : <Navigate to="/" />} />
                <Route path="/search" element={<Search isAuthenticated={isAuthenticated} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    )
}

export default App