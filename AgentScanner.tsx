import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { CheckCircle, XCircle, Shield, MapPin, LogOut, AlertTriangle, Loader2 } from 'lucide-react';

const AgentScanner = () => {
  const [accessGranted, setAccessGranted] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{name: string} | null>(null);
  const [selectedZone, setSelectedZone] = useState("");
  const [pin, setPin] = useState("");
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState("Prêt à scanner");
  const [loading, setLoading] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<{agents: any[], zones: string[]}>({agents: [], zones: []});

  // Charger la config sécurité
  useEffect(() => {
    const fetchSecurity = async () => {
      const snap = await getDoc(doc(db, 'settings', 'security'));
      if (snap.exists()) setSecurityConfig(snap.data() as any);
    };
    fetchSecurity();
  }, []);

  const handleLogin = () => {
    const agent = securityConfig.agents.find(a => a.pin === pin);
    if (agent) {
      setSelectedAgent(agent);
      setAccessGranted(true);
    } else {
      alert("PIN INCORRECT ! ACCÈS REFUSÉ.");
      setPin("");
    }
  };

  const handleSOS = async () => {
    if (!selectedAgent || !window.confirm("CONFIRMER L'ENVOI D'UNE ALERTE SOS ?")) return;
    try {
      await addDoc(collection(db, 'security_alerts'), {
        agent: selectedAgent.name,
        zone: selectedZone || "Inconnue",
        timestamp: serverTimestamp(),
        type: 'SOS_EMERGENCY'
      });
      alert("ALERTE SOS ENVOYÉE ! L'ADMINISTRATION A ÉTÉ NOTIFIÉE.");
    } catch(e) {
      alert("Erreur lors de l'envoi de l'alerte.");
    }
  };

  // 1. ÉCRAN PIN
  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-200">
        <div className="bg-slate-800 p-8 rounded-[2rem] border-2 border-amber-500/30 text-center w-full max-w-sm shadow-2xl">
          <Shield size={64} className="mx-auto text-amber-500 mb-6 animate-pulse" />
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">CONTRÔLE D'ACCÈS</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-8 tracking-widest">Veuillez entrer votre code agent</p>
          <input
            type="tel"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            className="w-full bg-black/50 text-white text-center text-4xl tracking-[0.5em] p-6 rounded-2xl border-2 border-slate-700 mb-8 outline-none focus:border-amber-500 transition-all font-mono"
            autoFocus
          />
          <button
            onClick={handleLogin}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-5 rounded-2xl text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            S'IDENTIFIER
          </button>
        </div>
        <p className="mt-8 text-slate-600 font-mono text-[10px] uppercase">ZUA BILLET SECURE SCAN v27</p>
      </div>
    );
  }

  // 2. ÉCRAN ZONE
  if (!selectedZone) {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-200">
            <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 text-center w-full max-w-sm shadow-2xl">
                <MapPin size={48} className="mx-auto text-blue-500 mb-6" />
                <h2 className="text-xl font-black text-white mb-2 uppercase">VOTRE POSITION</h2>
                <p className="text-xs text-slate-500 mb-8">Bonjour <span className="text-white font-bold">{selectedAgent?.name}</span>, où êtes-vous posté ?</p>
                
                <div className="space-y-3 mb-8">
                    {securityConfig.zones.length > 0 ? securityConfig.zones.map(z => (
                        <button 
                            key={z} 
                            onClick={() => setSelectedZone(z)}
                            className="w-full p-4 rounded-xl bg-slate-700 hover:bg-blue-600 text-white font-bold uppercase text-sm transition-all border border-slate-600"
                        >
                            {z}
                        </button>
                    )) : (
                        <p className="text-red-400 text-xs italic">Aucune zone définie par l'admin.</p>
                    )}
                </div>
                
                <button onClick={() => setAccessGranted(false)} className="text-slate-500 font-bold text-xs uppercase flex items-center justify-center gap-2 mx-auto">
                    <LogOut size={14}/> Changer d'agent
                </button>
            </div>
        </div>
    );
  }

  // 3. ÉCRAN SCANNER ACTIF
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[1000]">
      {/* Header Info */}
      <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs border-2 border-white/20">
                {selectedAgent?.name[0]}
            </div>
            <div>
                <p className="text-white font-black text-sm uppercase">{selectedAgent?.name}</p>
                <p className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1"><MapPin size={10}/> {selectedZone}</p>
            </div>
        </div>
        <button onClick={() => window.location.reload()} className="p-3 bg-white/10 rounded-full text-white">
            <LogOut size={20}/>
        </button>
      </div>

      {/* SOS BUTTON */}
      <button 
        onClick={handleSOS}
        className="absolute bottom-10 left-6 z-20 w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl border-4 border-white animate-pulse"
      >
        <AlertTriangle size={32} />
      </button>

      {/* SCANNER AREA */}
      {!scanResult && (
        <div className="w-full max-w-md px-6">
            <div id="reader" className="w-full rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-slate-900"></div>
            <p className="text-center text-slate-500 mt-6 font-mono text-[10px] uppercase tracking-[0.2em]">{message}</p>
        </div>
      )}

      {/* FEEDBACK OVERLAY */}
      {scanResult && (
        <div className={`absolute inset-0 z-[1001] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300 ${scanResult === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8 border-4 border-white/50">
            {scanResult === 'success' ? <CheckCircle size={80} className="text-white" /> : <XCircle size={80} className="text-white" />}
          </div>
          <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-tight">{message}</h2>
          
          <button
            onClick={() => { setScanResult(null); window.location.reload(); }}
            className="bg-white text-black px-12 py-5 rounded-full font-black text-xl shadow-2xl uppercase tracking-widest active:scale-90 transition-all"
          >
            SCANNER LE SUIVANT
          </button>
        </div>
      )}

      <ScannerLogic setRes={setScanResult} setMsg={setMessage} agentName={selectedAgent?.name || "Agent"} zone={selectedZone} />
    </div>
  );
};

const ScannerLogic = ({ setRes, setMsg, agentName, zone }: { setRes: (res: 'success' | 'error' | null) => void, setMsg: (msg: string) => void, agentName: string, zone: string }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: { width: 300, height: 300 } }, false);
    
    scanner.render(async (txt) => {
      const ticketId = txt.replace('ZUA-', '').trim();
      
      try {
        await scanner.clear();
      } catch (e) {
        console.error("Scanner clear error", e);
      }

      try {
        const ref = doc(db, 'orders', ticketId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const d = snap.data();
          const status = d.status?.toLowerCase();

          if (status === 'paid') {
            await updateDoc(ref, { 
                status: 'used', 
                usedAt: serverTimestamp(),
                scannedBy: agentName,
                scanLocation: zone
            });
            setRes('success');
            setMsg(`ACCÈS OK : ${d.clientName || d.customerName || "Invité"}`);
          } else if (status === 'used') {
            const time = d.usedAt?.toDate ? d.usedAt.toDate().toLocaleTimeString() : 'N/A';
            setRes('error');
            setMsg(`DÉJÀ ENTRÉ À ${time} !`);
          } else {
            setRes('error');
            setMsg("PAIEMENT NON VALIDÉ");
          }
        } else {
          setRes('error');
          setMsg("BILLET INVALIDE / INCONNU");
        }
      } catch (e) {
        setRes('error');
        setMsg("ERREUR RÉSEAU");
      }
    }, (err) => { });

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, []);
  
  return null;
};

export default AgentScanner;