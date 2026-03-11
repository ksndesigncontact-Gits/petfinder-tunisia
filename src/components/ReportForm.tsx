import React, { useState, useEffect } from 'react';
import { X, Camera, MapPin, Loader2, AlertCircle, PawPrint, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import imageCompression from 'browser-image-compression';
import { analyzePetImage } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useT, useLanguage } from '../hooks/useLanguage';
import type { ReportForm, INITIAL_FORM } from '../types';

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

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  userLocation: [number, number] | null;
}

export default function ReportFormModal({ isOpen, onClose, onSubmit, userLocation }: ReportFormModalProps) {
  const t = useT();
  const { lang } = useLanguage();
  const [form, setForm] = useState<ReportForm>({
    species: 'dog',
    name: 'Inconnu',
    pet_status: 'toujours_errant',
    breed: '',
    color: '',
    description: '',
    location: '',
    lat: null,
    lng: null,
    contact: '+216 ',
    image: null,
    imagePreview: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setForm(prev => ({ ...prev, image: file, imagePreview: base64 }));

      setIsAnalyzing(true);
      try {
        const analysis = await analyzePetImage(base64);
        if (!analysis.isPet) {
          alert(t('notPetImage'));
          setForm(prev => ({ ...prev, image: null, imagePreview: '' }));
          return;
        }
        setForm(prev => ({
          ...prev,
          species: analysis.species,
          breed: analysis.breed,
          color: analysis.color,
          description: analysis.description,
        }));
      } catch (err) {
        console.error(t('aiAnalysisFailed'), err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('noGeolocation'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          location: `Position GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
        }));
      },
      () => {
        alert(t('locationError'));
      }
    );
  };

  const handleLocationText = (val: string) => {
    setForm(prev => ({ ...prev, location: val }));
    const match = val.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      setForm(prev => ({ ...prev, lat: parseFloat(match[1]), lng: parseFloat(match[2]) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isAnalyzing) return;

    const newErrors: Record<string, string> = {};
    const hasPhoto = form.image != null;
    // Extract only the local 8 digits (skip +216 prefix)
    const localDigits = form.contact.replace(/\D/g, '').slice(3); // Remove 216 (3 digits)
    const hasContact = localDigits.length === 8;

    // Require either a photo OR a valid contact number
    if (!hasPhoto && !hasContact) {
      newErrors.contact = t('photoOrContact');
    }
    if (form.description.length < 10) {
      newErrors.description = "Description trop courte (min 10 caractères).";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (form.lat == null || form.lng == null) {
      if (!confirm(t('noPositionWarning'))) return;
    }

    let fileToUpload = form.image;
    if (form.image) {
      try {
        fileToUpload = await imageCompression(form.image, { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true });
      } catch {}
    }

    const formData = new FormData();
    formData.append('type', 'lost');
    formData.append('species', form.species);
    formData.append('name', form.name);
    formData.append('pet_status', form.pet_status);
    formData.append('breed', form.breed);
    formData.append('color', form.color);
    formData.append('description', form.description);
    formData.append('location', form.location);
    formData.append('contact', form.contact);
    formData.append('website', honeypot);
    if (form.lat != null) formData.append('lat', form.lat.toString());
    if (form.lng != null) formData.append('lng', form.lng.toString());
    if (fileToUpload) formData.append('image', fileToUpload);

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setForm({
        species: 'dog', name: 'Inconnu', pet_status: 'toujours_errant',
        breed: '', color: '', description: '', location: '', lat: null, lng: null,
        contact: '+216 ', image: null, imagePreview: '',
      });
      setHoneypot('');
      onClose();
    } catch (err: any) {
      alert(err.message || "Erreur lors du signalement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const mapCenter: [number, number] = form.lat && form.lng
    ? [form.lat, form.lng]
    : userLocation || [36.8065, 10.1815]; // Tunis default

  return (
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
          <h2 className="font-display font-bold text-xl text-stone-800">{t('newReport')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Honeypot */}
          <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)}
            className="absolute opacity-0 h-0 w-0" tabIndex={-1} autoComplete="off" />

          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
            <p className="text-sm font-bold text-red-700">{t('reportLostAnimal')}</p>
            <p className="text-xs text-red-600 mt-1">{t('helpFindAnimal')}</p>
          </div>

          {/* Species */}
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">{t('species')}</label>
            <div className="grid grid-cols-2 gap-3">
              {(['dog', 'cat'] as const).map(s => (
                <button key={s} type="button"
                  onClick={() => setForm(prev => ({ ...prev, species: s }))}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-sm transition-all border-2",
                    form.species === s
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                      : "bg-stone-50 border-stone-200 text-stone-400"
                  )}
                >
                  {s === 'dog' ? t('dog') : t('cat')}
                </button>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">
              {t('reportPhoto')} <span className="text-stone-400 normal-case">{t('aiWillAnalyze')}</span>
            </label>
            <label className={cn(
              "flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
              form.imagePreview ? "border-emerald-300 bg-emerald-50/30" : "border-stone-300 hover:border-emerald-400 hover:bg-stone-50"
            )}>
              {form.imagePreview ? (
                <div className="relative w-full">
                  <img src={form.imagePreview} className="w-full h-48 object-cover rounded-2xl" />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        <p className="text-xs font-bold">Analyse IA en cours...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Camera size={32} className="text-stone-400" />
                  <span className="text-sm text-stone-500 font-medium">{t('takePhoto')}</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">{t('animalNameLabel')}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('nameExample')}
              className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 border-none"
            />
          </div>

          {/* Breed & Color (auto-filled by AI) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">{t('breed')}</label>
              <input
                type="text"
                value={form.breed}
                onChange={e => setForm(prev => ({ ...prev, breed: e.target.value }))}
                placeholder={t('breedExample')}
                className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 border-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">{t('color')}</label>
              <input
                type="text"
                value={form.color}
                onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                placeholder={t('colorExample')}
                className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 border-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">{t('description')}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('describeAnimal')}
              rows={3}
              className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 border-none resize-none"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.description}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">{t('location')}</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={form.location}
                onChange={e => handleLocationText(e.target.value)}
                placeholder={t('addressOrMaps')}
                className="flex-1 bg-stone-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 border-none"
              />
              <button type="button" onClick={useCurrentLocation}
                className="px-4 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors flex items-center gap-1"
              >
                <Navigation size={16} />
              </button>
            </div>

            {/* Mini map for location picking */}
            <div className="h-48 rounded-2xl overflow-hidden border border-stone-200">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker
                  onSelect={(lat, lng) => {
                    setForm(prev => ({
                      ...prev,
                      lat, lng,
                      location: prev.location || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                    }));
                  }}
                  initialPos={mapCenter}
                />
                {form.lat != null && form.lng != null && (
                  <Marker position={[form.lat, form.lng]} />
                )}
              </MapContainer>
            </div>
            {form.lat != null && (
              <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <MapPin size={10} /> {t('selectedPosLabel')} {form.lat.toFixed(4)}, {form.lng?.toFixed(4)}
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">{t('contactLabel')}</label>
            <div className="flex gap-2">
              <div className="bg-stone-200 rounded-2xl px-4 py-4 text-sm font-bold text-stone-600 flex items-center">
                +216
              </div>
              <input
                type="tel"
                name="contact"
                value={form.contact.replace('+216 ', '')}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setForm(prev => ({ ...prev, contact: `+216 ${val}` }));
                }}
                placeholder="22 123 456"
                maxLength="8"
                className="flex-1 bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-emerald-500 border-none"
              />
            </div>
            {errors.contact && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.contact}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || isAnalyzing}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin" size={20} /> {t('publishing')}</>
            ) : isAnalyzing ? (
              <><Loader2 className="animate-spin" size={20} /> {t('analyzing')}</>
            ) : (
              <><PawPrint size={20} /> {t('publishBtn')}</>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
