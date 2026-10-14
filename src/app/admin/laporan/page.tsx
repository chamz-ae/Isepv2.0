'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import {
  generateReportSummary,
  exportReportToExcel,
  exportReportToPDF,
  ReportFilter,
  ReportSummary,
} from '@/lib/services/reportService';
import { formatRupiah, formatGram } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

export default function AdminLaporanPage() {
  const [filter, setFilter] = useState<ReportFilter>({
    dateRange: 'this_month',
    businessUnit: 'all',
  });

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [filter]);

  async function loadReport() {
    setIsLoading(true);
    try {
      const data = await generateReportSummary(filter);
      setSummary(data);
    } finally {
      setIsLoading(false);
    }
  }

  const getFilterLabel = () => {
    const rangeLabels: Record<string, string> = {
      today: 'Hari Ini',
      yesterday: 'Kemarin',
      this_week: 'Minggu Ini',
      this_month: 'Bulan Ini',
      this_year: 'Tahun Ini',
      custom: `${filter.startDate || ''} s/d ${filter.endDate || ''}`,
    };
    return `${rangeLabels[filter.dateRange]} (${filter.businessUnit.toUpperCase()})`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <span>Laporan Keuangan & Operasional</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Analisis omzet, laba rugi, konsumsi daging, dan tingkat hunian kabin dengan ekspor Excel (.xlsx) & PDF.
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportReportToExcel(summary, getFilterLabel())}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1 text-emerald-600" />
              <span>Ekspor Excel</span>
            </Button>
            <Button
              variant="amber"
              size="sm"
              onClick={() => exportReportToPDF(summary, getFilterLabel())}
            >
              <FileText className="w-4 h-4 mr-1" />
              <span>Ekspor PDF</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <Card className="bg-stone-50 border-stone-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <Select
            label="Rentang Waktu"
            value={filter.dateRange}
            onChange={(e) => setFilter({ ...filter, dateRange: e.target.value as any })}
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="this_year">Tahun Ini</option>
            <option value="custom">Custom Date Range</option>
          </Select>

          <Select
            label="Unit Bisnis"
            value={filter.businessUnit}
            onChange={(e) => setFilter({ ...filter, businessUnit: e.target.value as any })}
          >
            <option value="all">Semua Unit (Resto & Kabin)</option>
            <option value="restaurant">Restoran Saja</option>
            <option value="lodging">Penginapan Saja</option>
          </Select>

          {filter.dateRange === 'custom' && (
            <>
              <Input
                label="Tanggal Mulai"
                type="date"
                value={filter.startDate || ''}
                onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              />
              <Input
                label="Tanggal Selesai"
                type="date"
                value={filter.endDate || ''}
                onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              />
            </>
          )}
        </div>
      </Card>

      {summary && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-white to-stone-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Gross Revenue (Omzet)</span>
              <div className="text-2xl font-black text-stone-900 mt-1 font-mono">{formatRupiah(summary.grossRevenue)}</div>
              <div className="text-xs text-stone-500 mt-1">
                Resto: {formatRupiah(summary.restaurantRevenue)} • Inap: {formatRupiah(summary.lodgingRevenue)}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-stone-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Pengeluaran Belanja</span>
              <div className="text-2xl font-black text-red-600 mt-1 font-mono">{formatRupiah(summary.totalExpenses)}</div>
              <div className="text-xs text-stone-500 mt-1">{summary.purchases.length} Faktur Pembelian Supplier</div>
            </Card>

            <Card className="bg-stone-900 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Estimasi Laba Bersih</span>
              <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
                {formatRupiah(summary.estimatedNetProfit)}
              </div>
              <div className="text-xs text-stone-400 mt-1">Gross Revenue − Total Belanja</div>
            </Card>

            <Card className="bg-gradient-to-br from-white to-stone-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Kinerja Kabin Inap</span>
              <div className="text-2xl font-black text-sky-800 mt-1 font-mono">
                {summary.occupancyRatePercentage}%
              </div>
              <div className="text-xs text-stone-500 mt-1">Rata-rata Menginap: {summary.avgStayLengthDays} Malam</div>
            </Card>
          </div>

          {/* Payment Breakdown & Top Selling Menu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Distribusi Kanal Pembayaran" subtitle="Jumlah uang riil yang masuk melalui masing-masing metode" />
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg text-xs">
                  <span className="font-semibold text-stone-700">Cash / Tunai:</span>
                  <span className="font-bold text-stone-900 font-mono">{formatRupiah(summary.paymentBreakdown.cash)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg text-xs">
                  <span className="font-semibold text-stone-700">QRIS:</span>
                  <span className="font-bold text-stone-900 font-mono">{formatRupiah(summary.paymentBreakdown.qris)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg text-xs">
                  <span className="font-semibold text-stone-700">Transfer Bank:</span>
                  <span className="font-bold text-stone-900 font-mono">{formatRupiah(summary.paymentBreakdown.bankTransfer)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg text-xs">
                  <span className="font-semibold text-stone-700">Tagih Kamar (Room Charge):</span>
                  <span className="font-bold text-stone-900 font-mono">{formatRupiah(summary.paymentBreakdown.roomCharge)}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Menu Terlaris & Kontribusi Omzet" subtitle="10 menu dengan kuantitas porsi penjualan tertinggi" />
              {summary.topSellingMenus.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">Belum ada menu yang terjual pada rentang waktu ini.</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {summary.topSellingMenus.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-stone-50 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-stone-800">{m.name}</span>
                        <div className="text-[11px] text-stone-500">{m.portions} Porsi Terjual</div>
                      </div>
                      <span className="font-bold text-stone-900 font-mono">{formatRupiah(m.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Meat Usage Breakdown */}
          <Card>
            <CardHeader title="Konsumsi Daging (Meat Inventory Usage)" subtitle="Akumulasi berat aktual daging yang digunakan untuk pesanan" />
            {summary.meatUsageGrams.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">Belum ada pemakaian daging tercatat.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summary.meatUsageGrams.map((m, idx) => (
                  <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs">
                    <span className="font-bold uppercase tracking-wider text-stone-700 block text-[10px]">
                      🥩 {m.meatType}
                    </span>
                    <div className="text-base font-black text-stone-900 font-mono mt-1">
                      {formatGram(m.totalGrams)}
                    </div>
                    <span className="text-[10px] text-stone-500">{(m.totalGrams / 1000).toFixed(2)} Kilogram</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
