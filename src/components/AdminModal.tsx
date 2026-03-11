import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useT } from '../hooks/useLanguage';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

export default function AdminModal({ isOpen, onClose, onLogin }: AdminModalProps) {
  const t = useT();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (onLogin(password)) {
      setPassword('');
      setError(false);
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-stone-100 rounded-3xl flex items-center justify-center mb-4 text-stone-400">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold text-stone-800">{t('adminAccess')}</h2>
            <p className="text-sm text-stone-500 mt-1">{t('adminPassword')}</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder={t('passwordLabel')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className={`w-full bg-stone-100 border-2 rounded-2xl px-4 py-4 text-center font-mono focus:ring-2 focus:ring-emerald-500 transition-colors ${
                error ? 'border-red-400 bg-red-50' : 'border-transparent'
              }`}
            />
            {error && (
              <p className="text-xs text-red-500 text-center font-bold">{t('incorrectPassword')}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl font-bold text-stone-500 hover:bg-stone-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                {t('login')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
