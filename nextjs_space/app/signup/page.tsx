'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Heart, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SignupPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase().trim(), password }),
      });

      const data = await res.json();
      if (data?.success) {
        // Auto login after signup
        const loginRes = await signIn('credentials', {
          email: email.toLowerCase().trim(),
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          toast.success('Conta criada! Faça login.');
          router.replace('/login');
        } else {
          toast.success('Conta criada com sucesso!');
          router.replace('/dashboard');
        }
      } else {
        toast.error(data?.error ?? 'Erro ao criar conta');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'authenticated') return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl p-8 card-shadow">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg mb-4">
                <Heart className="w-8 h-8 text-white" fill="white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Crie sua conta</h1>
            <p className="text-gray-500 mt-2">Comece a acompanhar sua glicemia agora</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg mt-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Criar conta grátis
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Já tem conta?{' '}
              <Link href="/login" className="text-pink-600 font-medium hover:text-pink-700">
                Faça login
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Voltar para o início
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
