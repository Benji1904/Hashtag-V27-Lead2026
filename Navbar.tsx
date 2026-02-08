import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Crown, Gem, ShieldCheck, Users, Ticket } from 'lucide-react';
import Button from './Button';

interface NavbarProps {
  onLoginClick: () => void;
  onHomeClick: () => void;
  onTrackClick?: () => void;
  onAdminClick?: () => void;
  onPartnersClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onHomeClick, onTrackClick, onAdminClick, onPartnersClick }) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Utilisation de l'instance 'auth' exportée de firebase.ts
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === 'benjibikamwa@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="sticky top-6 z-50 px-4 sm:px-8 no-print">
      <div className="max-w-7xl mx-auto glass-jewel rounded-2xl px-6 py-4 flex justify-between items-center transition-all hover:bg-white/40">
        {/* Jewel Logo */}
        <div 
          className="flex items-center space-x-3 group cursor-pointer"
          onClick={onHomeClick}
        >
          <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-royal rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-500 border border-white/50">
            <Crown className="w-5 h-5 text-white drop-shadow-md" />
            <div className="absolute inset-0 bg-white/20 rounded-xl rounded-tr-[40%]"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-royal-dark to-royal-light drop-shadow-sm">
              # HASHTAG
            </span>
            <span className="text-[10px] font-bold text-royal-main/60 uppercase tracking-[0.2em]">
              L'Aréna Digitale
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button 
             onClick={onPartnersClick}
             className="hidden lg:flex items-center gap-2 text-slate-500 font-bold hover:text-royal-main transition-colors text-xs uppercase tracking-widest"
          >
             <Users className="w-4 h-4" />
             Nos Partenaires
          </button>

          {/* TRACKING BUTTON (Prominent) */}
          <button 
             onClick={onTrackClick}
             className="flex items-center gap-2 text-royal-main font-bold hover:text-royal-dark transition-colors text-xs uppercase tracking-widest bg-royal-light/10 px-3 py-2 rounded-full border border-royal-main/20"
          >
             <Ticket className="w-4 h-4" />
             <span className="hidden sm:inline">Suivre ma Commande</span>
          </button>
          
          <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>

          {/* ADMIN SUPREME BUTTON */}
          {isAdmin && (
             <button 
               onClick={onAdminClick}
               className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-yellow-300 shadow-lg shadow-yellow-500/50 transition-all animate-pulse border-2 border-yellow-200 transform hover:scale-105"
             >
               <ShieldCheck className="w-4 h-4" />
               ESPACE SUPRÊME
             </button>
          )}

          {!user ? (
            <button 
              onClick={onLoginClick}
              className="hidden sm:flex items-center gap-2 text-slate-500 font-bold hover:text-royal-light transition-colors text-xs uppercase tracking-widest"
            >
              <Gem className="w-4 h-4" />
              Connexion
            </button>
          ) : (
            <span className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase">
              {user.email?.split('@')[0]}
            </span>
          )}

           <Button 
             variant="primary" 
             className="!py-3 !px-6 !text-xs !shadow-lg"
             onClick={onLoginClick} 
           >
             {user ? "Mon Espace" : "Espace Organisateur"}
           </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;