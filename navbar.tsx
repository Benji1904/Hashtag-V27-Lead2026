import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white border-b fixed w-full top-0 z-50 px-4 py-2 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">Hashtag</Link>
      <div>
        <Link to="/login" className="px-4 py-2 text-gray-600">Connexion</Link>
      </div>
    </nav>
  );
}
