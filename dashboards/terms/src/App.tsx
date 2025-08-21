import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import RSPWNTermsPage from "@/pages/legal/TermsPage.tsx";
import RSPWNPrivacyPage from "@/pages/legal/PrivacyPolicyPage.tsx";

function App() {
    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    }, []);

    return (
        <Router basename="/terms">
            <Routes>
                <Route path="/" element={<RSPWNTermsPage />} />
                <Route path="/terms" element={<RSPWNTermsPage />} />
                <Route path="/privacy" element={<RSPWNPrivacyPage />} />
                <Route path="*" element={<RSPWNTermsPage />} />
            </Routes>
        </Router>
    )
}

export default App