import React, { useState } from 'react';
import { X, Camera, Loader2, AlertCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import type { Pet } from '../types';

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

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('contact_phone', contact || '');
      formData.append('message', message);
      formData.append('lat', userLocation?.[0]?.toString() || '');
      formData.append('lng', userLocation?.[1]?.toString() || '');
      formData.append('location', userLocation ? `${userLocation[0]}, ${userLocation[1]}` : '');
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
                  rows={4}
                  className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-amber-500 border-none resize-none"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 block">
                  Numéro de contact <span className="text-stone-400 normal-case">(optionnel)</span>
                </label>
                <input
                  type="tel"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="+216 22 123 456"
                  className="w-full bg-stone-100 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-amber-500 border-none"
                />
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
