export default function Feed() {
  return (
    <div className="flex-1 md:ml-64 lg:mr-80 pt-20 p-4 min-h-screen">
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="font-bold mb-2">Quoi de neuf ?</h2>
        <textarea className="w-full border p-2 rounded" placeholder="Exprime-toi..."></textarea>
      </div>
      {/* Les posts s'afficheront ici */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <p>Le site est en ligne ! ✅</p>
        </div>
      </div>
    </div>
  );
}
