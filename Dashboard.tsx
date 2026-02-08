import React, { useEffect, useState, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { 
  LogOut, Plus, Calendar, Loader2, LayoutDashboard, Store, User, Upload, 
  CheckCircle, Copy, ExternalLink, Palette, Banknote, Check, MessageCircle, 
  AlertTriangle, Diamond, Star, Crown, Activity, HelpCircle, Share2
} from 'lucide-react';
import Button from './Button';
import CreateEventForm from './CreateEventForm';

interface DashboardProps {
  onLogout: () => void;
}

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  priceStandard: string;
  status: string;
  image: string;
  ticketCapacity: string;
  currency?: string;
}

interface UserProfile {
  brandName: string;
  bio: string;
  logo: string;
  banner: string;
  themeColor: string;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
  plan: 'STARTER' | 'GOLD' | 'DIAMOND';
  subscriptionStatus?: 'ACTIVE' | 'PENDING' | 'NONE';
}

interface Order {
  id: string;
  clientName: string;
  clientPhone: string;
  customerPhone?: string;
  ticketName: string;
  totalAmount: number;
  currency: string;
  transactionId: string;
  status: 'PENDING' | 'PAID';
  eventTitle: string;
  notified?: boolean; 
  eventId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'SHOWCASE' | 'SALES' | 'PARTNERSHIP'>('EVENTS');
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    brandName: '', bio: '', logo: '', banner: '', themeColor: '#6A0DAD',
    verificationStatus: 'UNVERIFIED', plan: 'STARTER'
  });
  const [config, setConfig] = useState<any>({});

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'GOLD' | 'DIAMOND' | null>(null);
  const [subTxCode, setSubTxCode] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const maxWidth = type === 'logo' ? 500 : 1200;
      const compressed = await compressImage(file, maxWidth);
      setProfile(prev => ({ ...prev, [type]: compressed }));
    } catch (error) { alert("Erreur compression."); }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      setLoadingEvents(true);
      try {
        const q = query(collection(db, "events"), where("organizerId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventData)));
      } catch (error) { console.error(error); } 
      finally { setLoadingEvents(false); }
      setLoadingProfile(true);
      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(prev => ({ ...prev, ...docSnap.data() as Partial<UserProfile> }));
        }
      } catch (error) { console.error(error); } 
      finally { setLoadingProfile(false); }
      try {
        const confSnap = await getDoc(doc(db, "system_config", "main"));
        if (confSnap.exists()) setConfig(confSnap.data());
      } catch (e) {}
      try {
         const qOrders = query(collection(db, 'orders'), where('organizerId', '==', auth.currentUser.uid));
         const oSnap = await getDocs(qOrders);
         setOrders(oSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch(e) {}
    };
    fetchData();
  }, [auth.currentUser]);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), profile, { merge: true });
      alert("Profil mis à jour !");
    } catch (error) { alert("Erreur sauvegarde."); } 
    finally { setSavingProfile(false); }
  };

  const handleValidateOrder = async (orderId: string) => {
    try {
       await updateDoc(doc(db, 'orders', orderId), { status: 'PAID' });
       setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PAID' } : o));
    } catch (err) { alert("Erreur validation"); }
  };

  const handleNotifyClient = async (order: Order) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { notified: true });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, notified: true } : o));
      let cleanPhone = (order.customerPhone || order.clientPhone).replace(/\D/g, '');
      if (!cleanPhone.startsWith('243')) cleanPhone = '243' + cleanPhone;
      
      const prenom = order.clientName.split(' ')[0];
      const siteUrl = window.location.origin;
      const message = `🎉 FÉLICITATIONS ${prenom} !

Votre accès pour l'événement *${order.eventTitle}* est confirmé ! 🥂
Label : #HASHTAG_V27

📥 *COMMENT RÉCUPÉRER VOTRE BILLET PDF ?*
1. Allez sur le site officiel : ${siteUrl}
2. Cliquez sur l'onglet "Suivre ma commande"
3. Entrez votre numéro : ${order.customerPhone || order.clientPhone}

Votre billet officiel s'affichera immédiatement en téléchargement.
À très vite ! ✨`;
      
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } catch (e) { alert("Erreur notif."); }
  };

  const handleSubscribe = async () => {
    if (!auth.currentUser || !subTxCode) return;
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
         pendingPlan: selectedPlan,
         subscriptionStatus: 'PENDING',
         subscriptionTxCode: subTxCode
      });
      setProfile(prev => ({ ...prev, subscriptionStatus: 'PENDING' }));
      setShowSubModal(false);
      alert("Demande envoyée ! En attente de validation admin.");
    } catch (e) { alert("Erreur technique."); }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/?org=${auth.currentUser?.uid}`;
    navigator.clipboard.writeText(link);
    alert("Lien copié !");
  };

  const handleShareEvent = (event: EventData) => {
    const link = `${window.location.origin}/?eventId=${event.id}`;
    navigator.clipboard.writeText(link);
    alert("Lien de partage copié !");
  };

  const getEventProgress = (eventId: string, capacityStr: string) => {
      const capacity = parseInt(capacityStr) || 100;
      const sold = orders.filter(o => o.eventId === eventId && o.status === 'PAID').length;
      return { sold, capacity, percent: Math.round((sold / capacity) * 100) };
  };

  const paidOrders = orders.filter(o => o.status === 'PAID');
  const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const upcoming = events.filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const labelStats = { 
        totalTicketsSold: paidOrders.length, 
        totalRevenue, 
        activeEvents: events.filter(e => e.status === 'ACTIF').length,
        totalEvents: events.length,
        upcoming,
        lostSavings: Math.round(totalRevenue * 0.03)
  };

  const glassCard = "bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl";

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-slate-200 pb-20 font-sans selection:bg-purple-500 selection:text-white">
      <div className="fixed bottom-24 right-6 z-[9990] animate-bounce">
         <button onClick={() => alert("Utilisez la bulle de chat en bas à droite pour contacter le Support Hashtag.")} className="bg-red-600 text-white p-3 rounded-full shadow-lg border-2 border-white flex items-center gap-2 font-bold uppercase text-xs hover:scale-110 transition-transform">
            <HelpCircle size={20} /> SOS ADMIN
         </button>
      </div>
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div><h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">HASHTAG <span className="text-purple-400">EVENTS</span></h1></div>
          <button onClick={() => signOut(auth).then(onLogout)} className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase transition-colors relative z-50"><LogOut className="w-4 h-4" /> Déconnexion</button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className={`w-full md:w-64 ${glassCard} md:h-[calc(100vh-80px)] md:sticky md:top-24 p-4 flex flex-col gap-2 z-30`}>
            {['EVENTS', 'SALES', 'SHOWCASE', 'PARTNERSHIP'].map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab as any)} className={`relative z-50 w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm uppercase transition-all ${activeTab === tab ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'hover:bg-white/10 text-slate-300'}`}>
                 {tab === 'EVENTS' && <LayoutDashboard className="w-5 h-5" />}
                 {tab === 'SALES' && <Banknote className="w-5 h-5" />}
                 {tab === 'SHOWCASE' && <Store className="w-5 h-5" />}
                 {tab === 'PARTNERSHIP' && <Diamond className="w-5 h-5" />}
                 {tab === 'EVENTS' ? 'Mes Événements' : tab === 'SALES' ? 'Ventes' : tab === 'SHOWCASE' ? 'Ma Vitrine' : 'Partenariat'}
               </button>
            ))}
            <div className="mt-auto pt-4 border-t border-white/10 px-4 py-2">
               <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Badge Actuel</p>
               <div className={`flex items-center gap-2 text-xs font-black uppercase ${profile.plan === 'DIAMOND' ? 'text-blue-300' : profile.plan === 'GOLD' ? 'text-yellow-400' : 'text-slate-400'}`}>
                 {profile.plan === 'DIAMOND' ? <Crown className="w-4 h-4" /> : profile.plan === 'GOLD' ? <Star className="w-4 h-4" /> : <User className="w-4 h-4" />}
                 {profile.plan || 'STARTER'}
               </div>
            </div>
          </div>
          <div className="flex-1 w-full min-w-0">
             {activeTab === 'EVENTS' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`mb-10 ${glassCard} p-6 border-l-4 border-l-yellow-500`}>
                      <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-500"/> Vue d'ensemble Label</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                          <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Billets Vendus</p><p className="text-3xl font-black text-white">{labelStats.totalTicketsSold}</p></div>
                          <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Chiffre d'Affaires</p><p className="text-3xl font-black text-yellow-500">{labelStats.totalRevenue.toLocaleString()}</p></div>
                          <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Événements Actifs</p><p className="text-3xl font-black text-white">{labelStats.activeEvents} <span className="text-sm text-slate-500">/ {labelStats.totalEvents}</span></p></div>
                          <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Prochain Événement</p><p className="text-sm font-bold text-white truncate">{labelStats.upcoming ? labelStats.upcoming.title : 'Aucun prévu'}</p></div>
                      </div>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-6">
                    <div><h2 className="text-3xl font-black text-white mb-2">Mes Événements</h2><div className="w-16 h-1 bg-purple-500 rounded-full"></div></div>
                    <Button onClick={() => setShowCreateForm(true)} variant="primary" className="!bg-gradient-to-r !from-purple-600 !to-indigo-600 border-none relative z-50 shadow-lg shadow-purple-900/50"><Plus className="w-5 h-5" /> Nouvel Événement</Button>
                  </div>
                  {loadingEvents ? <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 text-purple-500 animate-spin" /></div> : events.length === 0 ? <div className={`text-center py-20 ${glassCard} text-slate-400`}>Aucun événement. Créez votre premier spectacle.</div> : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {events.map((event) => {
                        const progress = getEventProgress(event.id, event.ticketCapacity);
                        return (
                            <div key={event.id} className={`group relative ${glassCard} overflow-hidden transition-all duration-300 hover:border-purple-500/50`}>
                              <div className="absolute top-4 right-4 z-20 flex gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleShareEvent(event); }}
                                  className="px-3 py-1 bg-blue-600/80 text-white rounded-full text-[10px] font-black uppercase flex items-center gap-1 border border-blue-400/50 hover:bg-blue-500 transition-colors"
                                >
                                  <Share2 size={12} /> Partager
                                </button>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${event.status === 'PENDING' ? 'bg-yellow-900/80 text-yellow-500 border-yellow-800' : 'bg-green-900/80 text-green-500 border-green-800'}`}>{event.status === 'PENDING' ? 'En Attente' : 'Actif'}</span>
                              </div>
                              <div className="h-48 relative overflow-hidden bg-black/50">
                                  <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute bottom-4 left-4">
                                      <h3 className="text-xl font-bold text-white line-clamp-1">{event.title}</h3>
                                      <div className="flex items-center gap-2 text-slate-300 text-xs mt-1"><Calendar className="w-3 h-3 text-purple-400" /><span>{event.date} • {event.time}</span></div>
                                  </div>
                              </div>
                              <div className="p-6">
                                  <div className="mb-4 bg-black/30 p-4 rounded-xl border border-white/10">
                                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2"><span>Jauge Aréna</span><span className="text-white">{progress.sold} / {progress.capacity}</span></div>
                                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000" style={{ width: `${progress.percent}%` }}></div></div>
                                      <p className="text-[10px] text-right text-purple-400 mt-1 font-mono">{progress.percent}% Rempli</p>
                                  </div>
                              </div>
                            </div>
                        );
                      })}
                    </div>
                  )}
                </div>
             )}
             {activeTab === 'SALES' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-3xl font-black text-white mb-6">Journal des Ventes</h2>
                  {orders.filter(o => o.status === 'PAID' && !o.notified).length > 0 && (
                    <div className="mb-8 bg-red-900/30 border border-red-500/50 rounded-2xl p-6 text-red-200 shadow-xl animate-pulse backdrop-blur-sm"><h3 className="text-lg font-black uppercase flex items-center gap-2"><AlertTriangle className="w-6 h-6" /> ACTION REQUISE : CLIENTS NON NOTIFIÉS !</h3></div>
                  )}
                  {orders.length === 0 ? <div className={`text-center py-20 ${glassCard} text-slate-400`}>Aucune vente enregistrée.</div> : (
                     <div className="grid gap-4">
                        {orders.map((order) => (
                           <div key={order.id} className={`${glassCard} p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 ${order.status === 'PAID' && !order.notified ? 'border-red-500' : 'border-purple-500'}`}>
                              <div className="flex-1"><h4 className="font-bold text-white">{order.clientName}</h4><p className="text-xs text-slate-400 font-mono">{order.customerPhone || order.clientPhone}</p></div>
                              <div className="text-right"><p className="text-lg font-black text-white">{order.totalAmount} {order.currency}</p></div>
                              <div className="flex gap-2">
                                 {order.status === 'PENDING' ? (
                                    <Button variant="primary" onClick={() => handleValidateOrder(order.id)} className="!py-2 !px-4 !text-xs !bg-green-600 border-none relative z-50"><Check className="w-4 h-4" /> VALIDER</Button>
                                 ) : (
                                    <button onClick={() => handleNotifyClient(order)} className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-1 transition-colors relative z-50 ${order.notified ? 'bg-white/10 text-slate-500' : 'bg-red-600 text-white hover:bg-red-500 animate-bounce'}`}><MessageCircle className="w-3 h-3" /> {order.notified ? 'NOTIFIÉ' : 'NOTIFIER'}</button>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
                </div>
             )}
             {activeTab === 'SHOWCASE' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                   <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                      <div><h2 className="text-3xl font-black text-white mb-2">Ma Vitrine</h2><div className="w-16 h-1 bg-purple-500 rounded-full"></div></div>
                      <Button onClick={handleSaveProfile} variant="primary" className="!py-3 !bg-green-600 border-none relative z-50">{savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Sauvegarder</Button>
                   </div>
                   <div className={`${glassCard} p-6 flex items-center justify-between gap-4`}><div><h4 className="text-xs font-black text-purple-300 uppercase">Lien Unique</h4></div><div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10"><ExternalLink className="w-4 h-4 text-slate-500 ml-2" /><code className="text-sm font-mono text-slate-300 truncate max-w-[200px]">{window.location.origin}/?org={auth.currentUser?.uid.substring(0,8)}...</code><button onClick={copyLink} className="p-2 hover:bg-white/10 rounded-lg relative z-50"><Copy className="w-4 h-4 text-slate-400" /></button></div></div>
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 space-y-6">
                         <div className={`${glassCard} p-6`}>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><User className="w-5 h-5 text-purple-400" /> Informations</h3>
                            <div className="space-y-4">
                               <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Nom Marque</label><input value={profile.brandName} onChange={(e) => setProfile({...profile, brandName: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/20 text-white rounded-xl focus:border-purple-500 outline-none" /></div>
                               <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Bio</label><textarea value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="w-full px-4 py-3 bg-black/30 border border-white/20 text-white rounded-xl h-32 resize-none focus:border-purple-500 outline-none" /></div>
                            </div>
                         </div>
                      </div>
                      <div className="lg:col-span-2">
                         <div className={`${glassCard} p-6 relative overflow-hidden group`}>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-400" /> Visuel</h3>
                            <div className="relative w-full h-48 rounded-2xl bg-black/40 border-2 border-dashed border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-colors" onClick={() => bannerInputRef.current?.click()}>
                               {profile.banner ? <img src={profile.banner} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600"><Upload className="w-8 h-8 mb-2" /><span className="text-xs font-bold uppercase">Bannière</span></div>}
                               <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                            </div>
                            <div className="relative -mt-12 ml-6 flex items-end">
                               <div className="w-24 h-24 rounded-full border-4 border-slate-900 bg-slate-800 shadow-lg overflow-hidden cursor-pointer relative group-hover:scale-105 transition-transform" onClick={() => logoInputRef.current?.click()}>
                                  {profile.logo ? <img src={profile.logo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><User className="w-8 h-8" /></div>}
                                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                               </div>
                               <div className="ml-4 mb-2"><h1 className="text-2xl font-black text-white flex items-center gap-2">{profile.brandName} {profile.verificationStatus === 'VERIFIED' && <CheckCircle className="w-5 h-5 text-blue-500" />}</h1></div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             )}
             {activeTab === 'PARTNERSHIP' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="flex justify-between items-center mb-8">
                      <div><h2 className="text-3xl font-black text-white mb-2">Hashtag Partner Prime</h2><div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"></div></div>
                      {profile.verificationStatus === 'VERIFIED' && profile.plan !== 'STARTER' ? (
                         <Button onClick={() => setShowCertificate(true)} variant="primary" className="!bg-gradient-to-r !from-yellow-500 !to-yellow-700 !text-black border-none relative z-50">VOIR MON CERTIFICAT</Button>
                      ) : profile.subscriptionStatus === 'PENDING' ? (
                         <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500 text-yellow-500 rounded-full text-xs font-bold animate-pulse">VALIDATION EN COURS</div>
                      ) : null}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`${glassCard} p-6 border-l-4 border-slate-500`}><h3 className="text-xl font-black text-slate-400 uppercase">Starter</h3><p className="text-3xl font-black text-white my-4">Gratuit</p><ul className="text-sm text-slate-400 list-disc list-inside mb-6 space-y-2"><li>Création Illimitée</li><li>Vitrine Basique</li><li>Commission Standard (10%)</li></ul><button disabled className="w-full py-3 bg-white/5 text-slate-500 rounded-xl font-bold uppercase text-xs">Actuel</button></div>
                      <div className={`${glassCard} p-6 border-l-4 border-yellow-500 transform scale-105 shadow-yellow-900/20`}><h3 className="text-xl font-black text-yellow-500 uppercase">Gold</h3><p className="text-3xl font-black text-white my-4">50$ <span className="text-sm text-slate-500">/ mois</span></p><ul className="text-sm text-slate-300 list-disc list-inside mb-6 space-y-2"><li><strong>Badge Vérifié</strong></li><li>Priorité Support</li><li>Commission Réduite (8%)</li></ul>{profile.plan === 'GOLD' ? <button disabled className="w-full py-3 bg-yellow-500 text-black rounded-xl font-bold uppercase text-xs">Actif</button> : <Button onClick={() => { setSelectedPlan('GOLD'); setShowSubModal(true); }} variant="primary" className="!bg-yellow-500 !text-black w-full border-none">Choisir Gold</Button>}</div>
                      <div className={`${glassCard} p-6 border-l-4 border-blue-500`}><h3 className="text-xl font-black text-blue-400 uppercase">Diamond</h3><p className="text-3xl font-black text-white my-4">200$ <span className="text-sm text-slate-500">/ mois</span></p><ul className="text-sm text-slate-300 list-disc list-inside mb-6 space-y-2"><li><strong>Tout Gold +</strong></li><li>Publicité Bandeau</li><li>Commission Minimale (7%)</li></ul>{profile.plan === 'DIAMOND' ? <button disabled className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold uppercase text-xs">Actif</button> : <Button onClick={() => { setSelectedPlan('DIAMOND'); setShowSubModal(true); }} variant="primary" className="!bg-blue-600 !text-white w-full border-none">Choisir Diamond</Button>}</div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
      {showCreateForm && <CreateEventForm onClose={() => setShowCreateForm(false)} onSuccess={() => { setShowCreateForm(false); window.location.reload(); }} />}
      {showSubModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className={`${glassCard} border border-white/20 p-8 max-w-md w-full shadow-2xl relative bg-slate-900`}>
              <h3 className="text-xl font-black text-white mb-4 uppercase text-center">Activation {selectedPlan}</h3>
              <p className="text-sm text-slate-400 text-center mb-6">Envoyez le montant aux numéros Hashtag.</p>
              <div className="space-y-3 mb-6 bg-black/40 p-4 rounded-xl border border-white/10">
                 <div className="flex justify-between text-sm font-bold"><span className="text-orange-600">Orange</span> <span className="text-slate-300">{config.orangeMoney || '+243...'}</span></div>
                 <div className="flex justify-between text-sm font-bold"><span className="text-red-600">Airtel</span> <span className="text-slate-300">{config.airtelMoney || '+243...'}</span></div>
                 <div className="flex justify-between text-sm font-bold"><span className="text-red-500">M-Pesa</span> <span className="text-slate-300">{config.mpesa || '+243...'}</span></div>
              </div>
              <input value={subTxCode} onChange={e => setSubTxCode(e.target.value)} placeholder="Code Transaction (Preuve)" className="w-full p-4 bg-black/30 rounded-xl font-mono text-center font-bold text-white mb-6 border border-white/20 focus:border-purple-500 outline-none" />
              <div className="flex gap-4"><button onClick={() => setShowSubModal(false)} className="flex-1 py-3 text-slate-400 hover:text-white font-bold uppercase text-xs">Annuler</button><Button onClick={handleSubscribe} variant="primary" className="flex-1 !bg-purple-600 !text-white border-none">Confirmer</Button></div>
           </div>
        </div>
      )}
      {showCertificate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowCertificate(false)}></div>
           <div className="bg-[#fffef0] text-slate-900 max-w-lg w-full p-12 rounded-sm shadow-2xl relative z-10 border-[16px] border-double border-yellow-600">
              <div className="absolute top-4 left-4 w-4 h-4 bg-yellow-600 rounded-full"></div>
              <div className="absolute top-4 right-4 w-4 h-4 bg-yellow-600 rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 bg-yellow-600 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 bg-yellow-600 rounded-full"></div>
              <div className="text-center border-b-2 border-slate-800 pb-8 mb-8"><h2 className="text-5xl font-serif font-black tracking-widest text-slate-900 uppercase">Certificat</h2><p className="text-base font-serif italic text-slate-600 mt-2">de Partenariat Officiel Hashtag Events</p></div>
              <div className="text-center space-y-8 font-serif">
                 <p className="text-xl">Il est certifié par la présente que</p>
                 <h3 className="text-4xl font-bold text-purple-800 uppercase underline decoration-double underline-offset-4 font-sans tracking-wide">{profile.brandName}</h3>
                 <p className="text-xl">est reconnu comme membre d'élite</p>
                 <div className="inline-block border-4 border-slate-900 px-8 py-3 text-2xl font-black uppercase tracking-[0.2em] bg-yellow-500/20">{profile.plan}</div>
                 <p className="text-sm text-slate-500 italic mt-6 px-8">"Luxe, Sécurité et Excellence." Ce partenaire a démontré sa conformité aux standards les plus élevés de l'événementiel congolais.</p>
              </div>
              <div className="mt-16 flex justify-between items-end pt-8 border-t border-slate-300">
                 <div className="text-center"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HASHTAG-PARTNER-VERIFIED" className="w-20 h-20 mix-blend-multiply opacity-80" alt="QR" /><p className="text-[10px] uppercase font-bold mt-2 tracking-widest">Sceau Numérique</p></div>
                 <div className="text-right"><p className="font-dancing-script text-3xl text-purple-900">Benji Bikamwa</p><div className="h-0.5 w-40 bg-slate-900 mt-1"></div><p className="text-[10px] uppercase font-bold mt-2 tracking-widest">PDG Hashtag Events</p></div>
              </div>
              <button onClick={() => window.print()} className="mt-10 w-full py-4 bg-slate-900 text-white font-bold uppercase text-xs hover:bg-slate-800 tracking-widest print:hidden">Imprimer le Certificat</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;