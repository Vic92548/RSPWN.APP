import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import PostAnalytics from './pages/PostAnalytics'
import ContentCalendar from './pages/ContentCalendar'
import Audience from './pages/Audience'
import CreatorProgram from './pages/CreatorProgram'
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
        <Router basename="/creators">
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
                    path="/analytics/:postId"
                    element={isAuthenticated ? <PostAnalytics /> : <Navigate to="/" />}
                />
                <Route
                    path="/content"
                    element={isAuthenticated ? <ContentCalendar /> : <Navigate to="/" />}
                />
                <Route
                    path="/audience"
                    element={isAuthenticated ? <Audience /> : <Navigate to="/" />}
                />
                {/* Creator Program is accessible to everyone */}
                <Route
                    path="/creator-program"
                    element={<CreatorProgram isAuthenticated={isAuthenticated} />}
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