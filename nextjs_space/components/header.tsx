'use client';

import { Heart, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2 rounded-xl shadow-md">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GlicoGest</h1>
            <p className="text-xs text-gray-500">Controle Glicêmico Gestacional</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {session?.user && (
            <div className="hidden sm:flex items-center gap-2 text-gray-500">
              <User className="w-4 h-4" />
              <span className="text-sm">{session.user.name || session.user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
