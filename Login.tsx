import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import Button from './Button';
import { AlertCircle, ArrowRight, UserPlus } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // LOGIN HANDLER
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Identifiants incorrects. Veuillez réessayer.");
      
      // LOG SECURITY FAIL
      try {
        await addDoc(collection(db, 'security_logs'), {
          type: 'LOGIN_FAIL',
          email: email,
          timestamp: serverTimestamp(),
          details: 'Tentative échouée'
        });
      } catch (logErr) {
        console.error("Security log error:", logErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // REGISTER HANDLER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      const user = userCredential.user;

      // 2. Create Firestore Profile (Organizer)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        brandName: brandName,
        phone: phone,
        role: 'organizer',
        verificationStatus: 'PENDING', // Default to Pending
        createdAt: new Date().toISOString(),
        bio: '',
        logo: '',
        banner: '',
        themeColor: '#6A0DAD'
      });

      alert("Compte Organisateur créé avec succès ! Bienvenue à bord.");
      onSuccess();
    } catch (err: any) {
      console.error("Register Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé.");
      } else {
        setError("Erreur lors de l'inscription. Vérifiez vos informations.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 glass-jewel rounded-[2.5rem] animate-float relative z-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-800 mb-2">
          {isRegistering ? "DEVENIR PARTENAIRE" : "CONNEXION"}
        </h2>
        <div className="w-16 h-1 bg-gradient-royal mx-auto rounded-full"></div>
        <p className="mt-4 text-sm font-semibold text-royal-main/70 uppercase tracking-widest">
          {isRegistering ? "Créez votre Aréna" : "Espace Organisateur"}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold animate-pulse">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isRegistering ? (
        // REGISTER FORM
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-2">Nom de l'Organisation</label>
             <input type="text" required value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl font-medium" placeholder="Ex: Majaabu Gospel" />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-2">Email Professionnel</label>
             <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl font-medium" placeholder="contact@..." />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-2">Téléphone</label>
             <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl font-medium" placeholder="+243..." />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-2">Mot de Passe</label>
             <input type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full px-4 py-3 bg-white/40 border border-white/60 rounded-xl font-medium" placeholder="••••••••" minLength={6} />
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full justify-center">
              {loading ? "Création..." : "Créer mon Compte"}
            </Button>
          </div>
        </form>
      ) : (
        // LOGIN FORM
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2">Email Royal</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white/40 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 focus:bg-white/60 transition-all font-medium text-slate-800 placeholder-slate-400"
              placeholder="exemple@royaume.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2">Code Secret</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/40 border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal-light/50 focus:bg-white/60 transition-all font-medium text-slate-800 placeholder-••••••••"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-4">
            <Button variant="primary" className="w-full justify-center">
              {loading ? "Vérification..." : "Se Connecter"}
            </Button>
          </div>
        </form>
      )}
      
      <div className="mt-8 pt-6 border-t border-white/30 text-center">
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-xs font-bold text-royal-main hover:text-royal-dark transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wide"
        >
          {isRegistering ? "J'ai déjà un compte" : "Pas encore de compte ? Créer un compte"}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default Login;