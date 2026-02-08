import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-auto border-t border-white/40 bg-white/30 backdrop-blur-xl no-print">
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="inline-block mb-4">
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-royal tracking-tight">
            HASHTAG EVENTS
          </span>
        </div>
        
        <div className="mb-6 flex flex-col items-center gap-4">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
             © 2025 HASHTAG V27 • KINSHASA • TOUS DROITS RÉSERVÉS
           </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;