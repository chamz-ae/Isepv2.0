'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Webhook,
  Save,
  Plus,
  Trash2,
  Send,
  RotateCcw,
  ShieldCheck,
  Database,
  Smartphone,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  Code,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
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
  const [businessName, setBusinessName] = useState('ASAP ISEP — Daging Asap & Lodging');
  const [whatsappNumber, setWhatsappNumber] = useState('+6281234567890');
  const [address, setAddress] = useState('Jl. Raya Lereng Asap No. 8, Cisarua, Bogor');
  const [defaultLodgingRate, setDefaultLodgingRate] = useState(200000);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  // Webhook Modal
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Partial<WebhookIntegration> | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Google Sheets Script Modal
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const list = await getWebhooks();
    setWebhooks(list);
  }

  const handleOpenAddWh = () => {
    setEditingWh({
      label: 'Google Sheets Realtime Tamu & Transaksi',
      webhook_url: '',
      secret_token: '',
      trigger_events: ['restaurant_paid', 'lodging_paid', 'order_created'],
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

  // Google Apps Script code to paste in Google Sheets
  const googleAppsScriptCode = `/**
 * =========================================================================
 * ASAP ISEP — Google Sheets Webhook Receiver (Realtime Sync)
 * =========================================================================
 * Script ini otomatis memisahkan data tamu Restoran dan Penginapan ke sheet terpisah.
 * Cara Pasang:
 * 1. Buka Google Spreadsheet baru.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus kode default dan ganti dengan seluruh script ini.
 * 4. Klik tombol "Deploy" (kanan atas) > "New deployment".
 * 5. Pilih type "Web app".
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (Siapa saja)
 * 6. Klik Deploy > Salin "Web app URL" dan tempel ke menu Webhook ASAP ISEP.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    // 1. Sheet Tamu Restoran
    var restoSheet = ss.getSheetByName("Tamu_Restoran");
    if (!restoSheet) {
      restoSheet = ss.insertSheet("Tamu_Restoran");
      restoSheet.appendRow([
        "Timestamp", "Kode Booking", "Nama Tamu", "No WhatsApp", 
        "Meja Resto", "Menu Daging & Porsi", "Total Tagihan (Rp)", 
        "Status Bayar", "Status Dapur", "Catatan"
      ]);
      restoSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#fef3c7");
    }

    // 2. Sheet Tamu Penginapan
    var lodgingSheet = ss.getSheetByName("Tamu_Penginapan");
    if (!lodgingSheet) {
      lodgingSheet = ss.insertSheet("Tamu_Penginapan");
      lodgingSheet.appendRow([
        "Timestamp", "Kode Booking", "Nama Tamu", "No WhatsApp", 
        "Kamar Kabin", "Tgl Check-In", "Tgl Check-Out", "Jumlah Tamu", 
        "Total Tagihan (Rp)", "Sudah Dibayar (Rp)", "Sisa Tagihan (Rp)", 
        "Status Bayar", "Catatan"
      ]);
      lodgingSheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#dcfce7");
    }

    var timeStr = data.timestamp || new Date().toLocaleString("id-ID");

    // Identifikasi tipe pesanan
    if (data.order_type === 'restaurant') {
      restoSheet.appendRow([
        timeStr,
        data.booking_code,
        data.guest_name,
        data.guest_phone,
        data.table_number || "-",
        data.items_summary || "-",
        data.total_amount,
        data.payment_status,
        data.order_status,
        data.notes || "-"
      ]);
    } else {
      // Lodging & Combined
      lodgingSheet.appendRow([
        timeStr,
        data.booking_code,
        data.guest_name,
        data.guest_phone,
        data.room_name || "-",
        data.check_in_date || "-",
        data.check_out_date || "-",
        data.total_guests || 1,
        data.total_amount,
        data.paid_amount,
        data.remaining_amount,
        data.payment_status,
        data.notes || "-"
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Data tamu berhasil ditambahkan ke Google Sheets",
      booking_code: data.booking_code
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(googleAppsScriptCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Timestamp',
      'Kode Booking',
      'Kategori',
      'Nama Tamu',
      'Nomor WhatsApp',
      'Unit (Kamar / Meja)',
      'Tanggal Check-In / Booking',
      'Tanggal Check-Out',
      'Jumlah Tamu',
      'Menu Daging / Rincian',
      'Total Tagihan (Rp)',
      'Sudah Dibayar (Rp)',
      'Sisa Tagihan (Rp)',
      'Status Pembayaran',
      'Status Order',
      'Catatan',
    ];

    const sampleResto = [
      new Date().toLocaleString('id-ID'),
      'ASAP-261024-001',
      'Restoran',
      'Budi Santoso',
      '081234567890',
      'Meja 01 (Indoor AC)',
      '2026-10-24 19:00',
      '-',
      '4',
      '"Brisket Daging Asap 500g (1x), Ribs Asap 400g (1x)"',
      '420000',
      '420000',
      '0',
      'LUNAS',
      'COMPLETED',
      'Reservasi meja makan malam',
    ];

    const sampleLodging = [
      new Date().toLocaleString('id-ID'),
      'ASAP-261024-002',
      'Penginapan',
      'Siti Rahma',
      '081987654321',
      'Kabin Pinus (K-01)',
      '2026-10-25',
      '2026-10-27',
      '2',
      '"Paket Menginap Food Forest + BBQ"',
      '800000',
      '400000',
      '400000',
      'DOWN_PAYMENT',
      'READY',
      'Permintaan extra bed',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), sampleResto.join(','), sampleLodging.join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'template_asap_isep_tamu_excel_sheets.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <span>Pengaturan Sistem & Webhook Realtime</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Identitas bisnis, integrasi otomatis Google Sheets/Excel, template pelaporan, dan manajemen data Supabase.
        </p>
      </div>

      {/* Business Identity */}
      <Card>
        <CardHeader
          title="1. Identitas Bisnis & Komunikasi"
          subtitle="Pengaturan nama brand dan nomor WhatsApp kontak transaksi pelanggan"
        />
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

      {/* Google Sheets / Excel Webhook Integrations */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Webhook className="w-4 h-4 text-emerald-600" />
              <span>2. Integrasi Webhook Realtime (Google Sheets & Excel)</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Setiap kali pesanan restoran atau booking penginapan dibuat, data otomatis terkirim live ke Google Spreadsheet Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsScriptModalOpen(true)}>
              <Code className="w-3.5 h-3.5 mr-1 text-stone-600" />
              <span>Lihat Script Apps Script</span>
            </Button>
            <Button variant="amber" size="sm" onClick={handleOpenAddWh}>
              <Plus className="w-4 h-4 mr-1" />
              <span>Tambah Webhook</span>
            </Button>
          </div>
        </div>

        {/* Template & Helper Banner */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-stone-900 text-xs">
                Template Rapi Google Sheets / Excel untuk Tamu Resto & Inap
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Download file template dengan kolom rapi (Timestamp, Nama Tamu, WhatsApp, Meja/Kamar, Menu Daging, Total Tagihan, dll.)
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs shrink-0 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            <span>Unduh Template CSV / Excel</span>
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
                      {wh.is_active ? 'Aktif Realtime' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTestWh(wh)} isLoading={isTesting}>
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>Uji Koneksi (Test)</span>
                    </Button>
                    <button
                      onClick={() => handleDeleteWh(wh.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Hapus Webhook"
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
                  <div className={`p-2.5 rounded-lg text-xs font-semibold ${testResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
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
        <CardHeader
          title="3. Auto-Backup & Keamanan Sistem"
          subtitle="Jadwal backup otomatis pukul 23:59 WIB dan reset data testing lokal"
        />
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

      {/* Add Webhook Modal */}
      {isWhModalOpen && editingWh && (
        <Modal
          isOpen={isWhModalOpen}
          onClose={() => setIsWhModalOpen(false)}
          title="Konfigurasi Webhook Google Sheets Baru"
          subtitle="Masukkan URL Web App dari Google Apps Script untuk menerima data realtime"
          maxWidth="md"
        >
          <form onSubmit={handleSaveWh} className="space-y-4 text-xs">
            <Input
              label="Label Webhook"
              placeholder="Contoh: Google Sheets Rekap Tamu Resto & Inap"
              value={editingWh.label || ''}
              onChange={(e) => setEditingWh({ ...editingWh, label: e.target.value })}
              required
            />
            <Input
              label="URL Webhook (Google Apps Script Web App)"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={editingWh.webhook_url || ''}
              onChange={(e) => setEditingWh({ ...editingWh, webhook_url: e.target.value })}
              required
              helperText="Pastikan deployment Web App diset ke 'Who has access: Anyone'"
            />
            <Input
              label="Secret Token (Opsional)"
              placeholder="asap_secret_tok_1"
              value={editingWh.secret_token || ''}
              onChange={(e) => setEditingWh({ ...editingWh, secret_token: e.target.value })}
            />
            <Select
              label="Trigger Event Utama"
              value={editingWh.trigger_events?.[0] || 'all'}
              onChange={(e) => setEditingWh({ ...editingWh, trigger_events: [e.target.value] })}
            >
              <option value="all">Semua Event (Pesanan Baru & Pembayaran)</option>
              <option value="restaurant_paid">Transaksi Restoran Lunas</option>
              <option value="lodging_paid">Transaksi Inap Lunas</option>
              <option value="order_created">Pesanan Baru Dibuat</option>
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

      {/* Google Apps Script Code Modal */}
      {isScriptModalOpen && (
        <Modal
          isOpen={isScriptModalOpen}
          onClose={() => setIsScriptModalOpen(false)}
          title="Script Google Apps Script (Webhook Receiver)"
          subtitle="Salin dan tempel kode ini ke Extensions > Apps Script pada Google Spreadsheet Anda"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-stone-100 rounded-xl">
              <span className="font-semibold text-stone-700">
                Otomatis membuat tab <strong>Tamu_Restoran</strong> dan <strong>Tamu_Penginapan</strong>
              </span>
              <Button
                variant="amber"
                size="sm"
                onClick={handleCopyScript}
                className={`font-bold flex items-center gap-1.5 ${isCopied ? '!bg-emerald-600 !text-white' : ''}`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Script'}</span>
              </Button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed border border-stone-800">
                {googleAppsScriptCode}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-200">
              <Button variant="outline" size="sm" onClick={() => setIsScriptModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
