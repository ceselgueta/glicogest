'use client';

import { Heart, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-pink-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Sem conexão</h1>
        <p className="text-gray-500 mb-6">
          Você está offline no momento. Verifique sua conexão com a internet e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-md"
        >
          Tentar novamente
        </button>
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
          <Heart className="w-4 h-4 text-pink-400" fill="currentColor" />
          <span className="text-sm">GlicoGest</span>
        </div>
      </div>
    </div>
  );
}
