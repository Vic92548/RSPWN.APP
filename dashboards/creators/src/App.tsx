import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import GameKeys from './pages/GameKeys'
import GameStats from './pages/GameStats'
import GameUpdates from './pages/GameUpdates'
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
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <Router basename="/partners">
            <Routes>
                <Route
                    path="/"
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />}
                />
                <Route
                    path="/dashboard"
                    element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
                />
                <Route
                    path="/games/:gameId/keys"
                    element={isAuthenticated ? <GameKeys /> : <Navigate to="/" />}
                />
                <Route
                    path="/games/:gameId/stats"
                    element={isAuthenticated ? <GameStats /> : <Navigate to="/" />}
                />
                <Route
                    path="/games/:gameId/updates"
                    element={isAuthenticated ? <GameUpdates /> : <Navigate to="/" />}
                />
                <Route
                    path="*"
                    element={<Navigate to="/" />}
                />
            </Routes>
        </Router>
    )
}

export default App