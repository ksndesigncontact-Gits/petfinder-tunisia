import React, { useState } from 'react';
import { MapPin as MapIcon, LayoutGrid, ShieldCheck, X, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { useT } from '../hooks/useLanguage';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  onLogoClick: () => void;
  onAuthClick: () => void;
}

export default function Header({ viewMode, setViewMode, isAdmin, setIsAdmin, onLogoClick, onAuthClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const t = useT();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-[1000] glass px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onLogoClick}>
        <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight leading-none">
          PetFinder <span className="text-red-600">Tunisia</span> 🇹🇳
        </h1>
        {isAdmin && (
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1 ml-2">
            <ShieldCheck size={10} /> {t('adminMode')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isAdmin && (
          <>
            <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-red-100 animate-pulse">
              <ShieldCheck size={12} /> ADMIN
            </div>
            <button
              onClick={() => setIsAdmin(false)}
              className="p-2 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              title={t('exitAdminMode')}
            >
              <X size={18} />
            </button>
          </>
        )}

        {/* User Menu or Login */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-all active:scale-95 border border-stone-200 shadow-sm whitespace-nowrap text-sm"
            >
              <span className="font-bold">{user.email?.split('@')[0]}</span>
              <ChevronDown size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-stone-200 z-[1001] overflow-hidden"
                >
                  <div className="p-4 border-b border-stone-200">
                    <p className="text-xs text-stone-500 font-bold">{t('connectedAs')}</p>
                    <p className="text-sm font-bold text-stone-800 break-all">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-bold"
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-stone-600 hover:bg-stone-50 transition-colors border-t border-stone-200"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="flex items-center gap-1 px-3 py-2 text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-all active:scale-95 border border-stone-200 shadow-sm text-sm font-bold"
            title={t('loginTitle')}
          >
            <LogIn size={14} className="text-emerald-600" />
            {t('loginTitle')}
          </button>
        )}
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 px-3 py-2 text-stone-700 bg-stone-100 rounded-2xl hover:bg-stone-200 transition-all active:scale-95 border border-stone-200 shadow-sm text-sm sm:text-base whitespace-nowrap"
        >
          {viewMode === 'list' ? (
            <>
              <MapIcon size={18} className="text-emerald-600" />
              <span className="text-sm font-bold">{t('map')}</span>
            </>
          ) : (
            <>
              <LayoutGrid size={18} className="text-emerald-600" />
              <span className="text-sm font-bold">{t('list')}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
