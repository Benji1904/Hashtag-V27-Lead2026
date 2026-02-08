import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Calendar, MapPin, Ticket, Crown, CheckCircle } from 'lucide-react';
import PurchaseModal from './PurchaseModal';
import Button from './Button';

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

interface UserMap {
  [key: string]: {
    isVerified: boolean;
    brandName: string;
  }
}

interface EventListProps {
  organizerId?: string;
}

const EventList: React.FC<EventListProps> = ({ organizerId }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [organizerInfo, setOrganizerInfo] = useState<UserMap>({});

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let q;
        if (organizerId) {
          q = query(collection(db, "events"), where("organizerId", "==", organizerId), where("status", "==", "ACTIF"));
        } else {
          q = query(collection(db, "events"), where("status", "==", "ACTIF"));
        }

        const querySnapshot = await getDocs(q);
        const eventsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EventData[];
        
        // Optimize: Fetch Unique Organizers for Badges
        const orgIds = [...new Set(eventsList.map(e => e.organizerId))];
        const userMap: UserMap = {};
        
        // In a real app we would chunk this, here we iterate (safe for < 100 orgs)
        await Promise.all(orgIds.map(async (uid) => {
           // We cheat a bit and fetch all users once in a real app, 
           // but here we just do individual fetches as it's cleaner code for the prompt constraints
           const userQuery = query(collection(db, 'users'), where('__name__', '==', uid));
           const userSnap = await getDocs(userQuery);
           if (!userSnap.empty) {
             const d = userSnap.docs[0].data();
             userMap[uid] = {
               isVerified: d.verificationStatus === 'VERIFIED',
               brandName: d.brandName
             };
           }
        }));
        setOrganizerInfo(userMap);

        // Sort: Featured First
        eventsList.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching public events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [organizerId]);

  if (loading) {
    return <div className="text-center py-20 text-slate-400 font-bold uppercase animate-pulse">Chargement de l'Aréna...</div>;
  }

  if (events.length === 0) {
    return <div className="text-center py-20 text-slate-400 font-medium">Aucun événement disponible dans l'Aréna pour le moment.</div>;
  }

  return (
    <section className="py-10 pb-40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {events.map((event, index) => {
            const org = organizerInfo[event.organizerId];
            const isVerified = org?.isVerified;
            
            return (
              <div 
                key={event.id}
                className={`group relative glass-jewel rounded-[2.5rem] p-4 transition-all duration-700 hover:scale-[1.03] hover:-translate-y-4 hover:shadow-jewel-hover flex flex-col h-full overflow-hidden ${event.isFeatured ? 'border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {event.isFeatured && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30 bg-yellow-500 text-black px-4 py-1 rounded-b-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-1">
                    <Crown className="w-3 h-3" /> À la Une
                  </div>
                )}

                {/* Image Container */}
                <div className="relative h-72 rounded-[2rem] overflow-hidden mb-6 shadow-inner bg-slate-200">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-royal-dark/60 to-transparent"></div>
                  
                  {/* Price Bubble */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full text-royal-dark font-black text-xs shadow-lg">
                      Dès {event.tickets?.[0]?.price || event.priceStandard} {event.currency || 'FC'}
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="px-2 pb-2 flex-grow flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-royal-main transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  
                  {/* Organizer Badge */}
                  {org && (
                    <div className="flex items-center gap-1 mb-4">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{org.brandName}</span>
                       {isVerified && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500/20" />}
                    </div>
                  )}
                  
                  <div className="w-8 h-1 bg-gradient-royal rounded-full mb-4 opacity-50"></div>
                  
                  <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/40 border border-white/60 mb-4">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-[10px] uppercase tracking-wide">
                      <Calendar className="w-3 h-3 text-royal-light" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-[10px] uppercase tracking-wide truncate max-w-[120px]">
                      <MapPin className="w-3 h-3 text-royal-light" />
                      {event.location}
                    </div>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full shadow-md text-xs"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Ticket className="w-4 h-4" /> Prendre mon billet
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedEvent && (
        <PurchaseModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </section>
  );
};

export default EventList;