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
    selectLanguage: 'Choisir la langue',
    french: 'Français',
    english: 'English',
    arabic: 'العربية',
  },
  en: {
    loginTitle: 'Sign In',
    profile: 'Profile',
    logout: 'Sign Out',
    selectLanguage: 'Select Language',
    french: 'Français',
    english: 'English',
    arabic: 'العربية',
  },
  ar: {
    loginTitle: 'تسجيل الدخول',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    selectLanguage: 'اختر اللغة',
    french: 'Français',
    english: 'English',
    arabic: 'العربية',
  },
};
