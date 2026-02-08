import { Link } from 'react-router-dom';

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Hashtag
        </h1>
        <p className="text-gray-500 text-lg">
          Rejoignez la conversation. C'est l'ancien code qui fonctionne !
        </p>
        
        <div className="flex flex-col gap-4 mt-8">
          <Link 
            to="/login" 
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
          >
            Se connecter
          </Link>
          
          <Link 
            to="/register" 
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg border border-blue-600 transition"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
