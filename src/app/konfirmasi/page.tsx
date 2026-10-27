'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Copy,
  Check,
  Phone,
  Calendar,
  BedDouble,
  UtensilsCrossed,
  ArrowLeft,
  Printer,
  Search,
  User,
  MessageCircle,
  Clock,
} from 'lucide-react'
import { getOrderByBookingCode } from '@/lib/services/orderService'
import { Order } from '@/lib/supabase/types'
import { formatRupiah, formatDateWIB } from '@/lib/utils/formatters'
import { CustomerFooter } from '@/components/customer/CustomerFooter'

/* ─────────────────────────────────────────────
   ADMIN WHATSAPP NUMBER
───────────────────────────────────────────── */
const ADMIN_WHATSAPP = '6281234567890' // TODO: replace with real number

/* ─────────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────────── */
function VoucherSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto animate-pulse space-y-4 pt-10">
      <div className="h-6 w-48 bg-stone-800 rounded mx-auto" />
      <div className="h-96 w-full bg-stone-900 rounded-2xl border border-stone-800" />
    </div>
  )
}

/* ─────────────────────────────────────────────
   NOT-FOUND / ERROR STATE
───────────────────────────────────────────── */
function NotFoundState({ initialCode }: { initialCode: string }) {
  const [inputCode, setInputCode] = useState(initialCode)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputCode.trim().toUpperCase()
    if (trimmed) {
      window.location.href = `/konfirmasi?code=${encodeURIComponent(trimmed)}`
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto text-center space-y-10 pt-10">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full border border-stone-700 flex items-center justify-center">
          <Search className="w-8 h-8 text-stone-500" strokeWidth={1} />
        </div>
      </div>

      {/* Copy */}
      <div className="space-y-3">
        <p
          className="font-mono text-xs tracking-[0.25em] uppercase text-stone-500"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          Kode Tidak Ditemukan
        </p>
        <h2
          className="text-3xl text-stone-200 font-light italic"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Reservasi tidak ditemukan
        </h2>
        <p
          className="text-sm text-stone-500 leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Kode pemesanan{' '}
          {initialCode && (
            <span
              className="text-amber-400 font-mono"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {initialCode}
            </span>
          )}{' '}
          tidak kami temukan. Periksa kembali kode yang Anda terima melalui
          WhatsApp atau email.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="MASUKKAN KODE PEMESANAN"
            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-5 py-4 text-center
                       text-amber-400 placeholder-stone-600 tracking-[0.2em] text-sm
                       focus:outline-none focus:border-amber-700/60 transition-colors"
            style={{ fontFamily: "'DM Mono', monospace" }}
          />
        </div>
        <button
          type="submit"
          className="w-full py-4 rounded-lg border border-amber-800/60 text-amber-400
                     hover:bg-amber-900/20 transition-colors tracking-[0.15em] text-xs font-mono
                     flex items-center justify-center gap-2"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          <Search className="w-4 h-4" strokeWidth={1.5} />
          CARI RESERVASI
        </button>
      </form>

      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs text-stone-600 hover:text-stone-400
                   transition-colors tracking-widest uppercase"
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
        Kembali ke Beranda
      </Link>
    </div>
  )
}

/* ─────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Salin kode pemesanan"
      className="ml-3 p-2 rounded-md border border-amber-800/40 text-amber-600
                 hover:border-amber-600 hover:text-amber-400 transition-all duration-200
                 flex-shrink-0"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-400" strokeWidth={2} />
      ) : (
        <Copy className="w-4 h-4" strokeWidth={1.5} />
      )}
    </button>
  )
}

/* ─────────────────────────────────────────────
   DETAIL ROW
───────────────────────────────────────────── */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-stone-500 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p
          className="text-[10px] tracking-[0.2em] uppercase text-stone-600 mb-0.5"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {label}
        </p>
        <p
          className="text-sm text-stone-200 leading-snug"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PAYMENT STATUS BADGE
───────────────────────────────────────────── */
function PaymentBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase()

  const config: Record<string, { label: string; color: string }> = {
    paid: { label: 'LUNAS', color: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40' },
    pending: { label: 'MENUNGGU PEMBAYARAN', color: 'text-amber-400 border-amber-800/60 bg-amber-950/40' },
    dp: { label: 'DP TERBAYAR', color: 'text-sky-400 border-sky-800/60 bg-sky-950/40' },
    cancelled: { label: 'DIBATALKAN', color: 'text-red-400 border-red-800/60 bg-red-950/40' },
  }

  const cfg = config[normalized] ?? { label: status?.toUpperCase() ?? '-', color: 'text-stone-400 border-stone-700 bg-stone-800/40' }

  return (
    <span
      className={`inline-block px-3 py-1 rounded border text-[10px] tracking-[0.2em] ${cfg.color}`}
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {cfg.label}
    </span>
  )
}

