import React, { useState, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Search, Loader2, Download, Printer, CheckCircle, Clock, XCircle } from 'lucide-react';
import Button from './Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Order {
  id: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  ticketName: string;
  clientName: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  totalAmount: number;
  currency: string;
  createdAt: string;
}

const TrackingView: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Order | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
        alert("Veuillez entrer un numéro valide.");
        return;
    }
    setLoading(true);
    setSearched(true);
    setOrders([]);

    try {
      const q = query(collection(db, 'orders'), where('clientPhone', '==', phone));
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort by date manually
      ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setOrders(ordersList);
    } catch (error) {
      console.error("Tracking Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadTicketPDF = async (ticketId: string, elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Billet-${ticketId}.pdf`);
    } catch (err) {
      console.error("PDF Download error:", err);
      alert("Erreur lors du téléchargement du PDF.");
    }
  };

  // --- RENDER TICKET (PRINTABLE) ---
  if (selectedTicket) {
     return (
        <div className="fixed inset-0 z-[200] bg-slate-900 overflow-y-auto">
           {/* Screen Controls */}
           <div className="fixed top-0 left-0 w-full p-4 flex justify-between items-center bg-white/10 backdrop-blur-md z-50 no-print">
              <button onClick={() => setSelectedTicket(null)} className="text-white hover:text-gray-300 font-bold flex items-center gap-2">
                 <XCircle /> Fermer
              </button>
              <div className="flex gap-2">
                <Button variant="primary" onClick={handlePrint} className="!py-2 !px-6 shadow-candy">
                   <Printer className="w-4 h-4" /> IMPRIMER
                </Button>
              </div>
           </div>

           {/* The Ticket Container */}
           <div className="min-h-screen flex flex-col items-center justify-center p-4">
              <div className="print-area">
                <div 
                  id={`ticket-card-${selectedTicket.id}`}
                  className="bg-white text-slate-900 w-full max-w-[350px] md:max-w-[800px] md:h-[350px] rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border-4 border-yellow-500 relative"
                >
                  
                  {/* Decorative Corner */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-royal-main rounded-tl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-royal-main rounded-br-xl"></div>

                  {/* Left/Top: Image & Event */}
                  <div className="w-full md:w-1/3 h-48 md:h-full relative bg-slate-100">
                      <img src={selectedTicket.eventImage} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-royal-dark/80 to-transparent flex flex-col justify-end p-6">
                        <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase mb-1">{selectedTicket.eventTitle}</h2>
                        <p className="text-white/80 font-medium text-xs flex items-center gap-1"><Clock className="w-3 h-3"/> {selectedTicket.eventDate}</p>
                      </div>
                  </div>

                  {/* Right/Bottom: Ticket Details */}
                  <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col justify-between bg-royal-mesh">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Invité</p>
                            <h3 className="text-xl font-bold text-slate-800">{selectedTicket.clientName}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Billet</p>
                            <div className="inline-block px-3 py-1 bg-royal-main text-white text-xs font-black rounded-full uppercase">
                              {selectedTicket.ticketName}
                            </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 border-dashed border-slate-300 pt-6">
                          <div className="text-center md:text-left space-y-1">
                            <p className="text-xs font-bold text-slate-500">{selectedTicket.eventLocation}</p>
                            <p className="text-xs text-slate-400">ID: {selectedTicket.id.substring(0,8).toUpperCase()}</p>
                            <p className="text-[10px] text-green-600 font-bold flex items-center justify-center md:justify-start gap-1 mt-2">
                                <CheckCircle className="w-3 h-3"/> PAIEMENT VALIDÉ
                            </p>
                          </div>
                          
                          {/* QR Code */}
                          <div className="flex flex-col items-center">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ZUA-${selectedTicket.id}`} 
                                alt="QR" 
                                className="w-24 h-24 mix-blend-multiply border-2 border-white shadow-sm"
                              />
                              <span className="text-[8px] font-mono text-slate-400 mt-1">SCAN ME</span>
                          </div>
                      </div>
                  </div>
                </div>
              </div>

              {/* PDF DOWNLOAD BUTTON - Under Ticket */}
              <div className="w-full max-w-[350px] md:max-w-[800px] mt-6 no-print">
                <button 
                  onClick={() => downloadTicketPDF(selectedTicket.id, `ticket-card-${selectedTicket.id}`)}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg uppercase tracking-widest"
                >
                  <Download className="w-4 h-4" /> 📥 TÉLÉCHARGER LE PDF
                </button>
              </div>
           </div>
        </div>
     );
  }

  // --- RENDER FORM & LIST ---
  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
       <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
             <h1 className="text-3xl font-black text-slate-800 mb-2">SUIVRE MA COMMANDE</h1>
             <div className="w-16 h-1 bg-gradient-royal mx-auto rounded-full"></div>
             <p className="mt-4 text-slate-500">Entrez votre numéro pour récupérer vos billets.</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-4 mb-12 max-w-md mx-auto relative z-10">
             <input 
               type="text" 
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
               placeholder="Votre Numéro (ex: 085...)" 
               className="flex-1 px-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-royal-main/50 outline-none font-bold text-slate-700"
             />
             <Button variant="primary" className="!px-6 shadow-xl">
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
             </Button>
          </form>

          {searched && !loading && orders.length === 0 && (
             <div className="text-center text-slate-400 py-10 glass-jewel rounded-3xl">
                Aucune commande trouvée pour ce numéro.
             </div>
          )}

          <div className="space-y-4">
             {orders.map((order) => (
                <div key={order.id} className="glass-jewel p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6 transition-all hover:bg-white/60">
                   <div className="w-full sm:w-24 h-24 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0">
                      <img src={order.eventImage} className="w-full h-full object-cover" />
                   </div>
                   
                   <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-slate-800">{order.eventTitle}</h3>
                      <p className="text-xs text-slate-500 mb-2">{order.eventDate}</p>
                      <span className="inline-block px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider text-slate-600">
                         {order.ticketName} (x1)
                      </span>
                   </div>

                   <div className="text-center">
                      {order.status === 'PENDING' && (
                         <div className="flex flex-col items-center text-yellow-600">
                            <Clock className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-black uppercase">En attente</span>
                         </div>
                      )}
                      {order.status === 'PAID' && (
                         <Button variant="primary" onClick={() => setSelectedTicket(order)} className="!py-2 !px-4 !text-xs shadow-md">
                            <Download className="w-4 h-4" /> VOIR MON BILLET
                         </Button>
                      )}
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default TrackingView;