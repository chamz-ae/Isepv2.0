'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Webhook, Save, Plus, Trash2, Send, RotateCcw, ShieldCheck, Database, Smartphone } from 'lucide-react';
import { getWebhooks, saveWebhook, deleteWebhook, testWebhookDelivery } from '@/lib/services/webhookService';
import { WebhookIntegration } from '@/lib/supabase/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

export default function AdminPengaturanPage() {
  const [webhooks, setWebhooks] = useState<WebhookIntegration[]>([]);
  const [businessName, setBusinessName] = useState('ASAP ISEP — Daging Asap');
  const [whatsappNumber, setWhatsappNumber] = useState('+6281234567890');
  const [address, setAddress] = useState('Jl. Raya Lereng Asap No. 8, Cisarua, Bogor');
  const [defaultLodgingRate, setDefaultLodgingRate] = useState(200000);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  // Webhook Modal
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Partial<WebhookIntegration> | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await getWebhooks();
    setWebhooks(list);
  }

  const handleOpenAddWh = () => {
    setEditingWh({
      label: 'Google Sheets Transaksi',
      webhook_url: '',
      secret_token: '',
      trigger_events: ['restaurant_paid', 'lodging_paid'],
      is_active: true,
    });
    setIsWhModalOpen(true);
  };

  const handleSaveWh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWh || !editingWh.webhook_url) return;
    await saveWebhook(editingWh);
    setIsWhModalOpen(false);
    setEditingWh(null);
    loadData();
  };

  const handleDeleteWh = async (id: string) => {
    if (confirm('Hapus webhook ini?')) {
      await deleteWebhook(id);
      loadData();
    }
  };

  const handleTestWh = async (wh: WebhookIntegration) => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testWebhookDelivery(wh);
    setIsTesting(false);
    setTestResult({ id: wh.id, message: res.message, success: res.success });
  };

  const handleResetTestingData = () => {
    if (
      confirm(
        'PERINGATAN: Ini akan mereset data testing pesanan dan mutasi stok di browser lokal. Master menu dan konfigurasi resmi tetap dipertahankan. Lanjutkan?'
      )
    ) {
      localStorage.removeItem('asap_orders_store');
      localStorage.removeItem('asap_stock_movements_store');
      localStorage.removeItem('asap_cooking_batches_store');
      localStorage.removeItem('asap_stock_opnames_store');
      localStorage.removeItem('asap_purchases_store');
      localStorage.removeItem('asap_closings_store');
      alert('Data transaksi dan mutasi testing lokal berhasil direset.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" />
          <span>Pengaturan Sistem & Integrasi Webhook</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Identitas bisnis, nomor WhatsApp resmi, integrasi Google Sheets, scheduler backup, dan pengaturan PWA.
        </p>
      </div>

      {/* Business Identity */}
      <Card>
        <CardHeader title="1. Identitas Bisnis & Komunikasi" subtitle="Pengaturan nama brand dan nomor WhatsApp kontak transaksi" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <Input
            label="Nama Brand Bisnis"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <Input
            label="Nomor WhatsApp Resmi Pelanggan"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            helperText="Digunakan untuk tautan konfirmasi pemesanan otomatis"
          />
          <div className="md:col-span-2">
            <Input
              label="Alamat Lengkap Lokasi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <Input
            label="Tarif Awal Kamar Kabin / Orang (Rp)"
            type="number"
            value={defaultLodgingRate}
            onChange={(e) => setDefaultLodgingRate(parseFloat(e.target.value) || 200000)}
          />
        </div>
      </Card>

      {/* Google Sheets Webhook Integrations */}
      <Card>
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-amber-600" />
              <span>2. Integrasi Webhook Google Sheets & Eksternal</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Kirim rekap transaksi secara server-side ke Google Sheets saat pembayaran lunas atau opname selesai
            </p>
          </div>
          <Button variant="amber" size="sm" onClick={handleOpenAddWh}>
            <Plus className="w-4 h-4 mr-1" />
            <span>Tambah Webhook</span>
          </Button>
        </div>

        {webhooks.length === 0 ? (
          <p className="text-xs text-stone-400 italic">Belum ada webhook Google Sheets yang terkonfigurasi.</p>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 text-sm">{wh.label}</span>
                    <Badge variant={wh.is_active ? 'success' : 'stone'} size="sm" className="ml-2">
                      {wh.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestWh(wh)} isLoading={isTesting}>
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>Uji Koneksi (Test)</span>
                    </Button>
                    <button
                      onClick={() => handleDeleteWh(wh.id)}
                      className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="font-mono text-[11px] text-stone-600 break-all bg-white p-2 rounded border border-stone-200">
                  {wh.webhook_url}
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    Event Pemicu: <strong>{wh.trigger_events.join(', ')}</strong>
                  </span>
                  {wh.last_delivery_at && <span>Pengiriman terakhir: {wh.last_delivery_at}</span>}
                </div>

                {testResult && testResult.id === wh.id && (
                  <div className={`p-2 rounded text-xs ${testResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    Hasil Test: {testResult.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Auto Backup & Maintenance */}
      <Card>
        <CardHeader title="3. Auto-Backup & Keamanan Sistem" subtitle="Jadwal backup otomatis pukul 23:59 WIB dan reset data testing" />
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
            <div>
              <span className="font-bold text-stone-800 block">Auto-Backup Harian (23.59 WIB)</span>
              <span className="text-stone-500">Mencadangkan snapshot transaksi, mutasi stok, dan data tamu ke cloud</span>
            </div>
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-200">
            <div>
              <span className="font-bold text-red-900 block">Reset Data Testing Transaksi</span>
              <span className="text-red-700">Menghapus data pesanan & mutasi dummy tanpa menghapus master menu</span>
            </div>
            <Button variant="danger" size="sm" onClick={handleResetTestingData}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Reset Testing Data</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Webhook Modal */}
      {isWhModalOpen && editingWh && (
        <Modal
          isOpen={isWhModalOpen}
          onClose={() => setIsWhModalOpen(false)}
          title="Konfigurasi Webhook Baru"
          subtitle="Masukkan URL Google Apps Script Web App atau endpoint eksternal"
          maxWidth="md"
        >
          <form onSubmit={handleSaveWh} className="space-y-4 text-xs">
            <Input
              label="Label Webhook"
              placeholder="Contoh: Google Sheets Rekap Keuangan"
              value={editingWh.label || ''}
              onChange={(e) => setEditingWh({ ...editingWh, label: e.target.value })}
              required
            />
            <Input
              label="URL Webhook (Google Apps Script / Webhook Endpoint)"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={editingWh.webhook_url || ''}
              onChange={(e) => setEditingWh({ ...editingWh, webhook_url: e.target.value })}
              required
            />
            <Input
              label="Secret Token / Header Signature (Opsional)"
              placeholder="secret_token_123"
              value={editingWh.secret_token || ''}
              onChange={(e) => setEditingWh({ ...editingWh, secret_token: e.target.value })}
            />
            <Select
              label="Trigger Event Utama"
              value={editingWh.trigger_events?.[0] || 'restaurant_paid'}
              onChange={(e) => setEditingWh({ ...editingWh, trigger_events: [e.target.value] })}
            >
              <option value="restaurant_paid">Transaksi Restoran Lunas</option>
              <option value="lodging_paid">Transaksi Inap Lunas</option>
              <option value="purchase_created">Pembelian Baru Tercatat</option>
              <option value="stock_opname_adjusted">Stock Opname Disesuaikan</option>
            </Select>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsWhModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="amber" size="sm">
                Simpan Webhook
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
