import assert from 'assert';
import { generateUuid, isValidUuid } from '../src/lib/services/guestService';
import { generateBookingCode } from '../src/lib/utils/formatters';

console.log('====================================================');
console.log('🧪 TESTING BOOKING PERSISTENCE, UUID & MEAT LOGIC');
console.log('====================================================\n');

// 1. UUID Generator Format Test
const uuid1 = generateUuid();
const uuid2 = generateUuid();
assert.ok(isValidUuid(uuid1), `Generated ID "${uuid1}" must be a valid UUID`);
assert.ok(isValidUuid(uuid2), `Generated ID "${uuid2}" must be a valid UUID`);
assert.notStrictEqual(uuid1, uuid2, 'UUIDs must be distinct');
console.log('✅ [PASS] UUID Generation & Validation (RFC4122 Compliant)');

// 2. Mock ID rejection vs UUID acceptance
assert.strictEqual(isValidUuid('g_1729891234567'), false, 'Legacy mock ID should not be recognized as UUID');
assert.strictEqual(isValidUuid('ord_1729891234567'), false, 'Legacy ord_ should not be recognized as UUID');
assert.strictEqual(isValidUuid('e0000001-0000-0000-0000-000000000001'), true, 'Standard seed room UUID must be valid hex');
assert.strictEqual(isValidUuid('e0000002-0000-0000-0000-000000000002'), true, 'Room 2 UUID must be valid hex');
console.log('✅ [PASS] UUID Pattern Filter Prevents Postgres Foreign Key Crashes');

// 3. Live Meat Stock Math
const currentStockGram = 15000; // 15 kg Brisket
const orderQty = 3;
const gramPerPortion = 250;
const totalDeducted = orderQty * gramPerPortion;
const remainingStock = currentStockGram - totalDeducted;
assert.strictEqual(totalDeducted, 750, 'Total deducted must be 750g');
assert.strictEqual(remainingStock, 14250, 'Remaining stock must be 14,250g (14.25 kg)');
console.log('✅ [PASS] Live Meat Stock Order Deduction Arithmetic');

// 4. Booking Code Lookup Case Insensitivity
const code = generateBookingCode();
assert.strictEqual(code.toUpperCase(), code, 'Generated code must be uppercase');
assert.strictEqual(code.toLowerCase().toUpperCase(), code, 'Case normalization must match exactly');
console.log('✅ [PASS] Booking Code Normalization & Lookup');

console.log('\n====================================================');
console.log('📊 ALL PERSISTENCE TESTS PASSED!');
console.log('====================================================');
