import React, { useState } from 'react';
import { X, Loader2, LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage, useT } from '../hooks/useLanguage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const { lang, setLang } = useLanguage();
  const t = useT();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || t('loginError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setError('Vérifiez votre email pour confirmer votre compte');
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  if (isLoading) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-stone-800">
                {user ? t('profile') : t('loginTitle')}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 mb-6 p-3 bg-stone-100 rounded-2xl">
              <Globe size={16} className="text-stone-600" />
              <div className="flex gap-2 flex-1">
                {(['fr', 'en', 'ar'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      lang === l
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                  >
                    {l === 'fr' ? t('french') : l === 'en' ? t('english') : t('arabic')}
                  </button>
                ))}
              </div>
            </div>

            {user ? (
              // Logged in state
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <p className="text-sm text-stone-600">{t('connectedAs')}</p>
                  <p className="font-bold text-emerald-700">{user.email || t('user')}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> {t('logout')}
                </button>
              </div>
            ) : (
              // Login state
              <div className="space-y-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-stone-100 text-stone-800 rounded-2xl font-bold hover:bg-stone-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('loading')}</>
                  ) : (
                    <>{t('signInGoogle')}</>
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-stone-500 font-bold uppercase">{lang === 'fr' ? 'ou' : lang === 'en' ? 'or' : 'أو'}</span>
                  </div>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 border-none"
                    disabled={isSubmitting}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 border-none"
                    disabled={isSubmitting}
                  />

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !email || !password}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={18} className="animate-spin" /> {t('processing')}</>
                    ) : isSignUp ? (
                      t('signUp')
                    ) : (
                      t('signInEmail')
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setEmail(''); setPassword(''); }}
                    className="text-sm text-emerald-600 font-bold hover:underline"
                  >
                    {isSignUp ? t('alreadyHaveAccount') : t('createAccount')}
                  </button>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-xs text-stone-600 mb-2">{t('orContinue')}</p>
                  <button
                    onClick={onClose}
                    className="text-xs font-bold text-stone-700 hover:text-stone-900"
                  >
                    {t('guestMode')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
