import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import './App.css'

function App() {

    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    }, []);

    return (
        <Router basename="/privacy">
            <Routes>
                <Route
                    path="/"
                    element={<LandingPage />}
                />
            </Routes>
        </Router>
    )
}

export default App