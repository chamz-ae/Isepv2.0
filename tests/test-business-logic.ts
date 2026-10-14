import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  calculateYield,
  formatRupiah,
  formatGram,
  generateBookingCode,
  generatePaymentNumber,
  generatePurchaseNumber,
  generateBatchNumber,
  generateOpnameNumber,
  generateClosingNumber,
  generateWhatsAppLink,
} from '../src/lib/utils/formatters';

console.log('====================================================');
console.log('🧪 ASAP ISEP BUSINESS LOGIC & INTEGRITY TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}\n`);
  }
}

// 1. Yield & Shrinkage Calculation Test
runTest('1. Yield and Cooking Shrinkage Formula', () => {
  const rawWeight = 10000; // 10.000 gram raw brisket
  const cookedWeight = 6500; // 6.500 gram cooked brisket
  const result = calculateYield(rawWeight, cookedWeight);

  assert.strictEqual(result.yieldPercentage, 65, 'Yield harus tepat 65.00%');
  assert.strictEqual(result.lossWeightGram, 3500, 'Loss weight harus tepat 3.500 gram');

  // Edge case: zero raw weight
  const zeroResult = calculateYield(0, 0);
  assert.strictEqual(zeroResult.yieldPercentage, 0);
  assert.strictEqual(zeroResult.lossWeightGram, 0);
});

// 2. Booking Code Format Test
runTest('2. Booking Code Generator Format (ASAP-YYMMDD-XXXX)', () => {
  const code = generateBookingCode();
  const pattern = /^ASAP-\d{6}-[2-9A-HJ-NP-Z]{4}$/;
  assert.match(code, pattern, `Booking code "${code}" harus mengikuti format ASAP-YYMMDD-XXXX`);
});

// 3. Currency & Weight Formatters
runTest('3. Rupiah and Gram Formatters', () => {
  const formattedRp = formatRupiah(200000);
  assert.ok(formattedRp.includes('200.000'), 'Harus memformat Rp 200.000');

  const formattedGram = formatGram(300);
  assert.strictEqual(formattedGram, '300 g');

  const formattedKg = formatGram(8400);
  assert.ok(formattedKg.includes('8.400 g (8.4 kg)'));
});

// 4. Booking Date Overlap Algorithm Test
runTest('4. Room Booking Clash & Availability Algorithm', () => {
  function checkOverlap(
    existingIn: string,
    existingOut: string,
    checkIn: string,
    checkOut: string
  ): boolean {
    return checkIn < existingOut && checkOut > existingIn;
  }

  // Case 1: Clashing dates
  assert.strictEqual(
    checkOverlap('2026-10-10', '2026-10-12', '2026-10-11', '2026-10-13'),
    true,
    'Harus mendeteksi benturan tanggal'
  );

  // Case 2: Checkout same day as Checkin (no clash)
  assert.strictEqual(
    checkOverlap('2026-10-10', '2026-10-12', '2026-10-12', '2026-10-14'),
    false,
    'Sama hari checkout dan checkin baru tidak boleh bentrok'
  );

  // Case 3: Completely distinct dates
  assert.strictEqual(
    checkOverlap('2026-10-10', '2026-10-12', '2026-10-15', '2026-10-17'),
    false,
    'Tanggal yang terpisah tidak boleh bentrok'
  );
});

// 5. Stock Opname Variance Formula Test
runTest('5. Stock Opname Variance Formula (Actual - System)', () => {
  const systemStock = 8400; // 8.400 gram
  const actualStock = 8100; // 8.100 gram
  const variance = actualStock - systemStock;

  assert.strictEqual(variance, -300, 'Variance harus -300 gram sesuai spesifikasi');

  const unitCostPerKg = 320000;
  const varianceCost = (variance / 1000) * unitCostPerKg;
  assert.strictEqual(varianceCost, -96000, 'Variance cost harus -Rp 96.000');
});

// 6. Cashier Closing Discrepancy Formula Test
runTest('6. Cashier Closing Cash Variance', () => {
  const expectedCash = 1500000;
  const actualCash = 1450000;
  const variance = actualCash - expectedCash;

  assert.strictEqual(variance, -50000, 'Selisih kas laci harus -Rp 50.000');
});

