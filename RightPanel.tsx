export default function RightPanel() {
  return (
    <div className="hidden lg:block w-80 fixed right-0 h-full border-l bg-white pt-20 p-4">
      <h3 className="font-bold text-gray-500 mb-4">Tendances</h3>
      <div className="space-y-2">
        <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">#HashtagV27</div>
        <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">#Developpement</div>
      </div>
    </div>
  );
}
