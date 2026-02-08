import React from 'react';
import Button from './Button';
import { Sparkles, ChevronRight } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative pt-24 pb-32 lg:pt-40 lg:pb-40 text-center overflow-visible">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        
        {/* Luxury Badge */}
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/40 border border-white/80 shadow-sm mb-10 backdrop-blur-md animate-float">
          <Sparkles className="w-4 h-4 text-royal-light" />
          <span className="text-xs font-bold text-royal-dark tracking-widest uppercase">Édition Diamant V27</span>
        </div>
        
        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-800 tracking-tight mb-8 leading-[1.1] drop-shadow-sm">
          L'EXPÉRIENCE <span className="text-transparent bg-clip-text bg-gradient-royal">ROYALE</span><br/>
          COMMENCE ICI.
        </h1>
        
        <p className="max-w-2xl mx-auto text-xl md:text-2xl font-medium text-slate-600 mb-12 leading-relaxed">
          Luxe, Sécurité et Glamour pour vos événements. La billetterie nouvelle génération.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <Button variant="primary" className="w-full sm:w-auto min-w-[220px] text-base">
            Découvrir l'Aréna
          </Button>
          <Button variant="glass" className="w-full sm:w-auto min-w-[220px] text-base flex items-center justify-center gap-2">
            Voir la Démo
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;