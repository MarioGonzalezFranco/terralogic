import { Search, Bell, Settings } from 'lucide-react';

export default function Navbar() {
  // Recuperamos la sesión para personalizar la bienvenida
  const userJson = sessionStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { name: 'Mario Enrique', role: 'Productor' };

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 z-40">
      {/* Buscador de Precisión */}
      <div className="relative w-96">
        <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
          <Search size={18} />
        </span>
        <input 
          type="text" 
          placeholder="Buscar campos o análisis..."
          className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-agri-green-500/20 transition-all outline-none"
        />
      </div>

      {/* Acciones y Perfil */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors relative group">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
          </button>
          <button className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors">
            <Settings size={20} />
          </button>
        </div>

        <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-agri-green-950 leading-none">{user.name}</p>
            <p className="text-[10px] font-bold text-agri-green-600 uppercase tracking-widest mt-1.5">
              {user.role}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-agri-green-100 border border-agri-green-200 flex items-center justify-center text-agri-green-700 font-bold shadow-sm overflow-hidden">
             <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=dcfce7&color=15803d&bold=true`} 
              alt="Avatar" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}