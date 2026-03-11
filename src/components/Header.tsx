import React from 'react';
import { PawPrint, MapPin as MapIcon, LayoutGrid, ShieldCheck, X, LogIn } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  onLogoClick: () => void;
  onAuthClick: () => void;
}

export default function Header({ viewMode, setViewMode, isAdmin, setIsAdmin, onLogoClick, onAuthClick }: HeaderProps) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-[1000] glass px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onLogoClick}>
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <PawPrint size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-xl tracking-tight leading-none">
            PetFinder <span className="text-red-600">Tunisia</span> 🇹🇳
          </h1>
          {isAdmin && (
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
              <ShieldCheck size={10} /> Mode Admin
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-bold">
            ✓ {user.email?.split('@')[0]}
          </div>
        )}
        {isAdmin && (
          <>
            <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-red-100 animate-pulse">
              <ShieldCheck size={12} /> ADMIN
            </div>
            <button
              onClick={() => setIsAdmin(false)}
              className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              title="Quitter le mode Admin"
            >
              <X size={18} />
            </button>
          </>
        )}
        <button
          onClick={onAuthClick}
          className="flex items-center gap-2 px-4 py-2 text-stone-700 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-all active:scale-95 border border-stone-200 shadow-sm"
          title={user ? 'Gérer le compte' : 'Se connecter'}
        >
          <LogIn size={18} className="text-emerald-600" />
          <span className="text-sm font-bold">LOG IN</span>
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 px-4 py-2 text-stone-700 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-all active:scale-95 border border-stone-200 shadow-sm"
        >
          {viewMode === 'list' ? (
            <>
              <MapIcon size={18} className="text-emerald-600" />
              <span className="text-sm font-bold">Carte</span>
            </>
          ) : (
            <>
              <LayoutGrid size={18} className="text-emerald-600" />
              <span className="text-sm font-bold">Liste</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
