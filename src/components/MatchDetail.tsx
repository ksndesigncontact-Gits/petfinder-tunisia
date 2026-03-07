import React from 'react';
import { X, MapPin, Phone, Heart, PawPrint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Match } from '../types';

interface MatchDetailProps {
  match: Match | null;
  onClose: () => void;
  onConfirm: (matchId: number) => void;
  onReject: (matchId: number) => void;
}

export default function MatchDetail({ match, onClose, onConfirm, onReject }: MatchDetailProps) {
  if (!match) return null;

  const PetSide = ({ pet, label }: { pet: any; label: string }) => (
    <div className="flex-1 text-center space-y-3">
      <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto bg-stone-100 shadow-lg">
        {pet?.image_url ? (
          <img src={pet.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <PawPrint size={32} />
          </div>
        )}
      </div>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</span>
        <h3 className="font-bold text-stone-800">{pet?.breed || pet?.species || '?'}</h3>
        <p className="text-xs text-stone-500">{pet?.color || ''}</p>
        {pet?.location && (
          <p className="text-[10px] text-stone-400 flex items-center justify-center gap-1 mt-1">
            <MapPin size={10} /> {pet.location}
          </p>
        )}
        {pet?.contact && pet.contact !== 'Anonyme' && (
          <a
            href={`tel:${pet.contact}`}
            className="inline-flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold"
          >
            <Phone size={12} /> {pet.contact}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
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
          className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-stone-800">Détail du Match</h2>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Score */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
              <span className="text-2xl font-display font-bold text-emerald-600">{match.match_score}%</span>
              <span className="text-xs text-emerald-700 font-medium">de correspondance</span>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Distance: {match.distance_km.toFixed(1)} km
            </p>
          </div>

          {/* Side by side */}
          <div className="flex gap-6 items-start mb-8">
            <PetSide pet={match.lost_report} label="Perdu" />
            <div className="flex flex-col items-center py-8">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Heart size={20} />
              </div>
              <div className="h-8 w-px bg-emerald-200 mt-2" />
            </div>
            <PetSide pet={match.found_report} label="Trouvé" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            {match.status === 'confirmed' ? (
              <div className="col-span-2 py-4 text-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center justify-center gap-2">
                <Heart size={18} className="fill-emerald-600" />
                Match confirmé ! L'animal est retrouvé.
              </div>
            ) : (
              <>
                <button
                  onClick={() => onReject(match.id)}
                  className="py-4 rounded-2xl font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  Pas mon animal
                </button>
                <button
                  onClick={() => onConfirm(match.id)}
                  className="py-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <Heart size={18} /> C'est lui !
                </button>
              </>
            )}
          </div>

          <p className="text-[10px] text-stone-400 text-center mt-6 uppercase tracking-widest font-bold">
            Vérifiez toujours visuellement l'animal avant de confirmer
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
