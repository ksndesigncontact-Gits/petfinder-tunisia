import React, { useState } from 'react';
import { Share2, X, Copy, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Pet } from '../types';

interface ShareMenuProps {
  pet: Pet;
}

export default function ShareMenu({ pet }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}?pet=${pet.id}`;
  const shareText = `Aidez-moi à retrouver ${pet.name !== 'Inconnu' ? pet.name : pet.species}! 🐾`;

  const shareOptions = [
    {
      name: 'Facebook',
      icon: '📘',
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
          'facebook-share',
          'width=600,height=400'
        );
      },
    },
    {
      name: 'Instagram',
      icon: '📸',
      action: () => {
        alert('Copier le lien et partager dans Instagram Stories/DM');
        copyToClipboard();
      },
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`,
          'whatsapp-share',
          'width=600,height=400'
        );
      },
    },
    {
      name: 'Messenger',
      icon: '👥',
      action: () => {
        window.open(
          `https://www.facebook.com/dialog/send?app_id=your_app_id&link=${encodeURIComponent(shareUrl)}&redirect_uri=${encodeURIComponent(shareUrl)}`,
          'messenger-share',
          'width=600,height=400'
        );
      },
    },
    {
      name: 'Copier lien',
      icon: '🔗',
      action: copyToClipboard,
    },
  ];

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-600 rounded-2xl text-sm font-bold hover:bg-stone-200 transition-all active:scale-95"
        title="Partager"
      >
        <Share2 size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-200 z-[1000] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-stone-200 bg-stone-50">
              <p className="text-sm font-bold text-stone-700">Partager</p>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-200 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Options */}
            <div className="p-2 space-y-1">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => {
                    option.action();
                    if (option.name !== 'Instagram') setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors text-sm font-semibold"
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="flex-1 text-left">{option.name}</span>
                  {copied && option.name === 'Copier lien' && (
                    <CheckCircle size={16} className="text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
