'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __asap_deferred_pwa_prompt?: any;
  }
}

export function PWARegistration() {
  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker terdaftar dengan scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Pendaftaran Service Worker gagal:', err);
          });
      });
    }

    // 2. Capture beforeinstallprompt for PWA install trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__asap_deferred_pwa_prompt = e;
      window.dispatchEvent(new CustomEvent('asap:pwa-installable'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
