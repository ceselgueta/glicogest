'use client';

import { Heart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2 rounded-xl shadow-md">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Controle Glicêmico</h1>
            <p className="text-xs text-gray-500">Acompanhamento gestacional</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-pink-600">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Monitoramento Diário</span>
        </div>
      </div>
    </motion.header>
  );
}
