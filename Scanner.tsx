import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, CheckCircle, XCircle } from 'lucide-react';

const Scanner = ({ onClose }: { onClose: () => void }) => {
  const [scanResult, setScanResult] = useState<null | 'success' | 'error'>(null);
  const [message, setMessage] = useState("Placez le QR Code face à la caméra");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    const onScanSuccess = async (decodedText: string) => {
      // Nettoyage du préfixe si présent (ex: ZUA-ID)
      const ticketId = decodedText.replace('ZUA-', '');
      
      try {
        // Arrête le scan pendant le traitement
        await scanner.clear();
      } catch (e) {
        console.error("Scanner clear error", e);
      }

      try {
        const ref = doc(db, 'orders', ticketId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          const status = data.status?.toLowerCase();

          if (status === 'paid') {
            await updateDoc(ref, { 
              status: 'used', 
              usedAt: serverTimestamp() 
            });
            setScanResult('success');
            setMessage(`✅ VALIDÉ : ${data.clientName || data.customerName}`);
          } else if (status === 'used') {
            setScanResult('error');
            setMessage("⚠️ DÉJÀ UTILISÉ !");
          } else {
            setScanResult('error');
            setMessage("❌ BILLET INVALIDE");
          }
        } else {
          setScanResult('error');
          setMessage("🚫 BILLET INCONNU");
        }
      } catch (err) {
        setScanResult('error');
        setMessage("Erreur de connexion");
      }
    };

    const onScanFailure = (error: any) => {
      // Ignorer les erreurs de scan continues (non-détection)
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"
      >
        <X size={24}/>
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        {/* ZONE CAMERA */}
        {!scanResult && (
          <div id="reader" className="w-full"></div>
        )}

        {/* RÉSULTAT */}
        {scanResult && (
          <div className={`p-8 flex flex-col items-center justify-center text-center min-h-[300px] ${scanResult === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {scanResult === 'success' ? (
              <CheckCircle size={80} className="text-white mb-4 animate-bounce"/>
            ) : (
              <XCircle size={80} className="text-white mb-4 animate-pulse"/>
            )}
            
            <h2 className="text-3xl font-black text-white mb-2">
              {scanResult === 'success' ? 'ACCÈS AUTORISÉ' : 'ACCÈS REFUSÉ'}
            </h2>
            
            <p className="text-white font-bold text-lg mb-8">{message}</p>
            
            <button 
              onClick={() => { 
                setScanResult(null); 
                setMessage("Prêt"); 
                window.location.reload(); 
              }} 
              className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg uppercase tracking-wider transform active:scale-95 transition-all"
            >
              Scanner le suivant
            </button>
          </div>
        )}
      </div>

      <p className="text-slate-500 mt-8 font-mono text-xs uppercase tracking-widest">
        SCANNER ADMIN V27
      </p>
    </div>
  );
};

export default Scanner;