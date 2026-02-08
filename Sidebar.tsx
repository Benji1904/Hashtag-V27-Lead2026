import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="hidden md:flex flex-col gap-4 p-4 w-64 fixed left-0 h-full border-r bg-white pt-20">
      <Link to="/" className="font-bold text-lg hover:bg-gray-100 p-2 rounded">🏠 Accueil</Link>
      <Link to="/explore" className="font-bold text-lg hover:bg-gray-100 p-2 rounded">🔍 Explorer</Link>
      <Link to="/notifications" className="font-bold text-lg hover:bg-gray-100 p-2 rounded">🔔 Notifications</Link>
    </div>
  );
}
