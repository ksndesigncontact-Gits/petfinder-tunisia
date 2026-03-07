import React, { useState, useRef, useCallback } from 'react';
import {
  Search, Plus, MessageCircle, X, Loader2, PawPrint, RefreshCw, Navigation, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from './lib/utils';
import { haversineKm } from './utils/matching';
import { useGeolocation } from './hooks/useGeolocation';
import { usePets } from './hooks/usePets';
import type { Pet, Match } from './types';

// Components
import Header from './components/Header';
import PetCard from './components/PetCard';
import MatchCard from './components/MatchCard';
import MatchDetail from './components/MatchDetail';
import ReportFormModal from './components/ReportForm';
import AdminModal from './components/AdminModal';
import DbSetupBanner from './components/DbSetupBanner';

// Fix Leaflet icons
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

// Admin password — in production, validate server-side only
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hatemgomez';

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, 13);
    setTimeout(() => map.invalidateSize(), 100);
  }, [center, map]);
  return null;
}

export default function App() {
  // State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showWhatsAppBanner, setShowWhatsAppBanner] = useState(true);
  const [newMatchNotify, setNewMatchNotify] = useState<Match | null>(null);

  // Pull to refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);

  // Hooks
  const geo = useGeolocation();
  const {
    filteredPets, filteredMatches, dbStatus, isLoading, myReports,
    addMyReport, fetchPets, fetchMatches, fetchDbStatus, refresh, getPetMatch,
  } = usePets(geo.location, radiusKm);

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
      setIsPulling(true);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const diff = e.touches[0].pageY - startY.current;
    if (diff > 0) setPullDistance(Math.min(diff * 0.4, 80));
  };
  const handleTouchEnd = async () => {
    if (pullDistance > 50) {
      setIsRefreshing(true);
      await refresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  // Logo click → admin
  const handleLogoClick = () => {
    const n = clickCount + 1;
    setClickCount(n);
    if (n >= 5) { setShowAdminLogin(true); setClickCount(0); }
  };

  // WhatsApp share — FRENCH
  const shareToWhatsApp = (pet: Pet) => {
    const contact = pet.contact === 'Anonyme' ? 'Signalement anonyme' : pet.contact;
    const text =
      `🚨 ${pet.type === 'lost' ? 'ANIMAL PERDU' : 'ANIMAL TROUVÉ'} 🚨\n\n` +
      `${pet.species === 'dog' ? '🐶 Chien' : '🐱 Chat'}${pet.breed ? ` · ${pet.breed}` : ''}\n` +
      `Couleur: ${pet.color || 'Non précisée'}\n` +
      `📍 ${pet.location || 'Position non précisée'}\n` +
      `📝 ${pet.description || ''}\n` +
      `📞 ${contact}\n\n` +
      `Aidez-nous à retrouver cet animal ! Partagé via PetFinder Tunisia 🇹🇳`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Submit report
  const handleReportSubmit = async (formData: FormData) => {
    const res = await fetch('/api/pets', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur serveur');
    }
    const data = await res.json();
    if (data.id) addMyReport(data.id);
    showToast('✅ Signalement publié !');
    fetchPets();
    fetchMatches();
  };

  // Match actions
  const handleMatchStatus = async (matchId: number, status: 'confirmed' | 'rejected') => {
    try {
      const res = await fetch(`/api/matches/${matchId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchMatches();
        setSelectedMatch(null);
      }
    } catch (err) {
      console.error('Failed to update match:', err);
    }
  };

  // Delete pet (admin)
  const handleDelete = async (id: number | string) => {
    try {
      const res = await fetch(`/api/pets/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': ADMIN_PASSWORD },
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.deletedCount > 0 ? '✅ Supprimé' : '⚠️ Déjà supprimé');
        fetchPets();
      } else {
        const err = await res.json();
        alert(`❌ ${err.error}`);
      }
    } catch {
      alert('❌ Erreur réseau');
    }
  };

  // Admin login
  const handleAdminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const mapCenter: [number, number] = geo.location || [36.8065, 10.1815];

  return (
    <div
      className="min-h-screen bg-stone-50 pb-24 text-stone-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh */}
      <motion.div
        animate={{ height: pullDistance }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="overflow-hidden flex items-center justify-center bg-stone-100/50 border-b border-stone-200/50"
      >
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
          <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin', pullDistance > 50 && !isRefreshing && 'rotate-180 transition-transform')} />
          {isRefreshing ? 'Actualisation...' : pullDistance > 50 ? 'Relâchez' : 'Tirez pour actualiser'}
        </div>
      </motion.div>

      {/* Match notification */}
      <AnimatePresence>
        {newMatchNotify && (
          <motion.div
            initial={{ opacity: 0, y: -100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-[3000] bg-emerald-600 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <PawPrint size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Match Potentiel Trouvé ! 🐾</p>
              <p className="text-[10px] opacity-90">Un animal correspondant a été détecté à proximité.</p>
            </div>
            <button onClick={() => { setSelectedMatch(newMatchNotify); setNewMatchNotify(null); }}
              className="bg-white text-emerald-600 px-3 py-2 rounded-xl text-[10px] font-bold">Voir</button>
            <button onClick={() => setNewMatchNotify(null)} className="p-2 hover:bg-white/10 rounded-xl"><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[3000] bg-stone-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header
        viewMode={viewMode} setViewMode={setViewMode}
        isAdmin={isAdmin} setIsAdmin={setIsAdmin}
        onLogoClick={handleLogoClick}
      />

      {/* WhatsApp banner */}
      {showWhatsAppBanner && (
        <div className="bg-emerald-600 px-6 py-2 flex items-center justify-between text-white text-[11px] font-bold">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} />
            <span>Rejoignez notre communauté WhatsApp pour aider les animaux 🐾</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open('https://chat.whatsapp.com/D4T3gcHbX2VEu17ZpAjcQ0', '_blank')}
              className="bg-white text-emerald-600 px-3 py-1 rounded-lg hover:bg-stone-100 transition-colors">Rejoindre</button>
            <button onClick={() => setShowWhatsAppBanner(false)} className="p-1 hover:bg-white/20 rounded-full"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* DB Setup */}
      {dbStatus && <DbSetupBanner dbStatus={dbStatus} onRecheck={fetchDbStatus} />}

      {/* Feed Header */}
      <div className="px-6 mt-6 flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl text-stone-800">Signalements Récents</h2>
        <div className="bg-stone-100 px-3 py-1 rounded-full text-xs font-bold text-stone-500">
          {filteredPets.length} animaux
        </div>
      </div>

      {/* Radius filter */}
      <div className="px-6 mt-4 space-y-4">
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 text-stone-600">
            <Navigation size={18} className="text-emerald-600" />
            <span className="text-sm font-medium">Rayon: {radiusKm ? `${radiusKm}km` : 'Tout'}</span>
          </div>
          <div className="flex gap-2 items-center">
            {[5, 10, 25, null].map(r => (
              <button key={r ?? 'all'}
                onClick={() => setRadiusKm(r)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                  radiusKm === r ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                )}
              >
                {r ? `${r}k` : 'Tout'}
              </button>
            ))}
          </div>
        </div>

        {geo.status === 'denied' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 0.9, y: 0 }}
            className="bg-stone-100 border border-stone-200 p-3 rounded-2xl flex items-center gap-3">
            <AlertCircle className="text-stone-400 shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-xs font-bold text-stone-700">Position GPS non activée</p>
              <p className="text-[10px] text-stone-500">Activez pour voir les animaux autour de vous.</p>
            </div>
            <button onClick={geo.requestLocation}
              className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
              Activer
            </button>
          </motion.div>
        )}
      </div>

      {/* Main content */}
      <main className="px-6 mt-8 relative min-h-[60vh]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Chargement des signalements...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'list' ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Matches */}
                {filteredMatches.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <h2 className="font-display font-bold text-stone-800">Matchs Potentiels</h2>
                    </div>
                    {filteredMatches.map(match => (
                      <MatchCard key={match.id} match={match} myReports={myReports}
                        onConfirm={id => handleMatchStatus(id, 'confirmed')}
                        onViewDetails={setSelectedMatch} />
                    ))}
                  </div>
                )}

                {/* Pet list */}
                {filteredPets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-stone-400 text-center">
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                      <Search size={32} />
                    </div>
                    <p className="font-medium text-stone-600">Aucun signalement dans cette zone</p>
                    <p className="text-sm">Augmentez le rayon ou soyez le premier à signaler.</p>
                  </div>
                ) : (
                  filteredPets.map(pet => {
                    const dist = geo.location && pet.lat && pet.lng
                      ? haversineKm(geo.location[0], geo.location[1], pet.lat, pet.lng)
                      : undefined;
                    return (
                      <PetCard key={pet.id} pet={pet}
                        petMatch={getPetMatch(pet.id)}
                        isAdmin={isAdmin}
                        userLocation={geo.location}
                        onShare={shareToWhatsApp}
                        onDelete={handleDelete}
                        onViewMatch={setSelectedMatch}
                        onConfirmMatch={id => handleMatchStatus(id, 'confirmed')}
                        distanceKm={dist ? Math.round(dist * 10) / 10 : undefined}
                      />
                    );
                  })
                )}
              </motion.div>
            ) : (
              /* Map View */
              <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-[70vh] rounded-3xl overflow-hidden border border-stone-200 shadow-lg">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <MapUpdater center={mapCenter} />

                  {geo.location && radiusKm && (
                    <Circle center={geo.location} radius={radiusKm * 1000}
                      pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.05, weight: 1 }} />
                  )}

                  {filteredPets.filter(p => p.lat && p.lng).map(pet => (
                    <Marker key={pet.id} position={[pet.lat!, pet.lng!]}>
                      <Popup>
                        <div className="text-center min-w-[180px]">
                          {pet.image_url && (
                            <img src={pet.image_url} className="w-full h-24 object-cover rounded-lg mb-2" />
                          )}
                          <p className="font-bold text-sm">
                            {pet.type === 'lost' ? '🔴 Perdu' : '🔵 Trouvé'} · {pet.species === 'dog' ? '🐶' : '🐱'}
                          </p>
                          <p className="text-xs text-gray-600">{pet.breed} · {pet.color}</p>
                          <p className="text-xs mt-1">{pet.location}</p>
                          {pet.contact && pet.contact !== 'Anonyme' && (
                            <a href={`tel:${pet.contact}`} className="text-xs text-emerald-600 font-bold mt-1 block">
                              📞 {pet.contact}
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsReporting(true)}
        className="fixed bottom-8 right-6 z-[1000] bg-emerald-600 text-white w-16 h-16 rounded-2xl shadow-2xl shadow-emerald-300 flex items-center justify-center hover:bg-emerald-700 transition-colors"
      >
        <Plus size={28} />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {isReporting && (
          <ReportFormModal
            isOpen={isReporting}
            onClose={() => setIsReporting(false)}
            onSubmit={handleReportSubmit}
            userLocation={geo.location}
          />
        )}
      </AnimatePresence>

      <MatchDetail
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onConfirm={id => handleMatchStatus(id, 'confirmed')}
        onReject={id => handleMatchStatus(id, 'rejected')}
      />

      <AdminModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleAdminLogin}
      />
    </div>
  );
}
