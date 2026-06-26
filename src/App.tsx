import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import MatchingContainer from './components/matching/MatchingContainer';
import ProfilePage from './pages/ProfilePage';
import VerificationPage from './pages/VerificationPage';

import { LanguageProvider } from './contexts/LanguageContext';

function AppContent() {
  const [entranceComplete, setEntranceComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setEntranceComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleViewChange = (view: 'landing' | 'matching') => {
    if (view === 'matching') {
      navigate('/matching');
    } else {
      navigate('/');
    }
  };

  const currentView = location.pathname.startsWith('/matching') ? 'matching' : 'landing';

  return (
    <div style={{ fontFamily: '"Space Mono", monospace' }}>
      <Navbar 
        entranceComplete={entranceComplete} 
        currentView={currentView}
        setCurrentView={handleViewChange}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/matching" element={<div className="pt-20"><MatchingContainer user={user} /></div>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verify" element={<VerificationPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppContent />
      </Router>
    </LanguageProvider>
  );
}

