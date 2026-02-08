import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CheckCircle, MapPin, Calendar, Loader2 } from 'lucide-react';
import EventList from './EventList';

interface PublicShowcaseProps {
  organizerId: string;
}

interface OrganizerProfile {
  brandName: string;
  bio: string;
  logo: string;
  banner: string;
  themeColor: string;
  verificationStatus: string;
}

const PublicShowcase: React.FC<PublicShowcaseProps> = ({ organizerId }) => {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", organizerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as OrganizerProfile);
        }
      } catch (error) {
        console.error("Error fetching showcase:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [organizerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-royal-main animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-20 text-slate-500">Organisateur introuvable.</div>;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* HEADER / BANNER SECTION */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-slate-900">
        {profile.banner ? (
          <img src={profile.banner} alt="Cover" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="w-full h-full bg-gradient-royal opacity-50"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>

      {/* PROFILE INFO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-24 z-10">
        <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
          {/* Logo */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-white shadow-2xl overflow-hidden flex-shrink-0">
            {profile.logo ? (
              <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold">LOGO</div>
            )}
          </div>

          {/* Text Info */}
          <div className="flex-1 text-white pb-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 flex items-center gap-2">
              {profile.brandName || "Nom de l'Organisateur"}
              {profile.verificationStatus === 'VERIFIED' && (
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-400 fill-blue-400/20" />
              )}
            </h1>
            <p className="text-slate-200 text-sm md:text-base max-w-2xl line-clamp-2 md:line-clamp-none">
              {profile.bio || "Aucune description disponible pour cet organisateur."}
            </p>
          </div>
        </div>

        {/* EVENTS SECTION */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-300 flex-1"></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest text-center">
              Événements à venir
            </h2>
            <div className="h-px bg-slate-300 flex-1"></div>
          </div>

          {/* Reusing EventList with organizer filter */}
          <EventList organizerId={organizerId} />
        </div>
      </div>
    </div>
  );
};

export default PublicShowcase;