import React, { useState } from 'react';
import { Bell, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useT } from '../hooks/useLanguage';
import type { Notification } from '../types';

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            onMarkAllAsRead();
          }
        }}
        className="relative p-2 text-stone-600 hover:text-stone-700 transition-colors"
        title={t('notifications') || 'Notifications'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 z-[2000] max-h-96 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-stone-800">
                {t('notifications') || 'Notifications'}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-stone-500 text-sm">
                {t('noNotifications') || 'Aucune notification'}
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      if (!notif.is_read) {
                        onMarkAsRead(notif.id);
                      }
                    }}
                    className={`p-4 cursor-pointer transition-colors ${
                      notif.is_read
                        ? 'bg-white hover:bg-stone-50'
                        : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-amber-500 flex-shrink-0">
                        <Eye size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.contact_phone && (
                          <p className="text-xs text-stone-500 mt-1">
                            📞 {notif.contact_phone}
                          </p>
                        )}
                        <p className="text-xs text-stone-400 mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
