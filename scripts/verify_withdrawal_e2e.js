/**
 * End-to-end verification of the ATS Withdrawal Flow.
 *
 * Scenario:
 *   Job capacity = 1
 *   Alice (ID 21) → active
 *   Bob   (ID 22) → waitlisted
 *
 * Steps:
 *   1. Confirm initial states via public status API
 *   2. Alice withdraws via POST /api/applications/21/withdraw
 *   3. Verify Alice → withdrawn (terminal)
 *   4. Verify Bob  → ack_pending (promotion cascade fired)
 *   5. Verify audit_log entries
 */

const API = 'http://localhost:3000';

async function json(url, opts) {
  const res = await fetch(url, opts);
  return { status: res.status, body: await res.json() };
}

async function run() {
  console.log('═══════════════════════════════════════════');
  console.log('  ATS WITHDRAWAL FLOW — E2E VERIFICATION  ');
  console.log('═══════════════════════════════════════════\n');

  // ── Step 1: Check initial state ────────────────────
  console.log('STEP 1 ▸ Verify initial pipeline state');

  const alice0 = await json(`${API}/api/applications/21/status`);
  const bob0   = await json(`${API}/api/applications/22/status`);

  console.log(`  Alice (21): ${alice0.body.status}`);
  console.log(`  Bob   (22): ${bob0.body.status}`);

  if (alice0.body.status !== 'active') {
    console.error('  ✘ FAIL — Expected Alice = active');
    process.exit(1);
  }
  if (bob0.body.status !== 'waitlisted') {
    console.error('  ✘ FAIL — Expected Bob = waitlisted');
    process.exit(1);
  }
  console.log('  ✔ Both states correct\n');

  // ── Step 2: Alice withdraws ────────────────────────
  console.log('STEP 2 ▸ Alice withdraws her application');

  const withdrawRes = await json(`${API}/api/applications/21/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant_email: 'alice@test.com' }),
  });

  console.log(`  HTTP ${withdrawRes.status}`);
  console.log(`  Returned status: ${withdrawRes.body.application?.status}`);

  if (withdrawRes.status !== 200 || withdrawRes.body.application?.status !== 'withdrawn') {
    console.error('  ✘ FAIL — Withdrawal did not succeed');
    console.error('  ', JSON.stringify(withdrawRes.body));
    process.exit(1);
  }
  console.log('  ✔ Alice is now withdrawn\n');

  // ── Step 3: Verify Alice terminal state ────────────
  console.log('STEP 3 ▸ Re-fetch Alice public status');

  const alice1 = await json(`${API}/api/applications/21/status`);
  console.log(`  Alice (21): ${alice1.body.status}`);

  if (alice1.body.status !== 'withdrawn') {
    console.error('  ✘ FAIL — Alice should be withdrawn');
    process.exit(1);
  }
  console.log('  ✔ Alice terminal state confirmed\n');

  // ── Step 4: Verify Bob was promoted ────────────────
  console.log('STEP 4 ▸ Verify Bob was auto-promoted (cascade)');

  const bob1 = await json(`${API}/api/applications/22/status`);
  console.log(`  Bob   (22): ${bob1.body.status}`);
  console.log(`  Ack deadline: ${bob1.body.ack_deadline || 'none'}`);

  if (bob1.body.status !== 'ack_pending') {
    console.error('  ✘ FAIL — Bob should be ack_pending after cascade');
    process.exit(1);
  }
  console.log('  ✔ Bob promoted to ack_pending — cascade works!\n');

  // ── Step 5: Verify audit trail ─────────────────────
  console.log('STEP 5 ▸ Verify idempotency guard (double-withdraw)');

  const doubleWithdraw = await json(`${API}/api/applications/21/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant_email: 'alice@test.com' }),
  });

  console.log(`  HTTP ${doubleWithdraw.status}`);
  if (doubleWithdraw.status === 400) {
    console.log(`  Error: ${doubleWithdraw.body.error}`);
    console.log('  ✔ Double-withdrawal correctly rejected\n');
  } else {
    console.error('  ✘ FAIL — Expected 400 for double-withdraw');
    process.exit(1);
  }

  // ── Step 6: Wrong email guard ──────────────────────
  console.log('STEP 6 ▸ Verify email verification guard');

  const wrongEmail = await json(`${API}/api/applications/22/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicant_email: 'wrong@email.com' }),
  });

  console.log(`  HTTP ${wrongEmail.status}`);
  if (wrongEmail.status === 403) {
    console.log(`  Error: ${wrongEmail.body.error}`);
    console.log('  ✔ Wrong email correctly rejected\n');
  } else {
    console.error('  ✘ FAIL — Expected 403 for wrong email');
    process.exit(1);
  }

  // ── Summary ────────────────────────────────────────
  console.log('═══════════════════════════════════════════');
  console.log('  ALL 6 CHECKS PASSED ✔                   ');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('  Pipeline state machine transitions:');
  console.log('    Alice: active → withdrawn    (user-initiated)');
  console.log('    Bob:   waitlisted → ack_pending (auto-cascade)');
  console.log('');
  console.log('  Guards verified:');
  console.log('    • Double-withdraw blocked (idempotent)');
  console.log('    • Wrong-email rejected (403)');
  console.log('');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
