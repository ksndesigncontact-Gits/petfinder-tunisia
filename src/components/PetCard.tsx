import React, { useState } from 'react';
import { PawPrint, MapPin, Phone, Share2, Heart, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';
import type { Pet, Match } from '../types';

interface PetCardProps {
  pet: Pet;
  petMatch?: Match;
  isAdmin: boolean;
  userLocation: [number, number] | null;
  onShare: (pet: Pet) => void;
  onDelete: (id: number | string) => void;
  onViewMatch: (match: Match) => void;
  onConfirmMatch: (matchId: number) => void;
  distanceKm?: number;
}

export default function PetCard({
  pet, petMatch, isAdmin, userLocation, onShare, onDelete, onViewMatch, onConfirmMatch, distanceKm
}: PetCardProps) {
  const [imgError, setImgError] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null);
  const isResolved = petMatch?.status === 'confirmed';

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
      className={cn(
        "bg-white rounded-3xl overflow-hidden shadow-sm border transition-all group",
        isResolved ? "border-emerald-200 bg-emerald-50/30" : "border-stone-200"
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {pet.image_url && !imgError ? (
          <img
            src={pet.image_url}
            alt={pet.breed || pet.species}
            onError={() => setImgError(true)}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              !isResolved && "group-hover:scale-105"
            )}
          />
        ) : (
          <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
            <PawPrint size={48} />
          </div>
        )}

        {/* Resolved overlay */}
        {isResolved && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/20 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white/90 p-4 rounded-full shadow-2xl">
              <Heart size={48} className="text-red-500 fill-red-500" />
            </motion.div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
            pet.type === 'lost' ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          )}>
            {pet.type === 'lost' ? 'Perdu' : 'Trouvé'}
          </span>

          {petMatch && !isResolved && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => onViewMatch(petMatch)}
              className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-lg flex items-center gap-1"
            >
              <Sparkles size={10} /> Match trouvé !
            </motion.button>
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
                Cliquez encore pour confirmer
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
                En sécurité
              </span>
            )}
            {pet.pet_status === 'toujours_errant' && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                Toujours errant
              </span>
            )}
          </div>
        </div>

        {pet.description && (
          <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">{pet.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <MapPin size={12} />
          <span className="truncate">{pet.location || 'Position non spécifiée'}</span>
        </div>

        <div className="text-[10px] text-stone-400">
          {formatDate(pet.created_at)}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {pet.contact && pet.contact !== 'Anonyme' && (
            <a
              href={`tel:${pet.contact}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Phone size={16} /> Appeler
            </a>
          )}
          <button
            onClick={() => onShare(pet)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-600 rounded-2xl text-sm font-bold hover:bg-stone-200 transition-all active:scale-95"
          >
            <Share2 size={16} /> Partager
          </button>
        </div>
      </div>
    </motion.div>
  );
}
