'use client';

import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  transport_company?: string;
  status?: string;
}

interface UserSelectorProps {
  currentUser: User | null;
  onUserChange: (user: User) => void;
}

export default function UserSelector({ currentUser }: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const statusLabel = currentUser.status === 'owner' ? 'Propriétaire'
    : currentUser.status === 'employee' ? 'Employé'
    : currentUser.status === 'renter' ? 'Locataire'
    : '';

  return (
    <div className="relative">
      {/* Current user button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 md:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors btn-press"
      >
        <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-semibold text-xs md:text-sm">
            {currentUser.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-left hidden sm:block min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
          <p className="text-xs text-gray-500 truncate">{currentUser.transport_company || 'Transport'}</p>
        </div>
        <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {/* Dropdown - profil info */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-screen max-w-xs md:w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20 mx-2 md:mx-0 animate-scale-in">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <span className="font-bold text-lg">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t pt-3">
                {currentUser.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="text-gray-900 font-medium">{currentUser.phone}</span>
                  </div>
                )}
                {currentUser.transport_company && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Compagnie</span>
                    <span className="text-gray-900 font-medium">{currentUser.transport_company}</span>
                  </div>
                )}
                {statusLabel && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{statusLabel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