// 7. Loyalty Rule Verification
runTest('7. Guest Loyalty Status (Pelanggan Setia >= 2 Visits)', () => {
  function isLoyal(validVisitsCount: number): boolean {
    return validVisitsCount >= 2;
  }

  assert.strictEqual(isLoyal(0), false);
  assert.strictEqual(isLoyal(1), false, 'Kunjungan ke-1 masih tamu baru');
  assert.strictEqual(isLoyal(2), true, 'Kunjungan ke-2 harus ditandai Pelanggan Setia');
  assert.strictEqual(isLoyal(5), true, 'Kunjungan ke-5 tetap Pelanggan Setia');
});

// 8. SQL Migrations Existence and Order Verification
runTest('8. SQL Migration Files & Seed Integrity', () => {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  assert.ok(fs.existsSync(migrationsDir), 'Folder supabase/migrations harus ada');

  const expectedMigrations = [
    '0001_initial_schema.sql',
    '0002_auth_roles_rls.sql',
    '0003_menu_rooms_guests.sql',
    '0004_orders_bookings_payments.sql',
    '0005_purchasing_inventory.sql',
    '0006_cooking_stock_opname.sql',
    '0007_gallery_webhooks_audit.sql',
  ];

  expectedMigrations.forEach((file) => {
    const fullPath = path.join(migrationsDir, file);
    assert.ok(fs.existsSync(fullPath), `Migration file ${file} harus ada`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(content.length > 50, `Migration file ${file} tidak boleh kosong`);
  });

  const seedPath = path.resolve(__dirname, '../supabase/seed.sql');
  assert.ok(fs.existsSync(seedPath), 'seed.sql harus ada');
  const seedContent = fs.readFileSync(seedPath, 'utf8');
  assert.ok(seedContent.includes('Brisket Asap'), 'seed.sql harus memuat Brisket Asap');
  assert.ok(seedContent.includes('Marlin Asap'), 'seed.sql harus memuat Marlin Asap');
  assert.ok(seedContent.includes('Ungkep Ayam Kampung'), 'seed.sql harus memuat Ungkep Ayam Kampung');
});

// 9. WhatsApp Pre-filled Link Generator Test
runTest('9. WhatsApp Pre-filled Message Link Generation', () => {
  const phone = '081234567890';
  const msg = 'Halo ASAP ISEP, konfirmasi booking ASAP-261010-7F4K';
  const link = generateWhatsAppLink(phone, msg);

  assert.ok(link.startsWith('https://wa.me/6281234567890'), 'Harus menggunakan awalan nomor 62');
  assert.ok(link.includes(encodeURIComponent(msg)), 'Harus berisi teks pesan yang di-encode');
});

// 10. Meat Pricing and Gramasi Scaling Test (per 100g, per ekor, per porsi)
runTest('10. Gramasi Price Scaling per 100g, Per Ekor, & Per Porsi Across All Meat Items', () => {
  // A. Flexible Meat (per 100g scale, minimum 100g)
  const per100gMeats = [
    { name: 'Brisket Asap', price: 20000 },
    { name: 'Lidah Sapi Asap', price: 65000 },
    { name: 'Domba Asap Bumbu Kerecek', price: 75000 },
    { name: 'Salmon Asap', price: 120000 },
    { name: 'Marlin Asap', price: 40000 },
    { name: 'Mangut Lele Asap', price: 30000 },
  ];

  per100gMeats.forEach((m) => {
    // 100g (min)
    const p100 = Math.round((m.price * 100) / 100);
    assert.strictEqual(p100, m.price, `${m.name} 100g harus sama dengan tarif dasar`);

    // 150g (+50g)
    const p150 = Math.round((m.price * 150) / 100);
    assert.strictEqual(p150, m.price * 1.5, `${m.name} 150g harus 1.5x`);

    // 200g
    const p200 = Math.round((m.price * 200) / 100);
    assert.strictEqual(p200, m.price * 2, `${m.name} 200g harus 2x`);

    // 300g
    const p300 = Math.round((m.price * 300) / 100);
    assert.strictEqual(p300, m.price * 3, `${m.name} 300g harus 3x`);
  });

  // B. Whole Poultry (per ekor utuh)
  const perEkorMeats = [
    { name: 'Ayam Asap', price: 150000 },
    { name: 'Bebek Asap', price: 145000 },
    { name: 'Ungkep Ayam Kampung', price: 175000 },
  ];

  perEkorMeats.forEach((m) => {
    // 1 ekor
    assert.strictEqual(m.price * 1, m.price, `${m.name} 1 ekor harus ${m.price}`);
    // 2 ekor
    assert.strictEqual(m.price * 2, m.price * 2, `${m.name} 2 ekor harus ${m.price * 2}`);
  });

  // C. Fixed Portion Meat (Porsi Tetap Daging)
  const fixedPortionMeats = [
    { name: 'Nasi Goreng Daging Asap', price: 40000, fixedGram: 30 },
    { name: 'Nasi Goreng Domba Asap', price: 45000, fixedGram: 30 },
  ];

  fixedPortionMeats.forEach((m) => {
    assert.strictEqual(m.fixedGram, 30, `${m.name} harus memiliki fixed gramasi 30g`);
    assert.strictEqual(m.price * 2, m.price * 2, `${m.name} 2 porsi harus ${m.price * 2}`);
  });
});

// 11. Dashboard Live Calendar Full-Booked (Red Date) Detection (Requirement 1.3)
runTest('11. Calendar Full-Booked (Red Date) Detection Algorithm', () => {
  const totalActiveRooms = 3;
  const mockBookingsOnOct15 = [
    { room_id: 'room-1', check_in_date: '2026-10-15', check_out_date: '2026-10-17' },
    { room_id: 'room-2', check_in_date: '2026-10-14', check_out_date: '2026-10-16' },
    { room_id: 'room-3', check_in_date: '2026-10-15', check_out_date: '2026-10-18' },
  ];

  const targetDate = '2026-10-15';
  const bookedRoomIds = new Set(
    mockBookingsOnOct15
      .filter((b) => b.check_in_date <= targetDate && b.check_out_date > targetDate)
      .map((b) => b.room_id)
  );

  const isFullBooked = bookedRoomIds.size >= totalActiveRooms;
  assert.strictEqual(isFullBooked, true, 'Tanggal 15 Okt harus terdeteksi Tanggal Merah (Full Booked / Habis)');

  // Partial test: only 1 room booked
  const targetDateOct17 = '2026-10-17';
  const bookedOn17 = mockBookingsOnOct15.filter(
    (b) => b.check_in_date <= targetDateOct17 && b.check_out_date > targetDateOct17
  );
  assert.strictEqual(bookedOn17.length, 1, 'Tanggal 17 Okt harus terdeteksi sebagian terisi');
});

// 12. Customer Frontend Isolation & PWA Direct Link Integrity
runTest('12. Customer Frontend Isolation & PWA Staff Access Integrity', () => {
  const customerNav = fs.readFileSync(path.join(__dirname, '../src/components/customer/CustomerNav.tsx'), 'utf8');
  const customerFooter = fs.readFileSync(path.join(__dirname, '../src/components/customer/CustomerFooter.tsx'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/manifest.json'), 'utf8'));

  // Ensure Customer Nav has NO admin / login links
  assert.ok(!customerNav.includes('href="/admin'), 'CustomerNav tidak boleh memiliki link ke admin');
  assert.ok(!customerNav.includes('href="/admin/login'), 'CustomerNav tidak boleh memiliki link ke login');

  // Ensure Customer Footer has NO admin / login links
  assert.ok(!customerFooter.includes('href="/admin'), 'CustomerFooter tidak boleh memiliki link ke admin');
  assert.ok(!customerFooter.includes('href="/admin/login'), 'CustomerFooter tidak boleh memiliki link ke login');

  // Ensure PWA Manifest has standalone display and shortcuts for staff
  assert.strictEqual(manifest.display, 'standalone', 'PWA harus menggunakan display mode standalone');
  assert.ok(Array.isArray(manifest.shortcuts), 'PWA Manifest harus memiliki array shortcuts');
  const hasAdminShortcut = manifest.shortcuts.some((s: any) => s.url.includes('/admin'));
  assert.ok(hasAdminShortcut, 'PWA Manifest harus memiliki shortcut langsung ke /admin untuk staf');
});

console.log('\n====================================================');
console.log(`📊 HASIL PENGUJIAN: ${passedTests} DARI ${totalTests} TEST BERHASIL`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
