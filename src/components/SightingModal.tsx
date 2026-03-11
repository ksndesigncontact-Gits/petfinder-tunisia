import React, { useState, useEffect } from 'react';
import { X, Camera, Loader2, AlertCircle, Eye, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import imageCompression from 'browser-image-compression';
import type { Pet } from '../types';

// Fix Leaflet icons
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

function LocationPicker({ onSelect, initialPos }: { onSelect: (lat: number, lng: number) => void; initialPos?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (initialPos) map.setView(initialPos, 13);
  }, [initialPos, map]);
  useMapEvents({
    click(e) { onSelect(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

interface SightingModalProps {
  isOpen: boolean;
  pet: Pet | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  userLocation: [number, number] | null;
}

export default function SightingModal({ isOpen, pet, onClose, onSubmit, userLocation }: SightingModalProps) {
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [lat, setLat] = useState<number | null>(userLocation?.[0] || null);
  const [lng, setLng] = useState<number | null>(userLocation?.[1] || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);

      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
        setImage(compressed);
      } catch {
        setImage(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError('Décrivez brièvement ce que vous avez vu.');
      return;
    }

    // Validate: REQUIRED: contact AND position
    const hasContact = contact.replace(/\D/g, '').length === 8;
    const hasPosition = lat != null && lng != null;

    if (!hasContact) {
      setError('Numéro tunisien obligatoire (8 chiffres).');
      return;
    }

    if (!hasPosition) {
      setError('Position sur la carte obligatoire. Clique sur la carte.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('contact_phone', contact || '');
      formData.append('message', message);
      formData.append('lat', lat?.toString() || '');
      formData.append('lng', lng?.toString() || '');
      formData.append('location', lat && lng ? `${lat}, ${lng}` : '');
      if (image) formData.append('image', image);

      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du signalement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !pet) return null;

  return (
    <AnimatePresence>
      {isOpen && pet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-5 border-b border-stone-100 flex items-center justify-between rounded-t-[2.5rem]">
              <div className="flex items-center gap-3">
                <Eye className="text-amber-500" size={24} />
                <h2 className="font-display font-bold text-xl text-stone-800">Je l'ai vu !</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Pet info */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                <p className="text-sm text-stone-600">Animal :</p>
                <p className="font-bold text-amber-700">
                  {pet.breed || pet.species} · {pet.color}
                </p>
                <p className="text-xs text-stone-500 mt-1">{pet.location}</p>
              </div>

              {/* Photo */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">
                  Photo du sighting <span className="text-stone-400 normal-case">(optionnel)</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                  imagePreview ? 'border-amber-300 bg-amber-50/30' : 'border-stone-300 hover:border-amber-400 hover:bg-stone-50'
                }`}>
                  {imagePreview ? (
                    <div className="w-full">
                      <img src={imagePreview} className="w-full h-48 object-cover rounded-2xl" />
                    </div>
                  ) : (
                    <>
                      <Camera size={32} className="text-stone-400" />
                      <span className="text-sm text-stone-500 font-medium">Prendre une photo ou choisir un fichier</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">
                  Décrivez ce que vous avez vu
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ex: Vu près du parc, vers 14h, semblait avoir faim..."
                  rows={3}
                  className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-amber-500 border-none resize-none"
                />
              </div>

              {/* Position on map */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">
                  Position du sighting <span className="text-stone-400 normal-case">(optionnel - clique sur la carte)</span>
                </label>
                <div className="h-48 rounded-2xl overflow-hidden border border-stone-200">
                  <MapContainer
                    center={[lat || userLocation?.[0] || 36.8065, lng || userLocation?.[1] || 10.1815]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker
                      onSelect={(newLat, newLng) => {
                        setLat(newLat);
                        setLng(newLng);
                      }}
                      initialPos={[lat || userLocation?.[0] || 36.8065, lng || userLocation?.[1] || 10.1815]}
                    />
                    {lat != null && lng != null && (
                      <Marker position={[lat, lng]} />
                    )}
                  </MapContainer>
                </div>
                {lat != null && lng != null && (
                  <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                    <MapPin size={10} /> Position: {lat.toFixed(4)}, {lng.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">
                  Numéro de contact (8 chiffres) <span className="text-stone-400 normal-case">(optionnel)</span>
                </label>
                <div className="flex gap-2">
                  <div className="bg-stone-200 rounded-2xl px-4 py-4 text-sm font-bold text-stone-600 flex items-center">
                    +216
                  </div>
                  <input
                    type="tel"
                    value={contact.replace('+216 ', '')}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setContact(`+216 ${val}`);
                    }}
                    placeholder="22 123 456"
                    maxLength="8"
                    className="flex-1 bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-amber-500 border-none"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="animate-spin" size={20} /> Envoi en cours...</>
                ) : (
                  <><Eye size={20} /> Confirmer le sighting</>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
