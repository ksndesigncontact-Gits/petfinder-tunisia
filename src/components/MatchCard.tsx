import React from 'react';
import { PawPrint, AlertCircle, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
  myReports: number[];
  onConfirm: (matchId: number) => void;
  onViewDetails: (match: Match) => void;
}

export default function MatchCard({ match, myReports, onConfirm, onViewDetails }: MatchCardProps) {
  const isMyLost = myReports.includes(match.lost_report_id);
  const otherPet = isMyLost ? match.found_report : match.lost_report;

  if (!otherPet) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex items-center gap-4 shadow-sm"
    >
      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-emerald-100">
        {otherPet.image_url ? (
          <img src={otherPet.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-300">
            <PawPrint size={24} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-emerald-900 truncate flex items-center gap-1.5">
          <AlertCircle size={14} /> {isMyLost ? 'Possible trouvé !' : 'Match potentiel !'}
        </h3>
        <p className="text-xs text-emerald-700">
          À environ {match.distance_km.toFixed(1)} km · Score: {match.match_score}%
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => onConfirm(match.id)}
          className="bg-emerald-600 text-white px-3 py-2 rounded-2xl text-[10px] font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-colors flex items-center gap-1"
        >
          <Heart size={12} /> C'est lui !
        </button>
        <button
          onClick={() => onViewDetails(match)}
          className="bg-white text-emerald-600 border border-emerald-200 px-3 py-2 rounded-2xl text-[10px] font-bold shadow-sm hover:bg-emerald-50 transition-colors"
        >
          Détails
        </button>
      </div>
    </motion.div>
  );
}
