'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Lock,
  User,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Link2,
  Download,
  CheckCircle2,
  KeyRound,
  Info,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/lib/supabase/types';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, profile } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    // If already logged in, redirect straight to admin dashboard
    if (profile) {
      router.replace('/admin');
    }
  }, [profile, router]);

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
    setInfoMsg('');

    if (!usernameOrEmail.trim()) {
      setErrorMsg('Username atau Email wajib diisi.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }
    if (password.trim().length < 3) {
      setErrorMsg('Kata sandi minimal 3 karakter.');
      return;
    }

    setIsLoading(true);

    const res = await signIn(usernameOrEmail, password);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      router.push('/admin');
    }
  };

  // Helper to fill credential fields (Requirement 1: user must still submit)
  const handlePrefillCredentials = (role: UserRole) => {
    setErrorMsg('');
    if (role === 'owner') {
      setUsernameOrEmail('owner@asapisep.com');
      setPassword('admin123');
      setInfoMsg('Kredensial Owner terisi. Tekan tombol "Masuk ke Sistem" untuk melanjutkan.');
    } else if (role === 'kasir') {
      setUsernameOrEmail('kasir@asapisep.com');
      setPassword('kasir123');
      setInfoMsg('Kredensial Kasir terisi. Tekan tombol "Masuk ke Sistem" untuk melanjutkan.');
    } else if (role === 'kitchen') {
      setUsernameOrEmail('kitchen@asapisep.com');
      setPassword('chef123');
      setInfoMsg('Kredensial Kitchen terisi. Tekan tombol "Masuk ke Sistem" untuk melanjutkan.');
    } else if (role === 'purchasing') {
      setUsernameOrEmail('purchasing@asapisep.com');
      setPassword('beli123');
      setInfoMsg('Kredensial Purchasing terisi. Tekan tombol "Masuk ke Sistem" untuk melanjutkan.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-stone-950 font-sans selection:bg-amber-600 selection:text-white">
      <div className="w-full max-w-md bg-stone-900/95 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-xl shadow-amber-600/30 mb-4 ring-4 ring-amber-500/20">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">Portal Masuk Operasional</h1>
          <p className="text-xs text-stone-400 mt-1">ASAP ISEP — Sistem Manajemen Terpadu</p>
        </div>

        {/* Security & Access Badge */}
        <div className="flex flex-col items-center gap-2 mb-6">
          {isPwa ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-600/50 rounded-full text-[11px] font-mono text-emerald-300">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aplikasi PWA Operasional Aktif</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-800/80 border border-stone-700 rounded-full text-[11px] font-mono text-stone-300">
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Khusus Direct Link & PWA Staf</span>
            </div>
          )}

          <p className="text-[11px] text-stone-400 text-center max-w-xs leading-relaxed">
            Wajib memasukkan <strong className="text-stone-200">Username / Email</strong> dan{' '}
            <strong className="text-stone-200">Kata Sandi</strong> untuk membuka Dashboard.
          </p>
        </div>

        {/* Install PWA Prompt if available on device */}
        {canInstallPwa && !isPwa && (
          <button
            type="button"
            onClick={handleInstallPwa}
            className="w-full mb-5 py-2.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Pasang Aplikasi PWA Dashboard</span>
          </button>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 bg-amber-950/70 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-center gap-2.5 animate-in fade-in">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Login Form (Mandatory Credentials) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Username atau Email Staf <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  setInfoMsg('');
                }}
                required
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-800/90 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans"
                placeholder="misal: admin, owner, kasir, kitchen"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Kata Sandi <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setInfoMsg('');
                }}
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-800/90 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans"
                placeholder="Masukkan kata sandi..."
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="amber"
            size="lg"
            className="w-full mt-2 font-bold shadow-lg shadow-amber-600/20"
            isLoading={isLoading}
          >
            <span>Masuk ke Sistem</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Helper: Prefill Credentials for Testing (Requires manual submit) */}
        <div className="mt-8 pt-5 border-t border-stone-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Contoh Akun Staf (Otomatis Isi Form):</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handlePrefillCredentials('owner')}
              className="px-2.5 py-2 bg-stone-800 hover:bg-stone-700/80 text-stone-200 border border-stone-700/50 rounded-xl font-medium transition-colors text-left flex items-center justify-between"
            >
              <span>👑 Owner / Admin</span>
              <span className="text-[10px] text-stone-500">Isi</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrefillCredentials('kasir')}
              className="px-2.5 py-2 bg-stone-800 hover:bg-stone-700/80 text-stone-200 border border-stone-700/50 rounded-xl font-medium transition-colors text-left flex items-center justify-between"
            >
              <span>💳 Kasir / POS</span>
              <span className="text-[10px] text-stone-500">Isi</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrefillCredentials('kitchen')}
              className="px-2.5 py-2 bg-stone-800 hover:bg-stone-700/80 text-stone-200 border border-stone-700/50 rounded-xl font-medium transition-colors text-left flex items-center justify-between"
            >
              <span>👨‍🍳 Kitchen (KDS)</span>
              <span className="text-[10px] text-stone-500">Isi</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrefillCredentials('purchasing')}
              className="px-2.5 py-2 bg-stone-800 hover:bg-stone-700/80 text-stone-200 border border-stone-700/50 rounded-xl font-medium transition-colors text-left flex items-center justify-between"
            >
              <span>📦 Purchasing</span>
              <span className="text-[10px] text-stone-500">Isi</span>
            </button>
          </div>
        </div>

        {/* Back to Customer Homepage */}
        <div className="mt-6 pt-4 border-t border-stone-800/60 text-center">
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
