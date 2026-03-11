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
    // Auth
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
    // App content
    recentReports: 'Signalements Récents',
    animals: 'animaux',
    radius: 'Rayon:',
    allBreeds: 'Toutes races',
    gpsNotEnabled: 'Position GPS non activée',
    enableGps: 'Activez pour voir les animaux autour de vous.',
    activate: 'Activer',
    noReports: 'Aucun signalement dans cette zone',
    beFirstToReport: 'Augmentez le rayon ou soyez le premier à signaler.',
    pullToRefresh: 'Tirez pour actualiser',
    refreshing: 'Actualisation...',
    release: 'Relâchez',
    newReport: 'Nouveau Signalement',
    reportLostAnimal: '🚨 Signaler un animal perdu',
    helpFindAnimal: 'Aidez-nous à retrouver cet animal !',
    reportPhoto: 'Photo',
    aiWillAnalyze: "(L'IA analysera automatiquement)",
    animalName: 'Nom de l\'animal',
    nameExample: 'Ex: Mimi, Rex, Inconnu...',
    breed: 'Race',
    breedExample: 'Ex: Berger Allemand',
    color: 'Couleur',
    colorExample: 'Ex: Noir et blanc',
    description: 'Description',
    describeAnimal: 'Décrivez l\'animal: taille, signes distinctifs, comportement...',
    descriptionTooShort: 'Description trop courte (min 10 caractères).',
    location: 'Localisation',
    addressOrMaps: 'Adresse ou collez un lien Google Maps',
    useCurrentLocation: 'Navigation',
    selectedPosition: 'Position sélectionnée:',
    phoneNumber: 'Numéro de contact (8 chiffres)',
    phoneExample: '22 123 456',
    publish: 'Publier le signalement',
    publishing: 'Publication en cours...',
    analyzing: 'Analyse IA en cours...',
    photoOfSighting: 'Photo du signalement',
    optional: '(optionnel)',
    describeWhatYouSaw: 'Décrivez ce que vous avez vu',
    whatYouSaw: 'Ex: Vu près du parc, vers 14h, semblait avoir faim...',
    positionOfSighting: 'Position du signalement',
    clickOnMap: '(optionnel - clique sur la carte)',
    mandatoryFields: '(obligatoire)',
    confirmSighting: 'Confirmer le signalement',
    sending: 'Envoi en cours...',
    iSawIt: 'Je l\'ai vu !',
    call: 'Appeler',
    share: 'Partager',
    safe: 'En sécurité',
    stillStray: 'Toujours errant',
    lost: 'Perdu',
    verified: 'Vérifié',
    sawCount: (count: number) => `${count} l'ont vu${count > 1 ? 's' : ''}`,
    ownerNotified: 'propriétaire prévenu',
    positionNotSpecified: 'Position non spécifiée',
    // Languages
    french: 'FR',
    english: 'EN',
    arabic: 'AR',
  },
  en: {
    // Auth
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
    // App content
    recentReports: 'Recent Reports',
    animals: 'animals',
    radius: 'Radius:',
    allBreeds: 'All breeds',
    gpsNotEnabled: 'GPS not enabled',
    enableGps: 'Enable to see animals around you.',
    activate: 'Activate',
    noReports: 'No reports in this area',
    beFirstToReport: 'Increase the radius or be the first to report.',
    pullToRefresh: 'Pull to refresh',
    refreshing: 'Refreshing...',
    release: 'Release',
    newReport: 'New Report',
    reportLostAnimal: '🚨 Report Lost Animal',
    helpFindAnimal: 'Help us find this animal!',
    reportPhoto: 'Photo',
    aiWillAnalyze: '(AI will analyze automatically)',
    animalName: 'Animal Name',
    nameExample: 'Ex: Mimi, Rex, Unknown...',
    breed: 'Breed',
    breedExample: 'Ex: German Shepherd',
    color: 'Color',
    colorExample: 'Ex: Black and white',
    description: 'Description',
    describeAnimal: 'Describe the animal: size, distinctive marks, behavior...',
    descriptionTooShort: 'Description too short (min 10 characters).',
    location: 'Location',
    addressOrMaps: 'Address or paste a Google Maps link',
    useCurrentLocation: 'Navigation',
    selectedPosition: 'Selected position:',
    phoneNumber: 'Phone number (8 digits)',
    phoneExample: '22 123 456',
    publish: 'Publish report',
    publishing: 'Publishing...',
    analyzing: 'AI analysis in progress...',
    photoOfSighting: 'Photo of sighting',
    optional: '(optional)',
    describeWhatYouSaw: 'Describe what you saw',
    whatYouSaw: 'Ex: Seen near the park, around 2pm, seemed hungry...',
    positionOfSighting: 'Position of sighting',
    clickOnMap: '(optional - click on map)',
    mandatoryFields: '(mandatory)',
    confirmSighting: 'Confirm sighting',
    sending: 'Sending...',
    iSawIt: 'I saw it!',
    call: 'Call',
    share: 'Share',
    safe: 'Safe',
    stillStray: 'Still stray',
    lost: 'Lost',
    verified: 'Verified',
    sawCount: (count: number) => `${count} saw it`,
    ownerNotified: 'owner notified',
    positionNotSpecified: 'Position not specified',
    // Languages
    french: 'FR',
    english: 'EN',
    arabic: 'AR',
  },
  ar: {
    // Auth
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
    // App content
    recentReports: 'التقارير الأخيرة',
    animals: 'حيوانات',
    radius: 'نطاق البحث:',
    allBreeds: 'جميع السلالات',
    gpsNotEnabled: 'لم يتم تفعيل نظام تحديد الموقع',
    enableGps: 'فعّل لرؤية الحيوانات حولك.',
    activate: 'تفعيل',
    noReports: 'لا توجد تقارير في هذه المنطقة',
    beFirstToReport: 'زيادة نطاق البحث أو كن أول من يُبلّغ.',
    pullToRefresh: 'اسحب للتحديث',
    refreshing: 'جاري التحديث...',
    release: 'حرر',
    newReport: 'تقرير جديد',
    reportLostAnimal: '🚨 أبلِغ عن حيوان مفقود',
    helpFindAnimal: 'ساعدنا في العثور على هذا الحيوان!',
    reportPhoto: 'صورة',
    aiWillAnalyze: '(سيتم التحليل التلقائي بواسطة الذكاء الاصطناعي)',
    animalName: 'اسم الحيوان',
    nameExample: 'مثال: ميمي، ريكس، غير معروف...',
    breed: 'السلالة',
    breedExample: 'مثال: الراعي الألماني',
    color: 'اللون',
    colorExample: 'مثال: أسود وأبيض',
    description: 'الوصف',
    describeAnimal: 'صف الحيوان: الحجم، العلامات المميزة، السلوك...',
    descriptionTooShort: 'الوصف قصير جداً (10 أحرف على الأقل).',
    location: 'الموقع',
    addressOrMaps: 'العنوان أو رابط Google Maps',
    useCurrentLocation: 'الملاحة',
    selectedPosition: 'الموقع المختار:',
    phoneNumber: 'رقم الهاتف (8 أرقام)',
    phoneExample: '22 123 456',
    publish: 'نشر التقرير',
    publishing: 'جاري النشر...',
    analyzing: 'جاري تحليل الذكاء الاصطناعي...',
    photoOfSighting: 'صورة الرؤية',
    optional: '(اختياري)',
    describeWhatYouSaw: 'صف ما رأيت',
    whatYouSaw: 'مثال: شوهد بالقرب من الحديقة، حوالي الساعة 2 مساءً، بدا جائعاً...',
    positionOfSighting: 'موقع الرؤية',
    clickOnMap: '(اختياري - انقر على الخريطة)',
    mandatoryFields: '(إلزامي)',
    confirmSighting: 'تأكيد الرؤية',
    sending: 'جاري الإرسال...',
    iSawIt: 'شاهدت هذا!',
    call: 'اتصل',
    share: 'مشاركة',
    safe: 'آمن',
    stillStray: 'لا يزال ضائعاً',
    lost: 'مفقود',
    verified: 'موثق',
    sawCount: (count: number) => `${count} شاهده`,
    ownerNotified: 'صاحب الحيوان تم إخطاره',
    positionNotSpecified: 'لم يتم تحديد الموقع',
    // Languages
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
