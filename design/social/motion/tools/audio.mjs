// Original generated score for the ManHunt motion workstream — no samples,
// no libraries. Sines, noise and one-pole filters only; every sound is synthesised.
//
//   node tools/audio.mjs 15   -> out/audio/manhunt_score.wav      (15.00 s, 9:16 film)
//   node tools/audio.mjs 30   -> out/audio/manhunt_score_30.wav   (30 s explainer cut)
//   node tools/audio.mjs 60   -> out/audio/manhunt_score_60.wav   (60 s explainer master)
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SR = 44100;
const MODE = process.argv[2] || '15';

const CONFIG = {
  '15': {
    dur: 15.0, out: 'manhunt_score.wav',
    chalk: [0.02, 0.94], drone: [0.0, 12.0],
    pulses: [1.5, 2.5, 3.5], pings: [7.0, 8.1, 9.1],
    riser: [6.6, 6.9], snap: 10.355, ticks: [4.0, 11.9], silenceFrom: 12.0
  },
  '30': {
    dur: 30.0, out: 'manhunt_score_30.wav',
    chalk: [0.02, 1.4], drone: [0.0, 28.0],
    pulses: [1.5, 4.0, 8.0, 12.0], pings: [8.3, 10.1, 12.4],
    riser: [16.0, 18.7], snap: 18.79, ticks: [20.5, 28.4], silenceFrom: 28.2,
    setup: [24.7], install: [27.2]
  },
  '60': {
    dur: 60.0, out: 'manhunt_score_60.wav',
    chalk: [0.02, 2.4], drone: [0.0, 56.4],
    pulses: [2.5, 8.5, 16.0, 24.0], pings: [16.4, 18.2, 20.0, 24.6, 25.4],
    riser: [32.0, 36.8], snap: 36.96, ticks: [40.0, 56.9], silenceFrom: 56.4,
    setup: [47.5, 48.3], install: [53.3, 54.6]
  }
};
const CFG = CONFIG[MODE];
if (!CFG) { console.error('usage: node tools/audio.mjs [15|30|60]'); process.exit(2); }

const N = Math.round(SR * CFG.dur);
const L = new Float32Array(N);
const Rr = new Float32Array(N);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const TAU = Math.PI * 2;
let seed = 20261101 + Number(MODE);
function rnd() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function add(i, v, pan) {
  if (i < 0 || i >= N) return;
  const p = pan == null ? 0 : Math.max(-1, Math.min(1, pan));
  L[i] += v * (p <= 0 ? 1 : 1 - p);
  Rr[i] += v * (p >= 0 ? 1 : 1 + p);
}
function tone(start, dur, freq, amp, attack, decay, pan, second) {
  const s = Math.round(start * SR), n = Math.round(dur * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const a = attack > 0 ? clamp01(t / attack) : 1;
    const env = a * Math.exp(-t * decay);
    let v = Math.sin(TAU * freq * t) * amp * env;
    if (second) v += Math.sin(TAU * freq * second * t) * amp * env * 0.35;
    add(s + k, v, pan);
  }
}
function thump(start, amp, f0, f1, dur, pan) {
  const s = Math.round(start * SR), n = Math.round(dur * SR);
  let phase = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const f = f0 + (f1 - f0) * clamp01(t / dur);
    phase += TAU * f / SR;
    const env = Math.exp(-t * 9) * (1 - Math.exp(-t * 900));
    add(s + k, Math.sin(phase) * amp * env, pan);
  }
}
function noise(start, dur, amp, hpHz, lpHz, envFn, pan) {
  const s = Math.round(start * SR), n = Math.round(dur * SR);
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

/* 1 · chalk scratch at the head */
noise(CFG.chalk[0], CFG.chalk[1] - CFG.chalk[0], 0.22, 900, 9000, (t, d) => {
  const a = clamp01(t / 0.04) * clamp01((d - t) / 0.18);
  const scratch = 0.55 + 0.45 * Math.abs(Math.sin(TAU * 13 * t + 1.3));
  return a * scratch;
}, -0.15);

/* 2 · sustained sub drone under the whole bed */
{
  const start = Math.round(CFG.drone[0] * SR), n = Math.round((CFG.drone[1] - CFG.drone[0]) * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = clamp01(t / 0.6) * clamp01((CFG.drone[1] - CFG.drone[0] - t) / 0.35) * 0.14;
    const v = Math.sin(TAU * 48 * t) * 0.55 + Math.sin(TAU * 72 * t + 0.4) * 0.22;
    add(start + k, v * env, 0);
  }
}

/* 3 · the clock ticks (rules sections) */
for (let sec = CFG.ticks[0]; sec <= CFG.ticks[1]; sec += 1.0) {
  const pan = (Math.round(sec) % 2 === 0) ? -0.22 : 0.22;
  thump(sec, 0.09, 180, 120, 0.06, pan);
  noise(sec, 0.035, 0.09, 2400, 11000, null, pan);
}

/* 4 · low pulses on scene changes */
CFG.pulses.forEach((t, i) => {
  thump(t, 0.18 - (i % 3) * 0.02, 62, 46, 0.55, 0);
  noise(t, 0.05, 0.05, 1200, 7000, null, 0.1);
});

/* 5 · report pings */
CFG.pings.forEach((t, i) => {
  tone(t, 0.5, 880 - i * 30, 0.11, 0.004, 8.5, i % 2 ? -0.18 : 0.18, 2);
});

/* 6 · converge riser (hunters closing) */
noise(CFG.riser[0], CFG.riser[1] - CFG.riser[0], 0.16, 600, 7000, (t, d) => {
  const p = clamp01(t / d);
  return p * p * clamp01((d - t) / 0.15);
}, 0.05);
tone(CFG.riser[0], CFG.riser[1] - CFG.riser[0], 140, 0.05, 0.4, 0.15, 0, 1.5);

/* 7 · tag snap */
thump(CFG.snap, 0.5, 130, 38, 0.55, 0);
noise(CFG.snap, 0.10, 0.28, 700, 12000, (t) => Math.exp(-t * 45), 0.1);
tone(CFG.snap, 0.30, 1320, 0.09, 0.002, 16, -0.2, 1.5);

/* 8 · setup clicks (two phones / code) */
if (CFG.setup) CFG.setup.forEach((t, i) => {
  tone(t, 0.09, 1180 + i * 120, 0.07, 0.002, 30, i ? 0.2 : -0.2, 2);
});

/* 9 · install chimes */
if (CFG.install) CFG.install.forEach((t, i) => {
  tone(t, 0.6, [660, 880][i % 2], 0.08, 0.004, 7.5, i ? -0.15 : 0.15, 2);
});

/* master: soft saturation + normalise */
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1);
  Rr[i] = Math.tanh(Rr[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rr[i]));
}
const gain = peak > 0 ? 0.72 / peak : 1;
await mkdir(path.join(ROOT, 'out', 'audio'), { recursive: true });
const data = Buffer.alloc(44 + N * 4);
data.write('RIFF', 0); data.writeUInt32LE(36 + N * 4, 4); data.write('WAVE', 8);
data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22); data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write('data', 36);
data.writeUInt32LE(N * 4, 40);
let o = 44;
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), o); o += 2;
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rr[i] * gain)) * 32767), o); o += 2;
}
const outPath = path.join(ROOT, 'out', 'audio', CFG.out);
await writeFile(outPath, data);
console.log(`wrote ${outPath}  (${CFG.dur.toFixed(2)} s, ${data.length} bytes)`);
