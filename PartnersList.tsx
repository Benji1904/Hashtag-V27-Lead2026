import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Loader2, CheckCircle, Users } from 'lucide-react';

interface Partner {
  id: string;
  brandName: string;
  logo: string;
  banner: string;
  bio: string;
}

interface PartnersListProps {
  onPartnerClick: (id: string) => void;
}

const PartnersList: React.FC<PartnersListProps> = ({ onPartnerClick }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'organizer'),
          where('verificationStatus', '==', 'VERIFIED')
        );
        const snapshot = await getDocs(q);
        setPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner)));
      } catch (err) {
        console.error("Fetch partners error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-royal-main w-10 h-10" /></div>;

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-slate-800 mb-4 uppercase">Nos Partenaires Royaux</h2>
        <div className="w-24 h-1 bg-gradient-royal mx-auto rounded-full"></div>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">Découvrez les organisateurs d'élite qui font vibrer l'Aréna Zua Billet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {partners.map(partner => (
          <div 
            key={partner.id}
            onClick={() => onPartnerClick(partner.id)}
            className="group cursor-pointer glass-jewel rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-jewel-hover"
          >
            <div className="h-32 bg-slate-200 relative overflow-hidden">
               {partner.banner ? (
                 <img src={partner.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               ) : (
                 <div className="w-full h-full bg-gradient-royal opacity-50"></div>
               )}
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            </div>
            
            <div className="px-6 pb-6 relative">
               <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden -mt-10 mb-3 mx-auto relative z-10">
                 {partner.logo ? (
                   <img src={partner.logo} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400"><Users/></div>
                 )}
               </div>
               
               <div className="text-center">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-1">
                   {partner.brandName}
                   <CheckCircle className="w-4 h-4 text-blue-500" />
                 </h3>
                 <p className="text-xs text-slate-500 mt-2 line-clamp-2 h-8">{partner.bio || "Organisateur certifié."}</p>
                 <button className="mt-4 text-xs font-bold text-royal-main uppercase tracking-widest hover:underline">
                   Voir la Vitrine
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PartnersList;