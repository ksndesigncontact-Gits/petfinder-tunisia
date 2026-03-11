import { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'fr' | 'en' | 'ar';

const LanguageContext = createContext<{ lang: Language; setLang: (lang: Language) => void } | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('petfinder_lang');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('petfinder_lang', lang);
    document.documentElement.lang = lang;
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// Translation dictionary
export const translations = {
  fr: {
    loginTitle: 'Se connecter',
    profile: 'Profil',
    logout: 'Se déconnecter',
    logoutShort: 'Déco',
    selectLanguage: 'Choisir la langue',
    signInGoogle: '🔐 Se connecter avec Google',
    signInEmail: 'Se connecter',
    signUp: "S'inscrire",
    alreadyHaveAccount: "J'ai déjà un compte",
    createAccount: 'Créer un compte',
    guestMode: 'Sans compte 👤',
    orContinue: 'Ou continuer',
    loading: 'Chargement...',
    processing: 'Traitement...',
    connectedAs: 'Connecté en tant que :',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Mot de passe',
    french: 'FR',
    english: 'EN',
    arabic: 'AR',
  },
  en: {
    loginTitle: 'Sign In',
    profile: 'Profile',
    logout: 'Sign Out',
    logoutShort: 'Logout',
    selectLanguage: 'Select Language',
    signInGoogle: '🔐 Sign In with Google',
    signInEmail: 'Sign In',
    signUp: 'Sign Up',
    alreadyHaveAccount: 'Already have an account',
    createAccount: 'Create account',
    guestMode: 'Without account 👤',
    orContinue: 'Or continue',
    loading: 'Loading...',
    processing: 'Processing...',
    connectedAs: 'Connected as:',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    french: 'FR',
    english: 'EN',
    arabic: 'AR',
  },
  ar: {
    loginTitle: 'تسجيل الدخول',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    logoutShort: 'خروج',
    selectLanguage: 'اختر اللغة',
    signInGoogle: '🔐 تسجيل الدخول باستخدام Google',
    signInEmail: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    alreadyHaveAccount: 'لديك حساب بالفعل',
    createAccount: 'إنشاء حساب',
    guestMode: 'بدون حساب 👤',
    orContinue: 'أو متابعة',
    loading: 'جاري التحميل...',
    processing: 'جاري المعالجة...',
    connectedAs: 'مسجل الدخول بـ:',
    emailPlaceholder: 'البريد الإلكتروني',
    passwordPlaceholder: 'كلمة المرور',
    french: 'FR',
    english: 'EN',
    arabic: 'AR',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

export function useT() {
  const { lang } = useLanguage();
  return (key: TranslationKey): string => {
    return translations[lang][key] || translations.fr[key];
  };
}