/* ─────────────────────────────────────────────
   MAIN VOUCHER CARD
───────────────────────────────────────────── */
function VoucherCard({ order }: { order: Order }) {
  const isLodging =
    order.order_type?.toLowerCase() === 'lodging' ||
    order.order_type?.toLowerCase() === 'menginap'

  const isCatering =
    order.order_type?.toLowerCase() === 'catering' ||
    order.order_type?.toLowerCase() === 'makan'

  /* WhatsApp pre-filled message */
  const waMessage = encodeURIComponent(
    `Halo ASAP ISEP, saya ingin mengkonfirmasi reservasi saya.\n\n` +
      `*Kode Pemesanan:* ${order.booking_code}\n` +
      `*Nama:* ${order.guest_name}\n` +
      `*Total:* ${formatRupiah(order.total_amount)}\n\n` +
      `Mohon bantuannya. Terima kasih! 🙏`
  )
  const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${waMessage}`

  function handlePrint() {
    window.print()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── Confirmed label ── */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
        <span
          className="text-xs tracking-[0.25em] uppercase text-emerald-500"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          Reservasi Dikonfirmasi
        </span>
      </div>

      {/* ── VOUCHER CARD ── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-stone-700/60
                   bg-gradient-to-b from-stone-900 to-stone-950 shadow-2xl shadow-black/60
                   print:shadow-none print:border print:border-stone-300"
        style={{ boxShadow: '0 0 0 1px rgba(201,169,110,0.08), 0 25px 60px rgba(0,0,0,0.7)' }}
      >
        {/* Gold top accent line */}
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, #c9a96e 30%, #c9a96e 70%, transparent)',
          }}
        />

        {/* ── HEADER STRIP ── */}
        <div className="px-8 pt-8 pb-7 flex items-start justify-between gap-4">
          {/* Logo / Brand */}
          <div>
            <p
              className="text-2xl font-light tracking-widest text-stone-100"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              ASAP ISEP
            </p>
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mt-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Woodfire Smokehouse · Cisarua Puncak
            </p>
          </div>

          {/* Date + Status */}
          <div className="text-right space-y-2 flex-shrink-0">
            <p
              className="text-[10px] tracking-widest text-stone-500 uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {formatDateWIB(order.created_at ?? new Date().toISOString())}
            </p>
            <PaymentBadge status={order.payment_status ?? 'pending'} />
          </div>
        </div>

        {/* ── DASHED DIVIDER ── */}
        <div className="relative px-8">
          {/* Left notch */}
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-950 border border-stone-700/60 z-10" />
          {/* Right notch */}
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-950 border border-stone-700/60 z-10" />
          <div
            className="h-px w-full border-t border-dashed border-stone-700/60"
            style={{ borderColor: 'rgba(201,169,110,0.25)' }}
          />
        </div>

        {/* ── BOOKING CODE ── */}
        <div className="px-8 pt-7 pb-5 text-center">
          <p
            className="text-[9px] tracking-[0.35em] uppercase text-stone-600 mb-3"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Kode Pemesanan
          </p>
          <div className="flex items-center justify-center">
            <span
              className="text-4xl sm:text-5xl tracking-[0.15em] font-light select-all"
              style={{ fontFamily: "'DM Mono', monospace", color: '#c9a96e' }}
            >
              {order.booking_code}
            </span>
            <CopyButton text={order.booking_code ?? ''} />
          </div>
        </div>

        {/* ── DETAILS GRID ── */}
        <div className="px-8 pb-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailRow
              icon={<User className="w-4 h-4" strokeWidth={1.5} />}
              label="Nama Tamu"
              value={order.guest_name ?? '-'}
            />
            <DetailRow
              icon={<Phone className="w-4 h-4" strokeWidth={1.5} />}
              label="Nomor Telepon"
              value={order.guest_phone ?? '-'}
            />
            <DetailRow
              icon={
                isLodging ? (
                  <BedDouble className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <UtensilsCrossed className="w-4 h-4" strokeWidth={1.5} />
                )
              }
              label="Tipe Reservasi"
              value={
                <span className="capitalize">
                  {order.order_type ?? '-'}
                </span>
              }
            />
            <DetailRow
              icon={<Clock className="w-4 h-4" strokeWidth={1.5} />}
              label="Status Pembayaran"
              value={<PaymentBadge status={order.payment_status ?? 'pending'} />}
            />

            {/* Check-in / Check-out — lodging only */}
            {isLodging && order.check_in_date && (
              <DetailRow
                icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
                label="Check-in"
                value={formatDateWIB(order.check_in_date)}
              />
            )}
            {isLodging && order.check_out_date && (
              <DetailRow
                icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
                label="Check-out"
                value={formatDateWIB(order.check_out_date)}
              />
            )}
          </div>
        </div>

        {/* ── DASHED DIVIDER 2 ── */}
        <div className="relative px-8">
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-950 border border-stone-700/60 z-10" />
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-stone-950 border border-stone-700/60 z-10" />
          <div
            className="h-px w-full border-t border-dashed"
            style={{ borderColor: 'rgba(201,169,110,0.25)' }}
          />
        </div>

        {/* ── ORDER ITEMS ── */}
        {order.order_items && order.order_items.length > 0 && (
          <div className="px-8 pt-6 pb-4">
            <p
              className="text-[9px] tracking-[0.3em] uppercase text-stone-600 mb-4"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Daftar Pesanan
            </p>
            <div className="space-y-2">
              {order.order_items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5 border-b border-stone-800/60 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-6 h-6 rounded-sm bg-stone-800 border border-stone-700 flex items-center
                                 justify-center text-[10px] text-stone-500 flex-shrink-0"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {item.qty || 1}
                    </span>
                    <span
                      className="text-sm text-stone-200 truncate"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {(item as any).menu_name_snapshot || (item as any).name || 'Menu Pilihan'}
                    </span>
                  </div>
                  <span
                    className="text-xs text-stone-400 flex-shrink-0 ml-4"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {formatRupiah(item.subtotal || ((item.unit_price_snapshot || 0) * (item.qty || 1)))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TOTAL ── */}
        <div className="px-8 pt-3 pb-7">
          <div
            className="flex items-center justify-between pt-4 border-t"
            style={{ borderColor: 'rgba(201,169,110,0.2)' }}
          >
            <span
              className="text-xs tracking-[0.2em] uppercase text-stone-500"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Total Pembayaran
            </span>
            <span
              className="text-xl font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: '#c9a96e' }}
            >
              {formatRupiah(order.total_amount ?? 0)}
            </span>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div
          className="px-8 py-5 border-t flex flex-col sm:flex-row gap-3 print:hidden"
          style={{ borderColor: 'rgba(201,169,110,0.15)', background: 'rgba(0,0,0,0.2)' }}
        >
          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-lg
                       bg-emerald-900/30 border border-emerald-800/50 text-emerald-400
                       hover:bg-emerald-900/50 hover:border-emerald-700 transition-all duration-200
                       text-xs tracking-[0.15em] uppercase"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
            Konfirmasi via WhatsApp
          </a>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-lg
                       border text-amber-600 hover:text-amber-400 hover:border-amber-700
                       transition-all duration-200 text-xs tracking-[0.15em] uppercase"
            style={{
              fontFamily: "'DM Mono', monospace",
              borderColor: 'rgba(201,169,110,0.35)',
            }}
          >
            <Printer className="w-4 h-4" strokeWidth={1.5} />
            Cetak Voucher
          </button>
        </div>

        {/* Gold bottom accent line */}
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, #c9a96e 30%, #c9a96e 70%, transparent)',
          }}
        />
      </div>

      {/* ── Back link ── */}
      <div className="mt-8 text-center print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-stone-600 hover:text-stone-400
                     transition-colors tracking-widest uppercase"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   INNER COMPONENT (uses useSearchParams)
───────────────────────────────────────────── */
function KonfirmasiInner() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') ?? ''

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!code) {
      setNotFound(true)
      return
    }

    let cancelled = false

    async function fetchOrder() {
      setLoading(true)
      setNotFound(false)
      setOrder(null)

      try {
        const result = await getOrderByBookingCode(code)
        if (cancelled) return

        if (result) {
          setOrder(result)
        } else {
          setNotFound(true)
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchOrder()

    return () => {
      cancelled = true
    }
  }, [code])

  /* ── Loading ── */
  if (loading) {
    return <VoucherSkeleton />
  }

  /* ── Not found / no code ── */
  if (notFound || !code) {
    return <NotFoundState initialCode={code} />
  }

  /* ── Success ── */
  if (order) {
    return <VoucherCard order={order} />
  }

  return null
}

/* ─────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────── */
export default function KonfirmasiPage() {
  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border: 1px solid #ccc !important; }
          .print\\:border-stone-300 { border-color: #d4d4c8 !important; }
        }
      `}</style>

      <main
        className="min-h-screen bg-stone-950 px-4 py-16 sm:py-24"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.04) 0%, transparent 60%)',
        }}
      >
        {/* Page heading */}
        <div className="text-center mb-12 print:hidden">
          <p
            className="text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-3"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            ASAP ISEP · Cisarua Puncak
          </p>
          <h1
            className="text-4xl sm:text-5xl text-stone-100 font-light italic"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Konfirmasi Reservasi
          </h1>
          <div
            className="mt-4 mx-auto h-px w-24"
            style={{
              background:
                'linear-gradient(90deg, transparent, #c9a96e, transparent)',
            }}
          />
        </div>

        {/* Suspense boundary required for useSearchParams */}
        <Suspense fallback={<VoucherSkeleton />}>
          <KonfirmasiInner />
        </Suspense>
      </main>

      <CustomerFooter />
    </>
  )
}
