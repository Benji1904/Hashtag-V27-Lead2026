import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Send, X, ShieldCheck } from 'lucide-react';

interface LiveChatSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveChatSystem: React.FC<LiveChatSystemProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // LOGIQUE ISOLÉE : Génération d'un ID unique pour invité
  const generateRandomId = () => 'guest_' + Math.random().toString(36).substring(2, 11);

  useEffect(() => {
    const initChat = async () => {
      // Mission 1 : ID unique Utilisateur ou Invité (localStorage persistence)
      let currentId = auth.currentUser?.uid;
      
      if (!currentId) {
        const stored = localStorage.getItem('guest_support_id');
        if (stored) {
          currentId = stored;
        } else {
          currentId = generateRandomId();
          localStorage.setItem('guest_support_id', currentId);
        }
      }
      setChatId(currentId);
    };
    initChat();
  }, [auth.currentUser]);

  // Écoute des messages dans la collection isolée demandée
  useEffect(() => {
    if (!chatId || !isOpen) return;

    // Pointe vers : collection('support_chats').doc(chatId).collection('messages')
    const q = query(collection(db, `support_chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [chatId, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const text = newMessage;
    setNewMessage('');

    try {
      // 1. Ajouter le message dans la sous-collection messages
      await addDoc(collection(db, `support_chats/${chatId}/messages`), {
        text,
        sender: 'user',
        createdAt: serverTimestamp()
      });

      // 2. Mettre à jour les métadonnées pour l'admin dashboard
      await setDoc(doc(db, 'support_chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        userName: auth.currentUser?.email || 'Invité Anonyme',
        userId: chatId,
        unread: true 
      }, { merge: true });

    } catch (error) {
      console.error("Chat Error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop grisé (fixed inset-0 bg-black/50) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal Centrée */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 h-[600px]">
        
        {/* Header de la Modal */}
        <div className="bg-slate-950 p-6 border-b border-white/5 border-t border-t-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-royal-main/20 flex items-center justify-center text-royal-light border border-royal-light/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white font-black text-sm uppercase tracking-tighter">Support Technique</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Opérateurs en ligne</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Zone de Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/50 custom-scrollbar">
          <div className="flex justify-center">
            <span className="text-[9px] text-slate-500 uppercase font-black bg-white/5 px-3 py-1 rounded-full border border-white/5 tracking-[0.2em]">Conversation Sécurisée</span>
          </div>

          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none text-sm max-w-[85%] border border-white/5 shadow-xl">
              Bienvenue sur le support interne Zua Billet. Comment pouvons-nous vous assister aujourd'hui ?
            </div>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-2xl border ${
                msg.sender === 'user' 
                ? 'bg-gradient-royal text-white rounded-tr-none border-white/10' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border-white/5'
              }`}>
                {msg.sender === 'admin' && (
                  <p className="text-[9px] text-yellow-500 font-black mb-1 uppercase tracking-widest">Officier Support</p>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Zone de Saisie */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-white/5 flex gap-3">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Décrivez votre problème..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-royal-light transition-all placeholder-slate-600"
          />
          <button 
            type="submit" 
            className="w-14 h-14 bg-gradient-royal rounded-2xl text-white flex items-center justify-center shadow-candy hover:brightness-110 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveChatSystem;