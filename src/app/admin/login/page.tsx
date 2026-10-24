'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Crown,
  Download,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        window.location.search.includes('source=pwa');
      setIsPwa(isStandalone);

      if (window.__asap_deferred_pwa_prompt) {
        setCanInstallPwa(true);
      }

      const onInstallable = () => setCanInstallPwa(true);
      window.addEventListener('asap:pwa-installable', onInstallable);
      return () => window.removeEventListener('asap:pwa-installable', onInstallable);
    }
  }, []);

  const handleInstallPwa = async () => {
    if (typeof window !== 'undefined' && window.__asap_deferred_pwa_prompt) {
      window.__asap_deferred_pwa_prompt.prompt();
      const choice = await window.__asap_deferred_pwa_prompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setCanInstallPwa(false);
      }
      window.__asap_deferred_pwa_prompt = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setErrorMsg('Email wajib diisi.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }
    if (cleanPass.length < 3) {
      setErrorMsg('Kata sandi minimal 3 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      // Role is fixed to 'owner', authenticate with Supabase credentials
      const res = await signIn(cleanEmail, cleanPass, 'owner');

      if (res.error) {
        setIsLoading(false);
        setErrorMsg(res.error);
      } else {
        // Direct reliable full page navigation to admin dashboard
        window.location.href = '/admin';
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Gagal login ke sistem.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-stone-950 font-sans selection:bg-amber-600 selection:text-white">
      <div className="w-full max-w-md bg-stone-900/95 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-xl shadow-amber-600/30 mb-3 ring-4 ring-amber-500/20">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Portal Masuk Owner
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            ASAP ISEP — Daging Asap & Food Forest Lodging
          </p>
        </div>

        {/* Security & Access Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {isPwa ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-600/50 rounded-full text-[11px] font-mono text-emerald-300">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aplikasi PWA Owner Aktif</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-600/40 rounded-full text-[11px] font-mono text-amber-300">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Khusus Akun Owner (Supabase)</span>
            </div>
          )}
        </div>

        {/* Install PWA Prompt if available */}
        {canInstallPwa && !isPwa && (
          <button
            type="button"
            onClick={handleInstallPwa}
            className="w-full mb-4 py-2.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Pasang PWA ke Layar Utama (Home Screen)</span>
          </button>
        )}

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-950/80 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Email Owner <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-800/90 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans"
                placeholder="Email terdaftar di Supabase..."
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Kata Sandi <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-800/90 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans"
                placeholder="Kata sandi akun owner..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="amber"
            size="lg"
            className="w-full mt-3 font-bold shadow-lg shadow-amber-600/20 py-3 text-sm flex items-center justify-center gap-2"
            isLoading={isLoading}
          >
            <Crown className="w-4 h-4 text-stone-950" />
            <span>Masuk ke Dashboard Owner</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {/* Back to Customer Homepage */}
        <div className="mt-6 pt-4 border-t border-stone-800/70 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Pelanggan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
