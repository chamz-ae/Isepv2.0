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
  ShieldCheck,
  ChefHat,
  CreditCard,
  ShoppingBag,
  BedDouble,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/lib/supabase/types';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, profile } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [usernameOrEmail, setUsernameOrEmail] = useState('owner@asapisep.com');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  useEffect(() => {
    // If already logged in, redirect directly to dashboard
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

  // When role selection changes, prefill appropriate standard username & password
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    switch (role) {
      case 'owner':
        setUsernameOrEmail('owner@asapisep.com');
        setPassword('admin123');
        break;
      case 'admin':
        setUsernameOrEmail('admin@asapisep.com');
        setPassword('admin123');
        break;
      case 'kasir':
        setUsernameOrEmail('kasir@asapisep.com');
        setPassword('kasir123');
        break;
      case 'kitchen':
        setUsernameOrEmail('kitchen@asapisep.com');
        setPassword('chef123');
        break;
      case 'purchasing':
        setUsernameOrEmail('purchasing@asapisep.com');
        setPassword('beli123');
        break;
      case 'housekeeping':
        setUsernameOrEmail('housekeeping@asapisep.com');
        setPassword('kamar123');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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

    const res = await signIn(usernameOrEmail, password, selectedRole);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      // Role-based smart redirection
      const finalRole = res.role || selectedRole;
      if (finalRole === 'kitchen') {
        router.push('/admin/kds');
      } else if (finalRole === 'kasir') {
        router.push('/admin/pesanan-restoran');
      } else if (finalRole === 'purchasing') {
        router.push('/admin/purchasing');
      } else if (finalRole === 'housekeeping') {
        router.push('/admin/kamar');
      } else {
        router.push('/admin');
      }
    }
  };

  const roleOptions: {
    id: UserRole;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badgeColor: string;
  }[] = [
    {
      id: 'owner',
      label: 'Owner / Direksi',
      sublabel: 'Akses Penuh Semua Modul',
      icon: Crown,
      badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    },
    {
      id: 'kasir',
      label: 'Kasir & Front Office',
      sublabel: 'POS Resto, Inap, Pembayaran',
      icon: CreditCard,
      badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    },
    {
      id: 'kitchen',
      label: 'Kitchen / Smokehouse',
      sublabel: 'KDS Antrean & Stok Dapur',
      icon: ChefHat,
      badgeColor: 'text-red-400 border-red-500/40 bg-red-950/40',
    },
    {
      id: 'purchasing',
      label: 'Purchasing / Belanja',
      sublabel: 'Belanja Daging & Supplier',
      icon: ShoppingBag,
      badgeColor: 'text-sky-400 border-sky-500/40 bg-sky-950/40',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-stone-950 font-sans selection:bg-amber-600 selection:text-white">
      <div className="w-full max-w-lg bg-stone-900/95 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-xl shadow-amber-600/30 mb-3 ring-4 ring-amber-500/20">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Portal Masuk Staf & Operasional
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            ASAP ISEP — Daging Asap & Food Forest Lodging
          </p>
        </div>

        {/* Security & Access Badge */}
        <div className="flex items-center justify-center gap-2 mb-5">
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
          <div className="mb-4 p-3 bg-red-950/80 border border-red-700/60 rounded-xl text-xs text-red-200 flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Role Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
              Pilih Role / Peran Staf <span className="text-amber-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectRole(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/40 shadow-sm'
                        : 'border-stone-800 bg-stone-800/50 hover:bg-stone-800 hover:border-stone-700 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon
                        className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`}
                      />
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div>
                      <div
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-stone-300'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
                        {opt.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Username / Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Username atau Email Staf <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-stone-800/90 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans"
                placeholder="Username atau email..."
              />
            </div>
          </div>

          {/* Step 3: Password */}
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
                placeholder="Kata sandi staf..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="amber"
            size="lg"
            className="w-full mt-2 font-bold shadow-lg shadow-amber-600/20 py-3 text-sm"
            isLoading={isLoading}
          >
            <span>Masuk Sebagai {selectedRole.toUpperCase()}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
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
