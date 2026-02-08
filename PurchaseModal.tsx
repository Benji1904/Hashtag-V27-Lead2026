import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { X, Ticket, User, Smartphone, CheckCircle, Download, CreditCard, Minus, Plus, Copy } from 'lucide-react';
import Button from './Button';

interface TicketCategory {
  name: string;
  price: string;
}

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  currency: string;
  tickets: TicketCategory[];
  organizerId: string;
  phoneAirtel?: string;
  phoneOrange?: string;
  phoneMpesa?: string;
  phoneAfricell?: string;
}

interface PurchaseModalProps {
  event: EventData;
  onClose: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ event, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>(''); 
  const [pricingSettings, setPricingSettings] = useState<any>(null);
  
  // Step 1: Selection
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Step 2: Customer Info
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });

  // Step 3: Payment
  const [transactionId, setTransactionId] = useState('');

  // 1. Charger les tarifs dynamiques avec sécurité
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'pricing'));
        if (snap.exists()) {
          setPricingSettings(snap.data());
        }
      } catch (e) {
        console.warn("Pricing fetch failed, using defaults", e);
      }
    };
    fetchPricing();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const selectedTicket = event.tickets[selectedTicketIndex];
  const ticketPrice = parseInt(selectedTicket.price) || 0;
  const currency = event.currency || 'USD';

  // --- CALCULATRICE SÉCURISÉE (DÉFINIE PAR L'ACTION 2) ---
  // 1. Définir les valeurs par défaut (FILET DE SÉCURITÉ)
  const defaultFees = { usd: 0.5, cdf: 1000, percent: 0 };
  
  // 2. Essayer de récupérer les frais dynamiques (si chargés depuis la DB)
  const currentFees = pricingSettings || defaultFees;

  // 3. Le Calcul avec commissions
  let commission = 0;
  if (currency === 'USD') {
    commission = (currentFees.usd ?? 0.5) + (ticketPrice * (currentFees.percent ?? 0) / 100);
  } else {
    commission = (currentFees.cdf ?? 1000) + (ticketPrice * (currentFees.percent ?? 0) / 100);
  }

  // Prix total incluant les frais de service Zua Billet
  const totalPerTicket = ticketPrice + commission;
  const totalPriceRaw = totalPerTicket * quantity;
  const totalPrice = totalPriceRaw.toLocaleString();

  const handleSubmitOrder = async () => {
    if (!transactionId || transactionId.length < 5) {
      alert("Veuillez entrer un code de transaction valide.");
      return;
    }

    setLoading(true);
    try {
      const currencyToSave = event.currency ? event.currency : 'USD';

      const orderData = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        eventImage: event.image,
        organizerId: event.organizerId,
        
        ticketName: selectedTicket.name,
        ticketPrice: selectedTicket.price,
        serviceFee: commission, // Store the service fee separately
        quantity: quantity,
        totalAmount: totalPriceRaw,
        currency: currencyToSave, 
        
        clientName: customer.name,
        clientPhone: customer.phone,
        clientEmail: customer.email,
        
        transactionId: transactionId,
        status: 'PENDING', 
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setCreatedOrderId(docRef.id); 
      setStep(4); 
    } catch (error) {
      console.error("Order error", error);
      alert("Erreur lors de la commande. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STEPS ---

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right">
      <h3 className="text-lg font-bold text-slate-800">1. Choisissez vos billets</h3>
      
      <div className="space-y-3">
        {event.tickets.map((ticket, idx) => (
          <div 
            key={idx}
            onClick={() => setSelectedTicketIndex(idx)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
              selectedTicketIndex === idx 
                ? 'bg-royal-light/10 border-royal-main shadow-sm' 
                : 'bg-white/40 border-white/60 hover:bg-white/60'
            }`}
          >
            <div>
              <span className={`block font-bold ${selectedTicketIndex === idx ? 'text-royal-dark' : 'text-slate-600'}`}>
                {ticket.name}
              </span>
            </div>
            <span className="font-black text-slate-800">
              {ticket.price} {event.currency}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white/40 p-4 rounded-xl border border-white/60">
        <span className="text-sm font-bold text-slate-600 uppercase">Quantité</span>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-royal-main hover:bg-royal-main hover:text-white transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xl font-black text-slate-800 w-8 text-center">{quantity}</span>
          <button 
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-royal-main hover:bg-royal-main hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
         <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
           <span>Prix Billet(s)</span>
           <span>{(ticketPrice * quantity).toLocaleString()} {event.currency}</span>
         </div>
         <div className="flex justify-between text-xs font-bold text-royal-main uppercase">
           <span>Frais de Service Zua</span>
           <span>{(commission * quantity).toLocaleString()} {event.currency}</span>
         </div>
      </div>

      <div className="text-right">
        <p className="text-xs text-slate-500 uppercase font-bold">Total Net à payer</p>
        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-royal">
          {totalPrice} <span className="text-lg text-slate-400">{event.currency}</span>
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right">
      <h3 className="text-lg font-bold text-slate-800">2. Vos Coordonnées</h3>
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-700 font-medium mb-4">
        Ces informations serviront à générer votre billet et à valider votre paiement.
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Nom complet du propriétaire du billet</label>
          <input 
            value={customer.name}
            onChange={(e) => setCustomer({...customer, name: e.target.value})}
            className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 font-medium"
            placeholder="Ex: Jean Dupont"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Numéro de Téléphone</label>
          <input 
            value={customer.phone}
            onChange={(e) => setCustomer({...customer, phone: e.target.value})}
            className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 font-medium"
            placeholder="Ex: 085..."
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Adresse Email</label>
          <input 
            value={customer.email}
            onChange={(e) => setCustomer({...customer, email: e.target.value})}
            className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 font-medium"
            placeholder="pour recevoir le billet..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right text-center">
      <h3 className="text-lg font-bold text-slate-800">3. Paiement Manuel</h3>
      
      <div className="bg-white/50 p-6 rounded-2xl border border-white/60 text-left">
         <p className="text-xs font-bold text-slate-500 uppercase mb-2 text-center">Envoyez <span className="text-royal-dark text-lg">{totalPrice} {event.currency}</span> à l'un de ces numéros :</p>
         
         <div className="space-y-2 mb-6">
            {event.phoneAirtel && (
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="font-bold text-xs text-red-600">AIRTEL MONEY</span>
                <span className="font-mono font-black text-slate-800 select-all">{event.phoneAirtel}</span>
              </div>
            )}
            {event.phoneOrange && (
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                <span className="font-bold text-xs text-orange-600">ORANGE MONEY</span>
                <span className="font-mono font-black text-slate-800 select-all">{event.phoneOrange}</span>
              </div>
            )}
            {event.phoneMpesa && (
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="font-bold text-xs text-red-600">M-PESA</span>
                <span className="font-mono font-black text-slate-800 select-all">{event.phoneMpesa}</span>
              </div>
            )}
            {!event.phoneAirtel && !event.phoneOrange && !event.phoneMpesa && (
               <p className="text-center text-sm text-slate-500 italic">Aucun numéro configuré. Contactez l'organisateur.</p>
            )}
         </div>

         <div className="border-t border-dashed border-slate-300 pt-4">
           <label className="text-xs font-bold text-royal-main ml-1 uppercase block mb-1">Entrez l'ID de Transaction (Preuve)</label>
           <input 
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-royal-main/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 font-mono font-bold text-center text-slate-800 tracking-widest uppercase placeholder-slate-300"
              placeholder="Ex: PP2308..."
            />
            <p className="text-[10px] text-slate-400 mt-2 text-center leading-tight">
              L'organisateur vérifiera ce code pour valider votre billet.
            </p>
         </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-in zoom-in duration-500 text-center py-8">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-candy">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-1">MERCI {customer.name.split(' ')[0]} !</h3>
        <p className="text-slate-600 font-medium mb-6">
          Votre commande a été envoyée.
        </p>

        <div className="bg-slate-50 border-l-4 border-royal-main p-4 rounded-r-xl text-left max-w-sm mx-auto mb-6 shadow-sm">
           <p className="text-[10px] text-slate-400 uppercase font-bold">Code Transaction Fourni</p>
           <p className="text-sm font-mono font-black text-slate-800">{transactionId}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-left max-w-sm mx-auto">
          <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-2">
            <Ticket className="w-4 h-4" /> Gardez ce code de suivi :
          </h4>
          <div className="bg-white p-2 rounded border border-yellow-200 text-center mb-2">
            <span className="font-mono font-black text-lg tracking-widest text-slate-800 select-all">
              {createdOrderId.substring(0,8).toUpperCase()}
            </span>
          </div>
          <p className="text-[10px] text-yellow-800 leading-relaxed">
            Votre commande est <b>en attente de validation</b> par l'organisateur. Revenez dans le menu "Suivre ma Commande" avec votre numéro pour récupérer le billet une fois validé.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-royal-dark/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40">
          <h2 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
            <Ticket className="w-5 h-5 text-royal-main" /> Billetterie
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer Actions */}
        {step < 4 && (
          <div className="p-6 border-t border-white/50 bg-white/40 flex justify-between gap-4">
            {step > 1 ? (
              <Button variant="glass" onClick={handleBack} className="!px-4">Retour</Button>
            ) : (
              <div></div>
            )}
            
            {step === 3 ? (
              <Button variant="primary" onClick={handleSubmitOrder} className="shadow-candy w-full justify-center">
                {loading ? "Envoi..." : "CONFIRMER PAIEMENT"}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext} className="shadow-lg">
                Continuer
              </Button>
            )}
          </div>
        )}
         {step === 4 && (
            <div className="p-6 border-t border-white/50 bg-white/40 flex justify-center">
               <Button variant="primary" onClick={onClose} className="shadow-candy">
                 Terminer
               </Button>
            </div>
         )}
      </div>
    </div>
  );
};

export default PurchaseModal;