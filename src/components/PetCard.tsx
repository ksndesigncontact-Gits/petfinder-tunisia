import React, { useState } from 'react';
import { PawPrint, MapPin, Phone, Share2, Eye, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn, isValidTunisianPhone } from '../lib/utils';
import { useT } from '../hooks/useLanguage';
import type { Pet } from '../types';

interface PetCardProps {
  pet: Pet;
  isAdmin: boolean;
  userLocation: [number, number] | null;
  onShare: (pet: Pet) => void;
  onDelete: (id: number | string) => void;
  onSighting: (pet: Pet) => void;
  distanceKm?: number;
}

export default function PetCard({
  pet, isAdmin, userLocation, onShare, onDelete, onSighting, distanceKm
}: PetCardProps) {
  const t = useT();
  const [imgError, setImgError] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null);

  const handleDeleteClick = (id: number | string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000);
      return;
    }
    setConfirmDeleteId(null);
    onDelete(id);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200 transition-all group"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {pet.image_url && !imgError ? (
          <img
            src={pet.image_url}
            alt={pet.breed || pet.species}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
            <PawPrint size={48} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm bg-red-500 text-white">
            {t('lost')}
          </span>
          {pet.contact && isValidTunisianPhone(pet.contact) && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm bg-blue-500 text-white">
              <CheckCircle size={10} /> {t('verified')}
            </span>
          )}
        </div>

        {/* Distance badge */}
        {distanceKm != null && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
            <MapPin size={10} /> {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
          </div>
        )}

        {/* Admin delete */}
        {isAdmin && (
          <button
            onClick={() => handleDeleteClick(pet.id)}
            className={cn(
              "absolute bottom-4 right-4 p-3 rounded-2xl shadow-lg transition-all",
              confirmDeleteId === pet.id
                ? "bg-red-600 text-white animate-pulse"
                : "bg-white/90 text-red-500 hover:bg-red-50"
            )}
          >
            <Trash2 size={18} />
            {confirmDeleteId === pet.id && (
              <span className="absolute -top-8 right-0 bg-red-600 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">
                {t('confirmDeleteAgain')}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-stone-800 leading-tight">
              {pet.name && pet.name !== 'Inconnu' ? pet.name : (pet.breed || pet.species)}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {pet.species === 'dog' ? '🐶 Chien' : '🐱 Chat'}
              {pet.breed && ` · ${pet.breed}`}
              {pet.color && ` · ${pet.color}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {pet.pet_status === 'en_ma_possession' && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                {t('safe')}
              </span>
            )}
            {pet.pet_status === 'toujours_errant' && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                {t('stillStray')}
              </span>
            )}
          </div>
        </div>

        {pet.description && (
          <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">{pet.description}</p>
        )}

        <button
          onClick={() => onSighting(pet)}
          className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer underline"
        >
          <MapPin size={12} />
          <span className="truncate">{pet.location || t('positionNotSpecified')}</span>
        </button>

        <div className="flex items-center justify-between text-[10px] text-stone-400">
          <span>{formatDate(pet.created_at)}</span>
          <span className="flex items-center gap-1 font-bold">
            <Eye size={12} /> {pet.sighting_count} l'ont vu{pet.sighting_count > 1 ? 's' : ''} {pet.owner_notified && '• propriétaire prévenu'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {pet.contact && (
            <a
              href={`tel:${pet.contact}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Phone size={16} /> {t('call')}
            </a>
          )}
          <button
            onClick={() => onSighting(pet)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-2xl text-sm font-bold shadow-md shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95"
          >
            <Eye size={16} /> {t('iSawIt')}
          </button>
          <button
            onClick={() => onShare(pet)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-600 rounded-2xl text-sm font-bold hover:bg-stone-200 transition-all active:scale-95"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
