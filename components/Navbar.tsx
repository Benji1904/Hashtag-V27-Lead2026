import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white border-b p-4 mb-4 flex justify-between">
      <h1 className="font-bold text-xl">Hashtag</h1>
      <Link to="/login" className="text-blue-500">Connexion</Link>
    </nav>
  );
}
