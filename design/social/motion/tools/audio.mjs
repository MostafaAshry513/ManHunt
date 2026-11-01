// Original generated score for the ManHunt short — no samples, no libraries.
// Sines, noise and one-pole filters only; every sound is synthesised here.
// Output: out/audio/manhunt_score.wav (15.00 s, 44.1 kHz, stereo, PCM16)
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SR = 44100;
const DUR = 15.0;
const N = Math.round(SR * DUR);
const L = new Float32Array(N);
const Rr = new Float32Array(N);

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const TAU = Math.PI * 2;
let seed = 20261101;
function rnd() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function add(i, v, pan) {
  if (i < 0 || i >= N) return;
  const p = pan == null ? 0 : Math.max(-1, Math.min(1, pan));
  const l = v * (p <= 0 ? 1 : 1 - p);
  const r = v * (p >= 0 ? 1 : 1 + p);
  L[i] += l;
  Rr[i] += r;
}

/* sine partial with exponential decay envelope */
function tone(start, dur, freq, amp, attack, decay, pan, second) {
  const s = Math.round(start * SR);
  const n = Math.round(dur * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const a = attack > 0 ? clamp01(t / attack) : 1;
    const env = a * Math.exp(-t * decay);
    let v = Math.sin(TAU * freq * t) * amp * env;
    if (second) v += Math.sin(TAU * freq * second * t) * amp * env * 0.35;
    add(s + k, v, pan);
  }
}

/* low impact with a downward pitch sweep */
function thump(start, amp, f0, f1, dur, pan) {
  const s = Math.round(start * SR);
  const n = Math.round(dur * SR);
  let phase = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const f = f0 + (f1 - f0) * clamp01(t / dur);
    phase += TAU * f / SR;
    const env = Math.exp(-t * 9) * (1 - Math.exp(-t * 900));
    add(s + k, Math.sin(phase) * amp * env, pan);
  }
}

/* filtered noise burst (band character via one-pole high/low pass) */
function noise(start, dur, amp, hpHz, lpHz, envFn, pan) {
  const s = Math.round(start * SR);
  const n = Math.round(dur * SR);
  const hpCoef = Math.exp(-TAU * hpHz / SR);
  const lpCoef = Math.exp(-TAU * (lpHz || 18000) / SR);
  let prev = 0, hp = 0, lp = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const white = rnd() * 2 - 1;
    hp = white - prev + hpCoef * hp;
    prev = white;
    lp = lp + (1 - lpCoef) * (hp - lp);
    const env = envFn ? envFn(t, dur) : Math.exp(-t * 12);
    add(s + k, lp * amp * env, pan);
  }
}

/* ── 1 · chalk scratch (0.00–0.95) ───────────────────────────────────────── */
noise(0.02, 0.92, 0.22, 900, 9000, (t, d) => {
  const a = clamp01(t / 0.04) * clamp01((d - t) / 0.18);
  const scratch = 0.55 + 0.45 * Math.abs(Math.sin(TAU * 13 * t + 1.3));
  return a * scratch;
}, -0.15);

/* ── 2 · sub drone under the whole bed (0.0–12.0) ────────────────────────── */
{
  const s = 0, n = Math.round(12.0 * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = clamp01(t / 0.6) * clamp01((12.0 - t) / 0.35) * 0.14;
    const v = Math.sin(TAU * 48 * t) * 0.55 + Math.sin(TAU * 72 * t + 0.4) * 0.22;
    add(s + k, v * env, 0);
  }
}

/* ── 3 · the clock: ticks 4.0 → 11.9, panning with the seconds ───────────── */
for (let sec = 4.0; sec <= 11.9; sec += 1.0) {
  const pan = (Math.round(sec) % 2 === 0) ? -0.22 : 0.22;
  thump(sec, 0.10, 180, 120, 0.06, pan);
  noise(sec, 0.035, 0.10, 2400, 11000, null, pan);
}

/* ── 4 · low pulse through "two teams" (1.5, 2.5, 3.5) ───────────────────── */
[1.5, 2.5, 3.5].forEach((t, i) => {
  thump(t, 0.20 - i * 0.02, 62, 46, 0.55, 0);
  noise(t, 0.05, 0.05, 1200, 7000, null, 0.1);
});

/* ── 5 · single ping when the map pings (7.00, and a second at 8.10) ─────── */
tone(7.0, 0.55, 880, 0.16, 0.004, 8.5, 0.18, 2);
tone(8.10, 0.45, 660, 0.11, 0.004, 9.0, -0.18, 2);
tone(9.10, 0.40, 560, 0.08, 0.004, 10.0, 0.12, 2);

/* ── 6 · the tag snap (10.36) ────────────────────────────────────────────── */
thump(10.355, 0.55, 130, 38, 0.55, 0);
noise(10.355, 0.10, 0.30, 700, 12000, (t, d) => Math.exp(-t * 45), 0.1);
tone(10.355, 0.30, 1320, 0.10, 0.002, 16, -0.2, 1.5);

/* ── 7 · hard cut to black (9.9667) — a beat of near-silence ─────────────── */
// (nothing added: the bed dips here naturally before the snap)

/* ── 8 · end card: silence after 12.0, per the brand beat sheet ───────────── */

/* ── master: soft saturation + normalise ─────────────────────────────────── */
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1);
  Rr[i] = Math.tanh(Rr[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rr[i]));
}
const gain = peak > 0 ? 0.72 / peak : 1;

await mkdir(path.join(ROOT, 'out', 'audio'), { recursive: true });
const data = Buffer.alloc(44 + N * 4);
data.write('RIFF', 0);
data.writeUInt32LE(36 + N * 4, 4);
data.write('WAVE', 8);
data.write('fmt ', 12);
data.writeUInt32LE(16, 16);
data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22);
data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32);
data.writeUInt16LE(16, 34);
data.write('data', 36);
data.writeUInt32LE(N * 4, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), o); o += 2;
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[i] * gain)) * 32767), o); o += 2;
}
const out = path.join(ROOT, 'out', 'audio', 'manhunt_score.wav');
await writeFile(out, data);
console.log('wrote ' + out + '  (' + DUR.toFixed(2) + ' s, ' + data.length + ' bytes, peak ' + (0.72).toFixed(2) + ')');
