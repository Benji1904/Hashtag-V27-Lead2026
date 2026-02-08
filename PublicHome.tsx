import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
// Added Share2 and Link icons to imports
import { 
  Calendar, MapPin, Search, CheckCircle, Crown, 
  ChevronRight, ChevronLeft, Ticket, Loader2, Filter, X, Zap, Building2, Globe, ArrowRight, Share2, Link as LinkIcon
} from 'lucide-react';
import Button from './Button';
import PurchaseModal from './PurchaseModal';

// --- TYPES ---
interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  priceStandard: string; 
  currency: string;
  tickets: any[];
  status: string;
  isFeatured?: boolean;
  organizerId: string;
}

interface Organizer {
  id: string;
  brandName: string;
  logo: string;
  verificationStatus: string;
  banner?: string;
  bio?: string;
}

const PublicHome: React.FC = () => {
  // DATA STATES
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [partners, setPartners] = useState<Organizer[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [organizerMap, setOrganizerMap] = useState<Record<string, Organizer>>({});
  
  // UI STATES
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  
  // NEW FILTERS
  const [cityFilter, setCityFilter] = useState('ALL');
  const [showcaseOrg, setShowcaseOrg] = useState<Organizer | null>(null);

  // État pour la modale juridique
  const [legalModal, setLegalModal] = useState<'cgv' | 'privacy' | null>(null);

  // --- 1. INITIAL SETUP & REAL-TIME ---
  useEffect(() => {
    // A. Check for Org Mode (Showcase)
    const params = new URLSearchParams(window.location.search);
    const orgId = params.get('org');
    
    if (orgId) {
      // If ?org=ID exists, we lock the view to this partner
      setSelectedPartnerFilter(orgId);
      getDoc(doc(db, "users", orgId)).then(snap => {
        if (snap.exists()) setShowcaseOrg({ id: snap.id, ...snap.data() } as Organizer);
      });
    }

    // B. Real-time Events Listener (INSTANT UPDATES)
    const qEvents = collection(db, "events");
    
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const allRawEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventData));
      
      // STRICT FILTER: ONLY VALIDATED EVENTS
      const validatedEvents = allRawEvents.filter(e => e.status === 'VALIDATED');
      
      // Sort by Date by default
      validatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAllEvents(validatedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot Error:", error);
      setLoading(false);
    });

    // C. Fetch Partners (For directory)
    const fetchPartners = async () => {
        const qPartners = query(collection(db, "users"), where("verificationStatus", "==", "VERIFIED"));
        const partSnap = await getDocs(qPartners);
        const partnersList = partSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Organizer));
        setPartners(partnersList);
        
        const orgMap: Record<string, Organizer> = {};
        partnersList.forEach(p => orgMap[p.id] = p);
        setOrganizerMap(orgMap);
    };
    fetchPartners();

    return () => unsubEvents();
  }, []);

  // --- 2. DEEP LINKING EFFECT ---
  useEffect(() => {
    // Si les événements sont chargés, on vérifie si un eventId est dans l'URL
    if (!loading && allEvents.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const eventIdFromUrl = params.get('eventId');
      if (eventIdFromUrl) {
        const found = allEvents.find(e => e.id === eventIdFromUrl);
        if (found) {
          setSelectedEvent(found);
        }
      }
    }
  }, [allEvents, loading]);

  // --- 3. DYNAMIC FILTERING ---
  useEffect(() => {
    let result = allEvents;

    const params = new URLSearchParams(window.location.search);
    const orgParam = params.get('org');
    const filterId = selectedPartnerFilter || orgParam;

    if (filterId) {
      result = result.filter(e => e.organizerId === filterId);
    }
    
    if (cityFilter !== 'ALL') {
      result = result.filter(e => e.location.toLowerCase().includes(cityFilter.toLowerCase()));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }

    setFilteredEvents(result);
  }, [searchQuery, selectedPartnerFilter, cityFilter, allEvents]);

  // --- 4. SLIDER LOGIC ---
  const sliderEvents = allEvents.filter(e => e.isFeatured === true);

  useEffect(() => {
    if (sliderEvents.length <= 1 || showcaseOrg) return;
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % sliderEvents.length), 5000);
    return () => clearInterval(timer);
  }, [sliderEvents.length, showcaseOrg]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % sliderEvents.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + sliderEvents.length) % sliderEvents.length);

  const handleShareEvent = (e: React.MouseEvent, event: EventData) => {
    e.stopPropagation(); // Évite d'ouvrir le modal d'achat par erreur
    const link = `${window.location.origin}/?eventId=${event.id}`;
    navigator.clipboard.writeText(link);
    alert("Lien de partage copié !");
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-royal-main animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-fade-in">
      
      {/* SECTION 1: HEADER (SLIDER OR SHOWCASE BANNER) */}
      {showcaseOrg ? (
        // SHOWCASE BANNER MODE
        <div className="relative w-full h-[400px] bg-slate-900 overflow-hidden">
           <img src={showcaseOrg.banner || "https://via.placeholder.com/1500x500"} className="w-full h-full object-cover opacity-60" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
           <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex items-end gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                 <img src={showcaseOrg.logo || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
              </div>
              <div className="text-white pb-2">
                 <h1 className="text-3xl md:text-5xl font-black flex items-center gap-2">
                   {showcaseOrg.brandName}
                   {showcaseOrg.verificationStatus === 'VERIFIED' && <CheckCircle className="w-6 h-6 text-blue-400" />}
                 </h1>
                 <p className="text-slate-300 max-w-xl text-sm md:text-base">{showcaseOrg.bio || "Bienvenue sur notre vitrine officielle."}</p>
              </div>
           </div>
           <button 
             onClick={() => window.location.href = window.location.origin}
             className="absolute top-6 right-6 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors"
           >
             Retour à l'Aréna
           </button>
        </div>
      ) : (
        // GLOBAL SLIDER MODE (FEATURED ONLY)
        sliderEvents.length > 0 && (
          <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-slate-900 group">
            {sliderEvents.map((ev, idx) => (
              <div 
                key={ev.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img src={ev.image} alt={ev.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 md:pb-20 bg-gradient-to-t from-black/90 to-transparent">
                   <div className="max-w-7xl mx-auto animate-in slide-in-from-bottom-10 fade-in duration-700">
                      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-500/20 border border-yellow-500 text-yellow-400 text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md">
                         <Crown className="w-3 h-3 fill-yellow-400" /> Événement à la Une
                      </div>
                      <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight max-w-4xl drop-shadow-lg">
                        {ev.title}
                      </h2>
                      <div className="flex flex-col md:flex-row gap-6 text-slate-200 mb-8 font-medium">
                         <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-yellow-500"/> {ev.date} à {ev.time}</span>
                         <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-yellow-500"/> {ev.location}</span>
                      </div>
                      <Button onClick={() => setSelectedEvent(ev)} variant="primary" className="!px-8 !py-4 text-base shadow-[0_0_20px_rgba(234,179,8,0.4)] border-yellow-500/50">
                         RÉSERVER MAINTENANT
                      </Button>
                   </div>
                </div>
              </div>
            ))}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-all"><ChevronLeft/></button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-all"><ChevronRight/></button>
            <div className="absolute bottom-6 right-6 md:right-12 z-20 flex gap-2">
              {sliderEvents.map((_, idx) => (
                <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-yellow-500' : 'w-2 bg-white/30'}`}></div>
              ))}
            </div>
          </div>
        )
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-30 -mt-8">
        
        {/* SECTION 2: PARTNERS DIRECTORY (GRID) - VISIBLE ONLY IF NOT IN SHOWCASE */}
        {!showcaseOrg && partners.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-slate-100">
             <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                   <Globe className="w-4 h-4" /> Nos Partenaires Officiels
                </p>
                <span className="text-[10px] bg-royal-light/10 text-royal-main px-2 py-1 rounded font-bold">{partners.length} Vérifiés</span>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                <div 
                  onClick={() => {setSelectedPartnerFilter(null); setCityFilter('ALL'); setSearchQuery('');}}
                  className={`flex flex-col items-center gap-2 cursor-pointer p-2 rounded-xl transition-all ${selectedPartnerFilter === null ? 'bg-royal-main/5 ring-2 ring-royal-main' : 'hover:bg-slate-50'}`}
                >
                   <div className="w-12 h-12 rounded-full bg-royal-light/10 flex items-center justify-center text-royal-main"><Filter size={20}/></div>
                   <span className="text-[10px] font-bold uppercase text-slate-600">Tous</span>
                </div>
                {partners.map(p => (
                   <div 
                     key={p.id}
                     onClick={() => window.location.href = `${window.location.origin}/?org=${p.id}`}
                     className="flex flex-col items-center gap-2 cursor-pointer group p-2 rounded-xl hover:bg-slate-50 transition-all"
                   >
                      <div className="relative w-12 h-12 rounded-full border border-slate-200 overflow-hidden group-hover:border-blue-400 transition-colors">
                         <img src={p.logo || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={p.brandName} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center group-hover:text-blue-600">{p.brandName}</span>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
           <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Ticket className="text-royal-main"/> L'Aréna Hashtag <span className="text-slate-400 text-lg font-medium">({filteredEvents.length})</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full animate-pulse ml-2">
                 <Zap className="w-3 h-3 fill-green-600" /> LIVE
              </span>
           </h3>
           
           <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                 <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <select 
                   value={cityFilter}
                   onChange={(e) => setCityFilter(e.target.value)}
                   className="pl-10 pr-8 py-3 rounded-xl bg-white border-2 border-slate-100 focus:border-royal-main/50 outline-none text-slate-600 font-bold text-sm appearance-none cursor-pointer hover:border-slate-200 transition-colors"
                 >
                    <option value="ALL">Toutes les Villes</option>
                    <option value="Kinshasa">Kinshasa</option>
                    <option value="Lubumbashi">Lubumbashi</option>
                    <option value="Goma">Goma</option>
                    <option value="Matadi">Matadi</option>
                    <option value="Kolwezi">Kolwezi</option>
                 </select>
              </div>

              <div className="relative w-full md:w-80">
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un événement..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-slate-100 focus:border-royal-main/50 outline-none transition-all font-medium text-slate-600"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                      <X className="w-4 h-4"/>
                    </button>
                  )}
              </div>
           </div>
        </div>

        {/* MAIN GRID */}
        {filteredEvents.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase">Aucun événement validé pour le moment.</p>
              <button onClick={() => {setSearchQuery(''); setSelectedPartnerFilter(null); setCityFilter('ALL');}} className="mt-4 text-royal-main font-bold hover:underline">Réinitialiser les filtres</button>
           </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                 const org = organizerMap[event.organizerId];
                 const isVerified = org?.verificationStatus === 'VERIFIED';

                 return (
                    <div 
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border ${event.isFeatured ? 'border-yellow-400 ring-4 ring-yellow-400/10' : 'border-slate-100 hover:-translate-y-2'}`}
                    >
                       {/* SHARE OPTION */}
                       <button 
                         onClick={(e) => handleShareEvent(e, event)}
                         className="absolute top-4 right-4 z-30 p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-royal-main transition-all shadow-xl opacity-0 group-hover:opacity-100"
                         title="Partager cet événement"
                       >
                         <Share2 size={16} />
                       </button>

                       {event.isFeatured && (
                          <div className="absolute top-4 left-4 z-20 bg-yellow-400 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                             <Crown className="w-3 h-3 fill-black"/> Sponsorisé
                          </div>
                       )}

                       <div className="relative aspect-video overflow-hidden bg-slate-200">
                          <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                          
                          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg">
                             <p className="text-xs font-bold text-slate-500 uppercase">Dès</p>
                             <p className="text-lg font-black text-royal-dark leading-none">
                                {event.tickets?.[0]?.price || event.priceStandard} {event.currency}
                             </p>
                          </div>
                       </div>

                       <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                             {org?.logo && <img src={org.logo} className="w-6 h-6 rounded-full object-cover border border-slate-200" />}
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{org?.brandName || "Organisateur"}</span>
                             {isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                          </div>

                          <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 leading-tight group-hover:text-royal-main transition-colors">
                             {event.title}
                          </h3>

                          <div className="space-y-2 text-sm text-slate-600">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-royal-light"/>
                                <span className="font-medium capitalize">{event.date} • {event.time}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-royal-light"/>
                                <span className="font-medium truncate">{event.location}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>
        )}
      </div>

      {/* FOOTER INTERACTIF (UNIQUE) */}
      <footer className="border-t border-purple-100 bg-slate-50 py-10 text-center relative z-10 no-print">
          <p className="text-purple-900/30 font-black text-[10px] tracking-[0.3em] uppercase">© 2025 HASHTAG V27 • KINSHASA</p>
          
          <div className="mt-4 flex flex-col items-center gap-4">
             <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-medium">
                <button onClick={() => setLegalModal('cgv')} className="hover:text-purple-900 underline decoration-dotted transition-colors">Conditions Générales (CGV)</button>
                <span>•</span>
                <button onClick={() => setLegalModal('privacy')} className="hover:text-purple-900 underline decoration-dotted transition-colors">Confidentialité</button>
             </div>
          </div>
      </footer>

      {/* MODALE JURIDIQUE */}
      {legalModal && (
          <div 
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLegalModal(null)}
          >
              <div 
                className="bg-white rounded-2xl max-w-lg w-full p-8 relative shadow-2xl border border-amber-500"
                onClick={(e) => e.stopPropagation()}
              >
                  <button onClick={() => setLegalModal(null)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition">
                    <ArrowRight size={16} className="rotate-180"/>
                  </button>
                  
                  <h2 className="text-2xl font-black text-purple-900 mb-6 uppercase tracking-tight">
                      {legalModal === 'cgv' ? 'CONDITIONS GÉNÉRALES' : 'CONFIDENTIALITÉ'}
                  </h2>
                  
                  <div className="text-xs text-slate-600 space-y-4 h-64 overflow-y-auto font-medium leading-relaxed pr-2">
                      {legalModal === 'cgv' ? (
                          <>
                              <p>1. <strong>TICKETS :</strong> Les billets achetés sur #HASHTAG_V27 sont fermes et définitifs. Ils ne sont ni échangeables ni remboursables, sauf en cas d'annulation totale de l'événement par l'organisateur.</p>
                              <p>2. <strong>VALIDITÉ :</strong> Chaque billet est unique et scannable une seule fois. Toute tentative de duplication entraînera un refus d'accès.</p>
                              <p>3. <strong>RESPONSABILITÉ :</strong> #HASHTAG_V27 agit en tant qu'intermédiaire technologique. L'organisation, la sécurité et le déroulement de l'événement relèvent de la responsabilité exclusive de l'Organisateur indiqué sur le billet.</p>
                          </>
                      ) : (
                          <>
                              <p>1. <strong>DONNÉES :</strong> Nous collectons votre Nom et Numéro de Téléphone uniquement pour générer votre billet et vous permettre de le récupérer.</p>
                              <p>2. <strong>PROTECTION :</strong> Vos données ne sont jamais vendues à des tiers. Elles sont partagées uniquement avec l'organisateur de l'événement concerné pour le contrôle d'accès.</p>
                              <p>3. <strong>SÉCURITÉ :</strong> Les transactions financières sont gérées par les opérateurs mobiles sécurisés. Nous ne stockons aucune information bancaire sensible.</p>
                          </>
                      )}
                  </div>
                  
                  <button onClick={() => setLegalModal(null)} className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs">JE COMPRENDS</button>
              </div>
          </div>
      )}

      {selectedEvent && (
        <PurchaseModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
};

export default PublicHome;