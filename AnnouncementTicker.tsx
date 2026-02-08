import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Bell, Info, Sparkles, X } from 'lucide-react';

interface Announcement {
  text: string;
  type: 'ALERT' | 'INFO' | 'PROMO';
  active: boolean;
}

const AnnouncementTicker: React.FC = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // MISSION 2 : Récupération en temps réel du document settings/ticker
    try {
      const unsub = onSnapshot(doc(db, "settings", "ticker"), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Announcement;
          // Condition : Afficher seulement si actif ET texte non vide
          if (data.active && data.text.trim().length > 0) {
            setAnnouncement(data);
            setVisible(true);
          } else {
            setAnnouncement(null);
          }
        } else {
          setAnnouncement(null);
        }
      });

      return () => unsub();
    } catch (e) {
      console.warn("Ticker fetch error:", e);
    }
  }, []);

  if (!announcement || !visible) return null;

  const styles = {
    ALERT: "bg-red-600 text-white animate-pulse",
    INFO: "bg-blue-600 text-white",
    PROMO: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]"
  };

  const icons = {
    ALERT: <Bell className="w-4 h-4 animate-swing" />,
    INFO: <Info className="w-4 h-4" />,
    PROMO: <Sparkles className="w-4 h-4 animate-pulse" />
  };

  return (
    <div className={`relative w-full overflow-hidden z-[100] shadow-xl border-b border-white/10 ${styles[announcement.type]}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
           <span className="shrink-0 p-1 bg-white/20 rounded-full flex items-center justify-center">
             {icons[announcement.type]}
           </span>
           <div className="flex-1 overflow-hidden relative h-6 flex items-center">
             <p className="absolute whitespace-nowrap font-black text-[11px] uppercase tracking-widest animate-marquee">
               {announcement.text}
             </p>
           </div>
        </div>
        <button 
          onClick={() => setVisible(false)} 
          className="ml-4 p-1.5 hover:bg-black/10 rounded-full transition-colors group"
        >
          <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
        </button>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        @keyframes swing {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(15deg); }
          75% { transform: rotate(-15deg); }
        }
        .animate-swing {
          animation: swing 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementTicker;