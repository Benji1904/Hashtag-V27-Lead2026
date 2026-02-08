import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './services/firebase';
import Navbar from './components/Navbar';
import PublicHome from './components/PublicHome';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PublicShowcase from './components/PublicShowcase';
import TrackingView from './components/TrackingView';
import AdminDashboard from './components/AdminDashboard';
import AnnouncementTicker from './components/AnnouncementTicker';
import PartnersList from './components/PartnersList';
import AgentScanner from './components/dashboard/AgentScanner';

// Pure State Navigation Types
type ViewState = 'HOME' | 'LOGIN' | 'DASHBOARD' | 'PUBLIC_VITRINE' | 'TRACKING' | 'ADMIN_DASHBOARD' | 'PARTNERS' | 'GATE' | 'SCAN_ACCESS';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [showcaseId, setShowcaseId] = useState<string | null>(null);

  // MISSION 2 : Mouchard de Trafic
  useEffect(() => {
    const logVisit = async () => {
      const visitId = localStorage.getItem('visit_id');
      if (!visitId) { // Pour ne pas compter 10 fois la même personne
         try {
           // Appel API simple pour la localisation (gratuite)
           const res = await fetch('https://ipapi.co/json/');
           const data = await res.json();
           
           await addDoc(collection(db, 'traffic_logs'), {
              ip: data.ip || 'Anonyme',
              city: data.city || 'Inconnue',
              country: data.country_name || 'RDC',
              device: navigator.userAgent, // Donne le type de téléphone/PC
              timestamp: serverTimestamp(),
              page: 'Accueil Arena'
           });
           localStorage.setItem('visit_id', 'logged');
         } catch(e) { console.log("Mouchard silencieux"); }
      }
    };
    logVisit();
  }, []);

  useEffect(() => {
    // READ-ONLY: We check URL once on load to handle shared links
    try {
      const params = new URLSearchParams(window.location.search);
      const orgId = params.get('org');
      
      const path = window.location.pathname;
      
      if (path === '/track') {
         setView('TRACKING');
      } else if (path === '/gate') {
         setView('GATE');
      } else if (path === '/scan-access') {
         setView('SCAN_ACCESS');
      } else if (orgId) {
        setShowcaseId(orgId);
        setView('PUBLIC_VITRINE');
      }
    } catch (e) {
      console.error("Navigation Error:", e);
    }
  }, []);

  const handleLoginSuccess = () => {
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setView('HOME');
  };

  const goToHome = () => {
    setView('HOME');
    setShowcaseId(null);
  };

  const handlePartnerClick = (organizerId: string) => {
    setShowcaseId(organizerId);
    setView('PUBLIC_VITRINE');
  };

  return (
    <div 
      className="min-h-screen flex flex-col font-sans w-full max-w-7xl mx-auto px-4" 
      onContextMenu={(e) => e.preventDefault()} 
      style={{ userSelect: 'none' }}
    >
      {/* GLOBAL ANNOUNCEMENT TICKER */}
      <AnnouncementTicker />

      {/* Hide Navbar in Admin Dashboard and Gate to keep specific header */}
      {view !== 'ADMIN_DASHBOARD' && view !== 'GATE' && view !== 'SCAN_ACCESS' && (
        <Navbar 
          onLoginClick={() => setView('LOGIN')} 
          onHomeClick={goToHome}
          onTrackClick={() => setView('TRACKING')}
          onAdminClick={() => setView('ADMIN_DASHBOARD')}
          onPartnersClick={() => setView('PARTNERS')}
        />
      )}
      
      {/* Ambient Lighting / Aura (Disabled in Admin Mode and Gate) */}
      {view !== 'ADMIN_DASHBOARD' && view !== 'GATE' && view !== 'SCAN_ACCESS' && (
        <>
          <div className="fixed top-[10%] left-[20%] w-[600px] h-[600px] bg-royal-light/20 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply"></div>
          <div className="fixed top-[40%] right-[10%] w-[500px] h-[500px] bg-royal-main/10 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-multiply"></div>
        </>
      )}

      <main className="flex-grow z-10 relative">
        {/* REPLACED HERO + EVENTLIST WITH PUBLICHOME */}
        {view === 'HOME' && (
          <PublicHome />
        )}

        {view === 'TRACKING' && (
           <div className="max-w-7xl mx-auto px-4"><TrackingView /></div>
        )}

        {view === 'GATE' && (
          <AgentScanner />
        )}

        {view === 'SCAN_ACCESS' && (
          <AgentScanner />
        )}

        {view === 'PARTNERS' && (
           <div className="max-w-7xl mx-auto px-4"><PartnersList onPartnerClick={handlePartnerClick} /></div>
        )}

        {view === 'PUBLIC_VITRINE' && showcaseId && (
          <PublicShowcase organizerId={showcaseId} />
        )}

        {view === 'LOGIN' && (
          <div className="container mx-auto px-4 pb-20">
             <Login onSuccess={handleLoginSuccess} />
          </div>
        )}

        {view === 'DASHBOARD' && (
          <Dashboard onLogout={handleLogout} />
        )}

        {view === 'ADMIN_DASHBOARD' && (
          <AdminDashboard onLogout={handleLogout} />
        )}
      </main>
      
      {/* Masquage du Footer global sur la HOME (car elle a son propre footer interactif), l'ADMIN et le GATE */}
      {view !== 'ADMIN_DASHBOARD' && view !== 'HOME' && view !== 'GATE' && view !== 'SCAN_ACCESS' && <Footer />}
    </div>
  );
};

export default App;