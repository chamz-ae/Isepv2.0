// ============================================================
// FORMATTERS & BUSINESS LOGIC HELPERS
// Timezone: Asia/Jakarta (WIB) consistent
// ============================================================

export function formatRupiah(value: number | string | null | undefined): string {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (numeric === null || numeric === undefined || isNaN(numeric)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function formatGram(gram: number | null | undefined): string {
  if (!gram && gram !== 0) return '0 g';
  if (gram >= 1000) {
    const kg = parseFloat((gram / 1000).toFixed(2));
    return `${gram.toLocaleString('id-ID')} g (${kg} kg)`;
  }
  return `${gram.toLocaleString('id-ID')} g`;
}

export function formatKg(kg: number | null | undefined): string {
  if (!kg && kg !== 0) return '0 kg';
  return `${kg.toLocaleString('id-ID')} kg`;
}

export function formatDateWIB(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTimeWIB(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';
  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d) + ' WIB'
  );
}

export function formatDateTimeWIB(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  return `${formatDateWIB(dateInput)} ${formatTimeWIB(dateInput)}`;
}

export function generateBookingCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ASAP-${yy}${mm}${dd}-${rand}`;
}

export function generatePaymentNumber(): string {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${yyyymmdd}-${rand}`;
}

export function generatePurchaseNumber(): string {
  const now = new Date();
  const yyyymm = now.toISOString().slice(0, 7).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `PO-${yyyymm}-${rand}`;
}

export function generateBatchNumber(): string {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10 + Math.random() * 90);
  return `BATCH-${yyyymmdd}-${rand}`;
}

export function generateOpnameNumber(): string {
  const now = new Date();
  const yyyymm = now.toISOString().slice(0, 7).replace(/-/g, '');
  const rand = Math.floor(10 + Math.random() * 90);
  return `SO-${yyyymm}-${rand}`;
}

export function generateClosingNumber(): string {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10 + Math.random() * 90);
  return `CLS-${yyyymmdd}-${rand}`;
}

export function calculateYield(
  rawWeightGram: number,
  cookedWeightGram: number
): { yieldPercentage: number; lossWeightGram: number } {
  if (!rawWeightGram || rawWeightGram <= 0) {
    return { yieldPercentage: 0, lossWeightGram: 0 };
  }
  const lossWeightGram = Math.max(0, rawWeightGram - cookedWeightGram);
  const yieldPercentage = parseFloat(((cookedWeightGram / rawWeightGram) * 100).toFixed(2));
  return { yieldPercentage, lossWeightGram };
}

export function generateWhatsAppLink(phone: string, text: string): string {
  // Clean phone number to Indonesian international format
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
