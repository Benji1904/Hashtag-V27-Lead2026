import React, { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, deleteField, orderBy, setDoc, getDoc, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  LayoutDashboard, Users, MessageCircle, CreditCard, 
  Settings, LogOut, TrendingUp, Megaphone, Shield, 
  CheckCircle, Trash2, StopCircle, PlayCircle, Zap,
  Send, Search, Filter, Lock, Save, Globe, Smartphone, RefreshCw, AlertTriangle, UserCheck, Bell, XCircle, Star, Activity, Monitor, Percent, DollarSign, MapPin, UserPlus
} from 'lucide-react';
import Button from './Button';
import Scanner from './Scanner';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVENTS' | 'USERS' | 'SUPPORT' | 'COMMS' | 'CONFIG' | 'SECURITY' | 'SURVEILLANCE' | 'SECURITY_MGMT'>('OVERVIEW');
  const [showScanner, setShowScanner] = useState(false);
  
  const [events, setEvents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  
  const [tickerConfig, setTickerConfig] = useState({
    text: '',
    active: false,
    type: 'INFO' as 'INFO' | 'ALERT' | 'PROMO'
  });

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminReply, setAdminReply] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sysConfig, setSysConfig] = useState({
    orangeMoney: '',
    airtelMoney: '',
    mpesa: '',
    exchangeRate: '2800'
  });

  const [pricingConfig, setPricingConfig] = useState({
    usd: 0.5,
    cdf: 1000,
    percent: 0
  });

  // Security Management State
  const [securityConfig, setSecurityConfig] = useState<{
    agents: { name: string; pin: string }[];
    zones: string[];
  }>({ agents: [], zones: [] });

  const [newAgent, setNewAgent] = useState({ name: '', pin: '' });
  const [newZone, setNewZone] = useState('');

  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAnnounce = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubChats = onSnapshot(query(collection(db, 'support_chats'), orderBy('updatedAt', 'desc')), (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubLogs = onSnapshot(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc')), (snap) => {
      setSecurityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubTraffic = onSnapshot(query(collection(db, 'traffic_logs'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
      setTrafficData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTicker = onSnapshot(doc(db, 'settings', 'ticker'), (snap) => {
      if (snap.exists()) {
        setTickerConfig(snap.data() as any);
      }
    });

    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing'), (snap) => {
      if (snap.exists()) {
        setPricingConfig(snap.data() as any);
      }
    });

    const unsubSecurity = onSnapshot(doc(db, 'settings', 'security'), (snap) => {
      if (snap.exists()) {
        setSecurityConfig(snap.data() as any);
      }
    });

    getDoc(doc(db, 'system_config', 'main')).then(snap => { if(snap.exists()) setSysConfig(snap.data() as any); });
    return () => { unsubEvents(); unsubOrders(); unsubUsers(); unsubAnnounce(); unsubChats(); unsubLogs(); unsubTraffic(); unsubTicker(); unsubPricing(); unsubSecurity(); };
  }, []);

  useEffect(() => {
    if (!selectedChatId) return;
    const unsubMsgs = onSnapshot(query(collection(db, `support_chats/${selectedChatId}/messages`), orderBy('createdAt', 'asc')), (snap) => {
        setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsubMsgs();
  }, [selectedChatId]);

  const saveTicker = async () => {
    try {
      await setDoc(doc(db, 'settings', 'ticker'), {
        ...tickerConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("✅ BANDE FILANTE MISE À JOUR !");
    } catch (e) {
      alert("❌ ERREUR SAUVEGARDE");
    }
  };

  const savePricing = async () => {
    try {
      await setDoc(doc(db, 'settings', 'pricing'), {
        ...pricingConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("✅ TARIFS DE COMMISSION MIS À JOUR !");
    } catch (e) {
      alert("❌ ERREUR SAUVEGARDE");
    }
  };

  // Security Mgmt Functions
  const addAgent = async () => {
    if (!newAgent.name || !newAgent.pin) return;
    const updated = { ...securityConfig, agents: [...securityConfig.agents, newAgent] };
    await setDoc(doc(db, 'settings', 'security'), updated);
    setNewAgent({ name: '', pin: '' });
  };

  const removeAgent = async (index: number) => {
    const updated = { ...securityConfig, agents: securityConfig.agents.filter((_, i) => i !== index) };
    await setDoc(doc(db, 'settings', 'security'), updated);
  };

  const addZone = async () => {
    if (!newZone) return;
    const updated = { ...securityConfig, zones: [...securityConfig.zones, newZone] };
    await setDoc(doc(db, 'settings', 'security'), updated);
    setNewZone('');
  };

  const removeZone = async (index: number) => {
    const updated = { ...securityConfig, zones: securityConfig.zones.filter((_, i) => i !== index) };
    await setDoc(doc(db, 'settings', 'security'), updated);
  };

  const toggleApprove = async (id: string, currentStatus: string) => {
      const newStatus = currentStatus === 'VALIDATED' ? 'PENDING' : 'VALIDATED';
      await updateDoc(doc(db, "events", id), { status: newStatus });
  };
  
  const handleDeleteEvent = async (id: string) => {
    try { await deleteDoc(doc(db, "events", id)); } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (id: string) => {
    try { await deleteDoc(doc(db, "users", id)); } catch (e) { console.error(e); }
  };

  const toggleUserBan = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try { await updateDoc(doc(db, "users", id), { status: newStatus }); } catch (e) { console.error(e); }
  };

  const toggleSoldOut = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'events', id), { isSoldOut: !current });
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'events', id), { isFeatured: !current });
  };

  const handleApproveSubscription = async (user: any) => {
    await updateDoc(doc(db, "users", user.id), {
        plan: user.pendingPlan,
        subscriptionStatus: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        pendingPlan: deleteField(),
        subscriptionTxCode: deleteField()
    });
  };

  const saveConfig = async () => {
     try { await setDoc(doc(db, 'system_config', 'main'), sysConfig, { merge: true }); alert("✅ CONFIGURATION SAUVEGARDÉE !"); } catch(e) { alert("❌ ERREUR"); }
  };

  const getEventStats = (eventId: string, capacityStr: string) => {
    const capacity = parseInt(capacityStr) || 100;
    const eventOrders = orders.filter(o => o.eventId === eventId && o.status === 'PAID');
    const revenue = eventOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const percent = Math.min(100, Math.round((eventOrders.length / capacity) * 100));
    return { sold: eventOrders.length, capacity, revenue, percent };
  };

  const urgentOrders = orders.filter(o => o.status === 'PAID' && !o.notified);
  const pendingSubs = users.filter(u => u.subscriptionStatus === 'PENDING');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-40 shadow-2xl">
        <div className="p-8 border-b border-slate-800">
           <h1 className="text-2xl font-black text-white tracking-tight"># <span className="text-amber-500">HASHTAG</span></h1>
           <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Admin Hashtag v4.0</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
           {[
             { id: 'OVERVIEW', icon: LayoutDashboard, label: 'Tableau de Bord' },
             { id: 'EVENTS', icon: TrendingUp, label: 'Guerre (Événements)' },
             { id: 'USERS', icon: Users, label: 'Armée (Organisateurs)' },
             { id: 'SURVEILLANCE', icon: Activity, label: 'Surveillance Flux 👁️' },
             { id: 'SUPPORT', icon: MessageCircle, label: 'Espionnage (Chat)' },
             { id: 'COMMS', icon: Megaphone, label: 'Propagande (Comms)' },
             { id: 'SECURITY', icon: Shield, label: 'Tour de Contrôle 🚨' },
             { id: 'SECURITY_MGMT', icon: Lock, label: 'Accès Terrain 🗝️' },
             { id: 'CONFIG', icon: Settings, label: 'Système' }
           ].map((item) => (
             <button 
               key={item.id}
               onClick={() => setActiveTab(item.id as any)}
               className={`w-full flex items-center gap-3 px-6 py-4 transition-all border-l-4 ${
                 activeTab === item.id ? 'bg-slate-800 border-amber-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
               }`}
             >
               <item.icon size={18} />
               <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
               {item.id === 'OVERVIEW' && (urgentOrders.length > 0 || pendingSubs.length > 0) && (
                 <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
               )}
             </button>
           ))}
           <button onClick={() => setShowScanner(true)} className="w-full flex items-center gap-3 px-6 py-4 transition-all border-l-4 border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50">
              <Zap size={18} />
              <span className="font-bold text-xs uppercase tracking-widest">Scanner QR</span>
           </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={onLogout} className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:text-red-400 font-bold text-xs uppercase transition-colors border border-red-900/30 hover:border-red-500 rounded-lg">
              <LogOut size={16} /> Déconnexion
           </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 overflow-y-auto bg-slate-950">
        
        {activeTab === 'OVERVIEW' && (
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-black text-white mb-6 uppercase flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Megaphone className="text-amber-500"/></div>
              GESTION BANDE FILANTE (Ticker)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
               <div className="lg:col-span-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Message de la bande (Public)</label>
                  <input 
                    value={tickerConfig.text} 
                    onChange={e => setTickerConfig({...tickerConfig, text: e.target.value})} 
                    placeholder="Entrez le message défilant..."
                    className="w-full bg-black/50 border border-slate-700 rounded-xl p-4 text-white focus:border-amber-500 outline-none transition-all" 
                  />
               </div>
               <div className="lg:col-span-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Style Visuel</label>
                  <select 
                    value={tickerConfig.type} 
                    onChange={e => setTickerConfig({...tickerConfig, type: e.target.value as any})} 
                    className="w-full bg-black/50 border border-slate-700 rounded-xl p-4 text-white focus:border-amber-500 outline-none cursor-pointer"
                  >
                     <option value="INFO">INFORMATION (BLEU)</option>
                     <option value="ALERT">ALERTE (ROUGE CLIGNOTANT)</option>
                     <option value="PROMO">PROMOTION (OR)</option>
                  </select>
               </div>
               <div className="lg:col-span-2">
                  <label className="flex items-center gap-3 bg-black/50 border border-slate-700 p-4 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors group">
                     <input 
                       type="checkbox" 
                       checked={tickerConfig.active} 
                       onChange={e => setTickerConfig({...tickerConfig, active: e.target.checked})} 
                       className="w-5 h-5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                     />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Activé</span>
                  </label>
               </div>
               <div className="lg:col-span-1">
                  <button 
                    onClick={saveTicker}
                    className="w-full bg-amber-500 text-black py-4 rounded-xl font-black uppercase text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    DIFFUSER
                  </button>
               </div>
            </div>
            {tickerConfig.active && (
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Aperçu direct :</p>
                <div className={`py-2 overflow-hidden rounded-lg ${tickerConfig.type === 'ALERT' ? 'bg-red-600' : tickerConfig.type === 'PROMO' ? 'bg-yellow-500 text-black' : 'bg-blue-600'}`}>
                   <p className="whitespace-nowrap font-black text-xs uppercase tracking-tighter text-center">{tickerConfig.text || "Aperçu du texte..."}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'SECURITY_MGMT' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-3xl font-black text-white border-l-4 border-red-500 pl-4 uppercase tracking-tighter">GESTION SÉCURITÉ ACCÈS</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Agents Management */}
                 <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <h3 className="text-lg font-black text-white mb-6 uppercase flex items-center gap-2">
                       <UserPlus className="text-blue-500" /> Gestion des Agents
                    </h3>
                    <div className="flex gap-2 mb-6">
                       <input 
                         placeholder="Nom de l'Agent" 
                         value={newAgent.name}
                         onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                         className="flex-1 bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                       />
                       <input 
                         placeholder="PIN" 
                         type="password"
                         maxLength={6}
                         value={newAgent.pin}
                         onChange={e => setNewAgent({...newAgent, pin: e.target.value})}
                         className="w-24 bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 text-center font-mono"
                       />
                       <button onClick={addAgent} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-500 transition-colors">AJOUTER</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                       {securityConfig.agents.map((agent, i) => (
                          <div key={i} className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-slate-800 group">
                             <div>
                                <p className="font-bold text-white text-sm">{agent.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">PIN: ****</p>
                             </div>
                             <button onClick={() => removeAgent(i)} className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       ))}
                       {securityConfig.agents.length === 0 && <p className="text-center py-4 text-slate-600 text-xs italic uppercase">Aucun agent configuré</p>}
                    </div>
                 </div>

                 {/* Zones Management */}
                 <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <h3 className="text-lg font-black text-white mb-6 uppercase flex items-center gap-2">
                       <MapPin className="text-green-500" /> Zones de Contrôle
                    </h3>
                    <div className="flex gap-2 mb-6">
                       <input 
                         placeholder="Nom de la Zone (ex: Porte A)" 
                         value={newZone}
                         onChange={e => setNewZone(e.target.value)}
                         className="flex-1 bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-green-500"
                       />
                       <button onClick={addZone} className="bg-green-600 text-white px-4 rounded-xl font-bold hover:bg-green-500 transition-colors">AJOUTER</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                       {securityConfig.zones.map((zone, i) => (
                          <div key={i} className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-slate-800 group">
                             <p className="font-bold text-white text-sm">{zone}</p>
                             <button onClick={() => removeZone(i)} className="text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       ))}
                       {securityConfig.zones.length === 0 && <p className="text-center py-4 text-slate-600 text-xs italic uppercase">Aucune zone configurée</p>}
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center">
                 <p className="text-xs text-slate-500 uppercase font-bold mb-4">Lien d'accès pour les agents de terrain :</p>
                 <code className="bg-black/50 p-3 rounded-xl text-amber-500 text-sm font-mono block mb-4 truncate select-all">{window.location.origin}/scan-access</code>
                 <Button onClick={() => window.open('/scan-access', '_blank')} variant="glass" className="!text-[10px] !py-2 !px-4">Tester l'Interface Agent</Button>
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className={`rounded-xl p-6 border transition-all ${urgentOrders.length > 0 ? 'bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-white uppercase flex items-center gap-2">
                    <AlertTriangle className={urgentOrders.length > 0 ? "text-red-500 animate-pulse" : "text-slate-500"} />
                    Commandes Non Notifiées ({urgentOrders.length})
                 </h3>
                 <Button variant="glass" className="!py-1 !px-3 !text-[10px]" onClick={() => setActiveTab('EVENTS')}>Gérer</Button>
              </div>
              {urgentOrders.slice(0, 3).map(o => (
                 <div key={o.id} className="text-xs text-slate-300 border-b border-white/10 py-1 flex justify-between">
                    <span>{o.customerName || o.clientName}</span>
                    <span className="font-mono text-amber-500">{o.totalAmount} {o.currency}</span>
                 </div>
              ))}
           </div>
           <div className={`rounded-xl p-6 border transition-all ${pendingSubs.length > 0 ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-slate-800 opacity-50'}`}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-white uppercase flex items-center gap-2">
                    <UserCheck className={pendingSubs.length > 0 ? "text-amber-500 animate-bounce" : "text-slate-500"} />
                    Partenariats en Attente ({pendingSubs.length})
                 </h3>
                 <Button variant="glass" className="!py-1 !px-3 !text-[10px]" onClick={() => setActiveTab('USERS')}>Voir</Button>
              </div>
              {pendingSubs.map(u => (
                 <div key={u.id} className="flex justify-between items-center bg-slate-950 p-2 rounded mb-2 border border-amber-500/30">
                    <div><p className="font-bold text-white text-xs">{u.brandName}</p><p className="text-[10px] text-amber-500">Plan: {u.pendingPlan}</p></div>
                    <div className="flex gap-2"><button onClick={() => handleApproveSubscription(u)} className="px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-500">OK</button></div>
                 </div>
              ))}
           </div>
        </div>

        {activeTab === 'EVENTS' && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black text-white border-l-4 border-amber-500 pl-4">WAR ROOM (Événements)</h2>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                 <table className="w-full text-left">
                    <thead className="bg-black text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                       <tr><th className="p-4">Cible</th><th className="p-4">ÉTAT ACTUEL</th><th className="p-4 text-center">A LA UNE</th><th className="p-4 text-right">ACTIONS IMMÉDIATES</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                       {events.map(ev => {
                          const metrics = getEventStats(ev.id, ev.ticketCapacity);
                          return (
                             <tr key={ev.id} className={`hover:bg-slate-800/30 transition-colors ${ev.status === 'PENDING' ? 'bg-yellow-900/10' : ''}`}>
                                <td className="p-4"><div className="flex items-center gap-3"><div className="w-16 h-16 bg-slate-800 rounded relative overflow-hidden flex-shrink-0"><img src={ev.image} className="w-full h-full object-cover" /></div><div><p className="font-bold text-white truncate max-w-[200px] text-lg">{ev.title}</p><p className="text-[10px] text-slate-500 font-mono mb-1">{ev.organizerEmail}</p><div className="flex gap-2"><span className="text-[10px] bg-slate-800 px-1 rounded text-amber-500">{metrics.revenue}$</span><span className="text-[10px] bg-slate-800 px-1 rounded text-blue-400">{metrics.sold} Ventes</span></div></div></div></td>
                                <td className="p-4">{!ev.status ? <span className="text-red-500 font-bold bg-red-900/20 px-2 py-1 rounded border border-red-500 animate-pulse">⚠️ MANQUANT</span> : ev.status === 'VALIDATED' ? <span className="text-green-500 font-bold bg-green-900/20 px-2 py-1 rounded border border-green-500">✅ ACTIF</span> : <span className="text-yellow-500 font-bold bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500">{ev.status}</span>}</td>
                                <td className="p-4 text-center"><button onClick={(e) => { e.stopPropagation(); toggleFeatured(ev.id, ev.isFeatured); }} className={`p-2 rounded-full transition-all hover:scale-110 ${ev.isFeatured ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-700 hover:text-slate-500'}`}><Star className="w-6 h-6" fill={ev.isFeatured ? "currentColor" : "none"} /></button></td>
                                <td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); toggleApprove(ev.id, ev.status); }} className={`px-4 py-2 font-black text-xs uppercase rounded transform hover:scale-105 transition-all flex items-center gap-2 ${ev.status === 'VALIDATED' ? 'bg-slate-700 text-slate-300' : 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.6)]'}`}><CheckCircle size={16} /> {ev.status === 'VALIDATED' ? 'SUSPENDRE' : 'VALIDER'}</button><button onClick={(e) => { e.stopPropagation(); toggleSoldOut(ev.id, ev.isSoldOut); }} className={`px-3 py-2 border font-bold text-xs uppercase rounded flex items-center gap-2 ${ev.isSoldOut ? 'bg-red-600 text-white border-red-600' : 'border-slate-600 text-slate-400 hover:text-white'}`}>{ev.isSoldOut ? <PlayCircle size={16} /> : <StopCircle size={16} />}{ev.isSoldOut ? "OUVRIR" : "STOP"}</button><button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }} className="px-3 py-2 bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-600 hover:text-white font-bold text-xs uppercase rounded flex items-center gap-2"><Trash2 size={16} /> SUPPR.</button></div></td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'USERS' && (
           <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-black text-white border-l-4 border-amber-500 pl-4">ARMÉE (Organisateurs)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {users.filter(u => u.role === 'organizer').map(user => (
                    <div key={user.id} className={`bg-slate-900 p-6 rounded-xl border transition-all relative ${user.subscriptionStatus === 'PENDING' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-slate-800'}`}>
                       {user.subscriptionStatus === 'PENDING' && <div className="absolute top-2 right-2 bg-amber-500 text-black text-[9px] font-black px-2 py-1 rounded animate-pulse">DEMANDE PARTENARIAT</div>}
                       <h3 className="font-bold text-white text-lg">{user.brandName}</h3>
                       <p className="text-xs text-slate-500 mb-4">{user.email}</p>
                       <div className="flex gap-2 text-xs font-mono text-slate-400 mb-4"><span className="bg-black px-2 py-1 rounded">{user.plan || 'STARTER'}</span><span className={`bg-black px-2 py-1 rounded ${user.verificationStatus === 'VERIFIED' ? 'text-green-500' : 'text-slate-500'}`}>{user.verificationStatus}</span></div>
                       <div className="flex gap-2 items-center">
                          <a href={`https://wa.me/${user.phone}`} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white px-3 py-1.5 rounded font-bold text-[10px] flex items-center gap-1"><MessageCircle size={12}/> WA</a>
                          <button onClick={() => toggleUserBan(user.id, user.status)} className={`px-3 py-1.5 rounded font-black text-[10px] uppercase transition-colors ${user.status === 'BANNED' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{user.status === 'BANNED' ? 'RÉTABLIR' : 'BANNIR'}</button>
                          <button onClick={() => handleDeleteUser(user.id)} className="bg-red-600 text-white px-3 py-1.5 rounded font-black text-[10px] uppercase hover:bg-red-700 transition"><Trash2 size={12}/> SUPPRIMER</button>
                          {user.subscriptionStatus === 'PENDING' && <button onClick={() => handleApproveSubscription(user)} className="px-3 py-1.5 bg-yellow-500 text-black font-black text-[10px] uppercase rounded hover:bg-yellow-400 flex items-center justify-center"><CheckCircle size={12} className="mr-1" /> OK</button>}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'SURVEILLANCE' && (
          <div className="bg-slate-900/80 border border-blue-500/30 p-6 rounded-2xl h-[85vh] overflow-y-auto">
            <h3 className="text-blue-400 font-black mb-6 flex items-center gap-2 uppercase tracking-widest">👁️ LOGS DES TRANSACTIONS (Temps Réel)</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-slate-500 uppercase sticky top-0">
                <tr><th className="p-4">Heure</th><th className="p-4">Code Transaction</th><th className="p-4">Client (Payer)</th><th className="p-4">Destination (Organisateur)</th><th className="p-4">Montant</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(order => {
                  const orgName = users.find(u => u.id === order.organizerId)?.brandName || 'Inconnu';
                  const timestamp = order.createdAt ? (typeof order.createdAt === 'string' ? new Date(order.createdAt).toLocaleTimeString() : (order.createdAt.toDate ? order.createdAt.toDate().toLocaleTimeString() : 'N/A')) : 'N/A';
                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition font-mono">
                      <td className="p-4 text-slate-400">{timestamp}</td>
                      <td className="p-4 font-bold text-yellow-400">{order.transactionCode || order.transactionId || '⚠️ AUCUN CODE'}</td>
                      <td className="p-4 text-white">{order.customerPhone || order.clientPhone} <span className="text-slate-500">({order.customerName || order.clientName})</span></td>
                      <td className="p-4 text-blue-300">{orgName} <span className="text-slate-600 text-[10px]">({order.organizerId})</span></td>
                      <td className="p-4 text-green-400 font-bold">{order.totalAmount || order.amount || 0} {order.currency || '$'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'SUPPORT' && (
           <div className="h-[calc(100vh-150px)] grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                 <div className="p-4 bg-black border-b border-slate-800 font-bold text-white text-sm uppercase">Cibles (Users)</div>
                 <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => (
                       <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors ${selectedChatId === chat.id ? 'bg-slate-800 border-l-4 border-amber-500' : ''}`}>
                          <div className="flex justify-between mb-1"><span className={`font-bold text-sm ${chat.unread ? 'text-white' : 'text-slate-400'}`}>{chat.userName || 'Invité'}</span>{chat.unread && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}</div>
                          <p className="text-xs text-slate-500 truncate font-mono">{chat.lastMessage}</p>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
                 {selectedChatId ? (
                    <>
                       <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {chatMessages.map(msg => (
                             <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-xl max-w-[70%] text-sm ${msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{msg.text}</div></div>
                          ))}
                          <div ref={messagesEndRef} />
                       </div>
                       <form onSubmit={(e) => { e.preventDefault(); if(!adminReply.trim()) return; addDoc(collection(db, `support_chats/${selectedChatId}/messages`), { text: adminReply, sender: 'admin', createdAt: serverTimestamp() }); setDoc(doc(db, 'support_chats', selectedChatId), { lastMessage: adminReply, updatedAt: serverTimestamp(), unread: false }, { merge: true }); setAdminReply(''); }} className="p-4 bg-black border-t border-slate-800 flex gap-2">
                          <input value={adminReply} onChange={(e) => setAdminReply(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="Transmission..." />
                          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg"><Send size={18} /></button>
                       </form>
                    </>
                 ) : <div className="flex items-center justify-center h-full text-slate-600 uppercase font-black tracking-widest text-2xl opacity-20">NO SIGNAL</div>}
              </div>
           </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
            <div className="bg-slate-900/80 border border-red-500/30 p-6 rounded-2xl h-[80vh] overflow-y-auto">
              <h3 className="text-red-500 font-black mb-6 flex items-center gap-2 uppercase tracking-widest">🚨 Tentatives d'intrusion</h3>
              <div className="space-y-3">
                {securityLogs.filter(l => l.type === 'LOGIN_FAIL').map(log => (
                  <div key={log.id} className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl flex justify-between items-center">
                    <div><div className="font-bold text-red-400">{log.email}</div><div className="text-xs text-red-500/60">Mot de passe incorrect</div></div>
                    <div className="text-xs font-mono text-slate-500">{log.timestamp?.toDate().toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900/80 border border-green-500/30 p-6 rounded-2xl h-[80vh] overflow-y-auto">
              <h3 className="text-green-500 font-black mb-6 flex items-center gap-2 uppercase tracking-widest">✅ Nouveaux Soldats</h3>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="bg-green-900/10 border border-green-900/30 p-4 rounded-xl flex justify-between items-center">
                    <div><div className="font-bold text-green-400">{u.brandName || 'Inconnu'}</div><div className="text-xs text-green-500/60">{u.email}</div></div>
                    <div className="text-xs font-mono text-slate-500">USER</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CONFIG' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
               <h2 className="text-2xl font-black text-white mb-6 uppercase flex items-center gap-2"><Globe className="text-amber-500" /> SYSTÈME FINANCIER</h2>
               <div className="space-y-4">
                  {['orangeMoney', 'airtelMoney', 'mpesa', 'exchangeRate'].map(field => (
                     <div key={field}><label className="block text-xs font-bold text-slate-500 uppercase mb-1">{field}</label><input value={(sysConfig as any)[field]} onChange={e => setSysConfig({...sysConfig, [field]: e.target.value})} className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-amber-500 outline-none" /></div>
                  ))}
                  <Button onClick={saveConfig} variant="primary" className="w-full mt-4 !bg-amber-600 !text-black border-none shadow-lg">SAUVEGARDER CONFIG</Button>
               </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
               <h2 className="text-2xl font-black text-white mb-6 uppercase flex items-center gap-2"><Percent className="text-amber-500" /> PARAMÈTRES DE COMMISSION</h2>
               <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frais Fixes USD ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-slate-500" size={16} />
                      <input 
                        type="number" 
                        step="0.01"
                        value={pricingConfig.usd} 
                        onChange={e => setPricingConfig({...pricingConfig, usd: parseFloat(e.target.value) || 0})} 
                        className="w-full bg-black border border-slate-700 rounded p-3 pl-10 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frais Fixes CDF (FC)</label>
                    <input 
                      type="number" 
                      value={pricingConfig.cdf} 
                      onChange={e => setPricingConfig({...pricingConfig, cdf: parseInt(e.target.value) || 0})} 
                      className="w-full bg-black border border-slate-700 rounded p-3 text-white focus:border-amber-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission Variable (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-3 text-slate-500" size={16} />
                      <input 
                        type="number" 
                        value={pricingConfig.percent} 
                        onChange={e => setPricingConfig({...pricingConfig, percent: parseFloat(e.target.value) || 0})} 
                        className="w-full bg-black border border-slate-700 rounded p-3 pl-10 text-white focus:border-amber-500 outline-none" 
                      />
                    </div>
                  </div>
                  <Button onClick={savePricing} variant="primary" className="w-full mt-4 !bg-blue-600 !text-white border-none shadow-lg shadow-blue-900/20">SAUVEGARDER TARIFS</Button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'OVERVIEW' && (
          <div className="mt-8 bg-slate-900 text-green-500 p-6 rounded-xl border border-green-900 shadow-[0_0_30px_rgba(22,163,74,0.1)]">
            <h2 className="text-xl font-mono font-bold mb-4 flex items-center gap-2">📡 RADAR TRAFIC (Dernières Visites)</h2>
            <div className="overflow-x-auto h-80 custom-scrollbar">
              <table className="w-full text-xs font-mono">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="border-b border-green-800 text-green-300">
                    <th className="p-3 text-left">HEURE</th>
                    <th className="p-3 text-left">VILLE / PAYS</th>
                    <th className="p-3 text-left">ADRESSE IP</th>
                    <th className="p-3 text-left">APPAREIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-900/30">
                  {trafficData && trafficData.length > 0 ? trafficData.map((t, i) => (
                    <tr key={i} className="hover:bg-green-900/30 transition group">
                      <td className="p-3 text-green-600 group-hover:text-green-400">
                        {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : 'En cours...'}
                      </td>
                      <td className="p-3 uppercase font-black">
                        {t.city}, {t.country}
                      </td>
                      <td className="p-3 text-slate-500 group-hover:text-slate-300">
                        {t.ip}
                      </td>
                      <td className="p-3 flex items-center gap-2">
                         <Monitor size={14} className="text-green-800" />
                         <span className="truncate max-w-[300px] text-slate-600 group-hover:text-slate-400">
                           {t.device}
                         </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-10 text-center text-green-900 font-black animate-pulse uppercase tracking-[0.5em]">Attente du signal...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      {showScanner && <Scanner onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default AdminDashboard;