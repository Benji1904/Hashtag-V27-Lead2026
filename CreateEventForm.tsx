import React, { useState, useRef } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import Button from './Button';
import { 
  X, Calendar, MapPin, Image as ImageIcon, DollarSign, Type, 
  ArrowRight, ArrowLeft, Upload, Smartphone, CheckCircle, ShieldCheck,
  PlusCircle, Trash2, AlignLeft, Coins
} from 'lucide-react';

interface CreateEventFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TicketCategory {
  name: string;
  price: string;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    currency: 'USD', // Default to Dollars
    image: '', // Base64 Compressed
    
    // Receipt Numbers
    phoneOrange: '',
    phoneAirtel: '',
    phoneMpesa: '',
    phoneAfricell: '',
    
    // Dynamic Tickets
    tickets: [{ name: 'Standard', price: '' }] as TicketCategory[],
    
    ticketCapacity: '', // Total capacity for Fee Calculation
    proofOfPayment: '', 
  });

  // --- 1. IMAGE COMPRESSION UTILITY ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Resize Logic
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 60%
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      
      const sizeInBytes = (compressedBase64.length * 3) / 4;
      
      if (sizeInBytes > 900000) { 
        alert("⚠️ Même après compression, l'image est trop lourde. Veuillez choisir une image plus simple.");
        return;
      }

      setFormData(prev => ({ ...prev, image: compressedBase64 }));
    } catch (error) {
      console.error("Compression error", error);
      alert("Erreur lors du traitement de l'image.");
    }
  };

  // --- GENERIC INPUT HANDLER ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- CURRENCY HANDLER ---
  const handleCurrencyChange = (currency: 'USD' | 'FC') => {
    setFormData({ ...formData, currency });
  };

  // --- DYNAMIC TICKET HANDLERS ---
  const handleTicketChange = (index: number, field: keyof TicketCategory, value: string) => {
    const newTickets = [...formData.tickets];
    newTickets[index][field] = value;
    setFormData({ ...formData, tickets: newTickets });
  };

  const addTicketCategory = () => {
    setFormData({ 
      ...formData, 
      tickets: [...formData.tickets, { name: '', price: '' }] 
    });
  };

  const removeTicketCategory = (index: number) => {
    if (formData.tickets.length === 1) return;
    const newTickets = formData.tickets.filter((_, i) => i !== index);
    setFormData({ ...formData, tickets: newTickets });
  };

  // --- NAVIGATION ---
  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    if (!formData.image) {
      alert("L'image est obligatoire.");
      return;
    }
    setLoading(true);

    try {
      await addDoc(collection(db, 'events'), {
        ...formData,
        priceStandard: formData.tickets[0]?.price || '0', // Legacy field for list view
        organizerId: auth.currentUser.uid,
        organizerEmail: auth.currentUser.email,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        feePaid: false
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Erreur: Le fichier est peut-être encore trop lourd ou la connexion a échoué.");
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES ---
  const inputClasses = "w-full pl-10 pr-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 focus:bg-white/70 transition-all font-medium text-slate-800 placeholder-slate-500/70";
  const textareaClasses = "w-full pl-10 pr-4 py-3 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 focus:bg-white/70 transition-all font-medium text-slate-800 placeholder-slate-500/70 resize-none";
  const labelClasses = "block text-xs font-bold text-royal-dark mb-1 ml-1 uppercase tracking-wide";
  const stepBadgeActive = "bg-gradient-royal text-white shadow-candy transform scale-110";
  const stepBadgeInactive = "bg-white/40 text-slate-400 border border-white/50";

  // --- STEP 1: IDENTITY & IMAGE ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="text-center mb-4">
        <h3 className="text-lg font-black text-slate-700 uppercase">1. Identité & Visuel</h3>
      </div>

      {/* Image Upload Area */}
      <div 
        className="w-full h-48 rounded-2xl border-2 border-dashed border-royal-main/30 flex flex-col items-center justify-center cursor-pointer hover:bg-white/20 transition-all relative overflow-hidden group bg-white/10"
        onClick={() => fileInputRef.current?.click()}
      >
        {formData.image ? (
          <>
            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-white font-bold text-sm">Changer l'image (Auto-Compress)</span>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-royal-light/20 rounded-full flex items-center justify-center mx-auto mb-2 text-royal-main">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-600">Cliquez pour ajouter l'affiche</p>
            <p className="text-xs text-slate-400 mt-1">Compression Auto JPEG • Max 800px</p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
      </div>

      {/* Basic Info */}
      <div>
        <label className={labelClasses}>Titre de l'événement</label>
        <div className="relative">
          <Type className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
          <input name="title" required value={formData.title} onChange={handleChange} className={inputClasses} placeholder="Ex: Concert Royal" />
        </div>
      </div>

      {/* NEW: Currency Selector */}
      <div>
        <label className={labelClasses}>Devise de l'événement</label>
        <div className="flex gap-4">
          <button 
            type="button"
            onClick={() => handleCurrencyChange('USD')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              formData.currency === 'USD' 
              ? 'bg-gradient-royal text-white shadow-candy' 
              : 'bg-white/40 text-slate-500 border border-white/60 hover:bg-white/60'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Dollar Américain ($)
          </button>
          <button 
            type="button"
            onClick={() => handleCurrencyChange('FC')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              formData.currency === 'FC' 
              ? 'bg-gradient-royal text-white shadow-candy' 
              : 'bg-white/40 text-slate-500 border border-white/60 hover:bg-white/60'
            }`}
          >
            <Coins className="w-4 h-4" /> Franc Congolais (FC)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
            <input type="date" name="date" required value={formData.date} onChange={handleChange} className={inputClasses} />
          </div>
        </div>
        <div>
          <label className={labelClasses}>Heure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
            <input type="time" name="time" required value={formData.time} onChange={handleChange} className={inputClasses} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClasses}>Lieu</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
          <input name="location" required value={formData.location} onChange={handleChange} className={inputClasses} placeholder="Ex: Pullman Grand Karavia" />
        </div>
      </div>

      {/* NEW: Description Field */}
      <div>
        <label className={labelClasses}>Description Détailleé</label>
        <div className="relative">
          <AlignLeft className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
          <textarea 
            name="description" 
            required 
            value={formData.description} 
            onChange={handleChange} 
            className={`${textareaClasses} h-24`} 
            placeholder="Décrivez votre événement royal..." 
          />
        </div>
      </div>

      {/* Receipt Numbers */}
      <div className="bg-white/30 rounded-xl p-4 border border-white/50">
        <label className="block text-xs font-black text-royal-dark mb-3 uppercase tracking-wide flex items-center gap-2">
          <Smartphone className="w-4 h-4" /> Vos Numéros de Réception (Mobile Money)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="phoneAirtel" value={formData.phoneAirtel} onChange={handleChange} className={inputClasses} placeholder="Airtel Money" />
          <input name="phoneOrange" value={formData.phoneOrange} onChange={handleChange} className={inputClasses} placeholder="Orange Money" />
          <input name="phoneMpesa" value={formData.phoneMpesa} onChange={handleChange} className={inputClasses} placeholder="M-Pesa" />
          <input name="phoneAfricell" value={formData.phoneAfricell} onChange={handleChange} className={inputClasses} placeholder="AfriMoney" />
        </div>
      </div>
    </div>
  );

  // --- STEP 2: DYNAMIC TICKETS ---
  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="text-center mb-4">
        <h3 className="text-lg font-black text-slate-700 uppercase">2. Billets & Mockup</h3>
      </div>

      {/* Dynamic Ticket Categories */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className={labelClasses}>Catégories de Billets</label>
          <button 
            type="button"
            onClick={addTicketCategory}
            className="text-[10px] font-bold text-royal-main hover:text-royal-dark flex items-center gap-1 uppercase bg-white/50 px-2 py-1 rounded-lg"
          >
            <PlusCircle className="w-3 h-3" /> Ajouter une ligne
          </button>
        </div>
        
        {formData.tickets.map((ticket, index) => (
          <div key={index} className="flex gap-2 items-start animate-in fade-in slide-in-from-bottom-2">
            <div className="relative flex-grow">
               <Type className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
               <input 
                 placeholder="Nom (Ex: VIP)" 
                 value={ticket.name}
                 onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                 className={inputClasses}
               />
            </div>
            <div className="relative w-32 md:w-40">
               <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
               <input 
                 type="number"
                 placeholder={`Prix (${formData.currency})`}
                 value={ticket.price}
                 onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                 className={inputClasses}
               />
            </div>
            {formData.tickets.length > 1 && (
              <button 
                type="button"
                onClick={() => removeTicketCategory(index)}
                className="mt-2 text-red-400 hover:text-red-600 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Global Capacity */}
      <div>
        <label className={labelClasses}>Nombre Total de Billets (Capacité)</label>
        <div className="relative">
          <Type className="absolute left-3 top-3.5 w-4 h-4 text-royal-main/60" />
          <input type="number" name="ticketCapacity" required value={formData.ticketCapacity} onChange={handleChange} className={inputClasses} placeholder="Ex: 500" />
        </div>
        <p className="text-[10px] text-slate-500 mt-1 ml-2">Pour le calcul des frais d'activation.</p>
      </div>

      {/* MOCKUP */}
      <div className="mt-6">
        <label className={labelClasses}>Aperçu Aréna (Mockup)</label>
        <div className="mt-2 transform scale-95 origin-top border-4 border-white/40 rounded-[2.8rem] shadow-2xl">
          <div className="relative glass-jewel rounded-[2.5rem] p-4 flex flex-col h-full overflow-hidden bg-white/20">
             <div className="relative h-48 rounded-[2rem] overflow-hidden mb-4 shadow-inner bg-slate-200">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">Aucune image</div>
                )}
                <div className="absolute top-3 right-3 px-4 py-1.5 bg-white/90 backdrop-blur-xl rounded-full text-royal-dark font-black text-xs shadow-lg">
                  {formData.tickets[0]?.price || '0'} {formData.currency}
                </div>
             </div>
             <div className="px-2 text-center">
                <h3 className="text-lg font-bold text-slate-800 mb-2 truncate">{formData.title || "Titre de l'événement"}</h3>
                <div className="w-8 h-1 bg-gradient-royal rounded-full mx-auto mb-3"></div>
                <div className="flex justify-between px-3 py-2 rounded-xl bg-white/40 text-[10px] font-bold text-slate-500 uppercase">
                  <span>{formData.date || "Date"}</span>
                  <span className="truncate max-w-[100px]">{formData.location || "Lieu"}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- STEP 3: MONEY GATE (UPDATED LOGIC) ---
  const renderStep3 = () => {
    const capacity = parseInt(formData.ticketCapacity) || 0;
    
    // Dynamic Fee Logic
    const isUSD = formData.currency === 'USD';
    const feePerTicket = isUSD ? 0.50 : 1000;
    const totalFee = capacity * feePerTicket;

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <div className="text-center mb-4">
          <h3 className="text-lg font-black text-slate-700 uppercase">3. Money Gate (Activation)</h3>
        </div>

        {/* Fee Calculation */}
        <div className="glass-jewel bg-royal-light/10 p-6 rounded-2xl border border-royal-light/30 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Frais d'Activation Zua Billet</p>
          <div className="text-4xl font-black text-royal-dark mb-1">
            {totalFee.toLocaleString()} <span className="text-lg">{isUSD ? 'USD ($)' : 'FC'}</span>
          </div>
          <p className="text-xs text-royal-main/80 font-medium">
            (Calcul : {capacity} billets x {feePerTicket} {isUSD ? '$' : 'FC'})
          </p>
        </div>

        {/* Admin Numbers */}
        <div className="bg-white/40 rounded-2xl p-5 border border-white/60">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-royal-main" />
            <span className="text-xs font-black text-slate-700 uppercase">Envoyez les frais ici :</span>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
               <span className="font-bold text-xs text-orange-600">ORANGE MONEY</span>
               <span className="font-mono font-black text-slate-800 select-all">+243 851 606 236</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
               <span className="font-bold text-xs text-red-600">M-PESA</span>
               <span className="font-mono font-black text-slate-800 select-all">+243 835 973 729</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
               <span className="font-bold text-xs text-red-500">AIRTEL MONEY</span>
               <span className="font-mono font-black text-slate-800 select-all">+243 979 057 287</span>
             </div>
          </div>
        </div>

        {/* Proof of Payment */}
        <div>
          <label className={labelClasses}>ID de Transaction (Preuve)</label>
          <div className="relative">
            <CheckCircle className="absolute left-3 top-3.5 w-4 h-4 text-green-600" />
            <input 
              name="proofOfPayment" 
              required 
              value={formData.proofOfPayment} 
              onChange={handleChange} 
              className={inputClasses} 
              placeholder="Ex: PP230812.1540.H89347"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 ml-2 leading-tight">
            * Votre événement sera validé et mis en ligne après vérification de ce paiement par nos services royaux.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-royal-dark/30 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg glass-jewel rounded-[2.5rem] p-0 animate-float shadow-jewel overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 bg-white/10 border-b border-white/20 relative">
           <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/40 hover:bg-white text-royal-dark transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-black text-slate-800 text-center">CRÉATION ROYALE</h2>
          
          {/* Stepper Dots */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1 ? stepBadgeActive : stepBadgeInactive}`}>1</div>
            <div className="w-8 h-0.5 bg-white/40"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2 ? stepBadgeActive : stepBadgeInactive}`}>2</div>
            <div className="w-8 h-0.5 bg-white/40"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 3 ? stepBadgeActive : stepBadgeInactive}`}>3</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
           {step === 1 && renderStep1()}
           {step === 2 && renderStep2()}
           {step === 3 && renderStep3()}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/30 bg-white/20 flex justify-between items-center gap-4">
          {step > 1 ? (
             <Button variant="glass" onClick={handleBack} className="!px-6">
               <ArrowLeft className="w-4 h-4 mr-1" /> Retour
             </Button>
          ) : (
             <div className="w-24"></div> /* Spacer */
          )}

          {step < 3 ? (
            <Button variant="primary" onClick={handleNext} className="!px-6 shadow-lg">
              Suivant <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} className="!px-8 shadow-candy animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-royal-main via-royal-light to-royal-main">
              {loading ? "Traitement..." : "SOUMETTRE"}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreateEventForm;