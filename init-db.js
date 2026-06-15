/**
 * Smoke tests for the language-agnostic AI heuristics.
 * Runs on the Node.js built-in test runner — no extra dependencies:
 *   npm test   →   node --test
 *
 * analyzeSentiment / scoreMessage are pure functions and never touch the DB,
 * so these tests run without a database connection.
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { analyzeSentiment, scoreMessage, SENT_LABEL } = require('../ai');

// ── Sentiment: Vietnamese ─────────────────────────────────────────────
test('sentiment — Vietnamese angry', () => {
  assert.equal(analyzeSentiment('Hàng lỗi, tôi muốn hoàn tiền'), 'angry');
});
test('sentiment — Vietnamese buy intent', () => {
  assert.equal(analyzeSentiment('Mình chốt đơn nhé, chuyển khoản luôn'), 'intent_buy');
});
test('sentiment — Vietnamese happy', () => {
  assert.equal(analyzeSentiment('Tuyệt vời, cảm ơn shop!'), 'happy');
});

// ── Sentiment: English (newly bilingual) ──────────────────────────────
test('sentiment — English angry', () => {
  assert.equal(analyzeSentiment('This is terrible, I want a refund'), 'angry');
});
test('sentiment — English buy intent', () => {
  assert.equal(analyzeSentiment('I want to buy this, place order please'), 'intent_buy');
});
test('sentiment — English question', () => {
  assert.equal(analyzeSentiment('How much is shipping?'), 'questioning');
});
test('sentiment — neutral fallback', () => {
  assert.equal(analyzeSentiment('hello'), 'neutral');
});

// ── Lead scoring ──────────────────────────────────────────────────────
test('lead scoring — price question scores (VI & EN)', () => {
  assert.ok(scoreMessage('giá bao nhiêu').some(e => e.label === 'Hỏi giá'));
  assert.ok(scoreMessage('what is the price?').some(e => e.label === 'Hỏi giá'));
});
test('lead scoring — local VN phone detected', () => {
  assert.ok(scoreMessage('số mình là 0901234567').some(e => e.label === 'Cung cấp số điện thoại'));
});
test('lead scoring — international phone detected', () => {
  assert.ok(scoreMessage('call me at +1 415 555 0132').some(e => e.label === 'Cung cấp số điện thoại'));
});
test('lead scoring — every message scores the base event', () => {
  assert.ok(scoreMessage('hi').some(e => e.label === 'Gửi tin nhắn'));
});
test('lead scoring — buy intent outscores a greeting', () => {
  const buy = scoreMessage('i want to buy now').reduce((s,e)=>s+e.delta,0);
  const hi  = scoreMessage('xin chào').reduce((s,e)=>s+e.delta,0);
  assert.ok(buy > hi);
});

// ── Robustness ────────────────────────────────────────────────────────
test('robustness — empty/undefined input does not throw', () => {
  assert.equal(analyzeSentiment(undefined), 'neutral');
  assert.deepEqual(scoreMessage(undefined).map(e => e.label), ['Gửi tin nhắn']);
});

// ── Labels present (Vietnamese UI) ────────────────────────────────────
test('sentiment labels exist', () => {
  assert.equal(SENT_LABEL.angry.label, 'Giận dữ');
  assert.equal(SENT_LABEL.intent_buy.label, 'Muốn mua');
});
