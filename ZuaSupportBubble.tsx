import React, { useState } from 'react';
import { Headset, MessageCircle, Mail, X } from 'lucide-react';

const ZuaSupportBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Remplace par ton vrai numéro et email
  const SUPPORT_WHATSAPP = "243979057287"; // Format international sans '+'
  const SUPPORT_EMAIL = "support@zuabillet.com";

  const handleWhatsApp = () => {
    const msg = "Bonjour Support Zua, j'ai besoin d'aide sur la plateforme.";
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Aide Zua Billet`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 print:hidden">
      
      {/* Menu Expansion */}
      {isOpen && (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300 w-64 mb-2">
          <h4 className="text-white font-bold text-sm mb-3 uppercase tracking-widest flex items-center gap-2">
            <Headset className="w-4 h-4 text-yellow-400" /> Centre d'Aide
          </h4>
          <div className="space-y-2">
            <button 
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-500/20 hover:bg-green-500/40 text-green-300 transition-colors border border-green-500/30 group"
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">WhatsApp Direct</span>
            </button>
            <button 
              onClick={handleEmail}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 transition-colors border border-blue-500/30 group"
            >
              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">Envoyer un Email</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(106,13,173,0.6)] transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse-slow'}`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Headset className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Status Dot */}
      {!isOpen && (
        <span className="absolute top-0 right-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-slate-900"></span>
        </span>
      )}
    </div>
  );
};

export default ZuaSupportBubble;