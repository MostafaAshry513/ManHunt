// Original generated score for the ManHunt MATCHDAY app film — no samples, no
// libraries: sines, noise, one-pole filters and a seeded RNG only.
//
//   node tools/audio.mjs 15   -> out/audio/matchday_score_15.wav
//   node tools/audio.mjs 30   -> out/audio/matchday_score_30.wav
//   node tools/audio.mjs 6    -> out/audio/matchday_score_6.wav
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SR = 44100;
const MODE = process.argv[2] || '15';

/* Cue sheets mirror the film beats (src/animate.js). Scores are original. */
const CONFIG = {
  '15': {
    dur: 15.0, out: 'matchday_score_15.wav',
    chalk: [0.02, 0.62], drone: [0.0, 13.0],
    pulses: [1.40, 4.30, 7.60, 11.60],
    ticks: [7.60, 11.0],
    pings: [8.5, 9.6, 10.4],
    riser: [8.0, 10.5], snap: 10.95,
    silenceFrom: 13.2
  },
  '30': {
    dur: 30.0, out: 'matchday_score_30.wav',
    chalk: [0.02, 0.7], drone: [0.0, 26.4],
    pulses: [2.20, 7.00, 12.40, 17.60, 19.00, 23.00],
    ticks: [12.40, 17.4],
    pings: [13.8, 15.0, 16.0, 20.5],
    riser: [15.0, 17.4], snap: 17.9,
    silenceFrom: 26.6
  },
  '6': {
    dur: 6.0, out: 'matchday_score_6.wav',
    chalk: [0.02, 0.4], drone: [0.0, 5.6],
    pulses: [1.50, 2.80],
    ticks: [2.80, 4.3],
    pings: [3.0, 3.7],
    riser: [3.0, 4.35], snap: 4.42,
    silenceFrom: 4.4
  }
};
const CFG = CONFIG[MODE];
if (!CFG) { console.error('usage: node tools/audio.mjs [15|30|6]'); process.exit(2); }

const N = Math.round(SR * CFG.dur);
const L = new Float32Array(N);
const R = new Float32Array(N);
const TAU = Math.PI * 2;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
let seed = 20261102 + Number(MODE);
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
  R[i] += v * (p >= 0 ? 1 : 1 + p);
}
function tone(start, dur, freq, amp, attack, decay, pan, second) {
  const s = Math.round(start * SR), n = Math.round(dur * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const a = attack > 0 ? clamp01(t / attack) : 1;
    const env = a * Math.exp(-t * decay);
    let v = Math.sin(TAU * freq * t) * amp * env;
    if (second) v += Math.sin(TAU * freq * second * t) * amp * env * 0.32;
    add(s + k, v, pan);
  }
}
function thump(start, amp, f0, f1, dur, pan) {
  const s = Math.round(start * SR), n = Math.round(dur * SR);
  let phase = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const f = f0 + (f1 - f0) * clamp01(t / dur);
    phase += (TAU * f) / SR;
    const env = Math.exp(-t * 9) * (1 - Math.exp(-t * 800));
    add(s + k, Math.sin(phase) * amp * env, pan);
  }
}
function noise(start, dur, amp, hpHz, lpHz, envFn, pan) {
  const s = Math.round(start * SR), n = Math.round(dur * SR);
  const hpCoef = Math.exp((-TAU * hpHz) / SR);
  const lpCoef = Math.exp((-TAU * (lpHz || 18000)) / SR);
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

/* 1 · matchday whistle: soft chalk/air at the head */
noise(CFG.chalk[0], CFG.chalk[1] - CFG.chalk[0], 0.16, 700, 9000, (t, d) => {
  const a = clamp01(t / 0.03) * clamp01((d - t) / 0.16);
  return a * (0.6 + 0.4 * Math.abs(Math.sin(TAU * 11 * t)));
}, -0.12);

/* 2 · low board drone */
{
  const start = Math.round(CFG.drone[0] * SR);
  const n = Math.round((CFG.drone[1] - CFG.drone[0]) * SR);
  for (let k = 0; k < n; k++) {
    const t = k / SR;
    const env = clamp01(t / 0.5) * clamp01((CFG.drone[1] - CFG.drone[0] - t) / 0.4) * 0.115;
    const v = Math.sin(TAU * 44 * t) * 0.6 + Math.sin(TAU * 66 * t + 0.4) * 0.2 + Math.sin(TAU * 110 * t + 1.1) * 0.06;
    add(start + k, v * env, 0);
  }
}

/* 3 · clock ticks across the hunt */
for (let sec = CFG.ticks[0]; sec <= CFG.ticks[1]; sec += 1.0) {
  const pan = Math.round(sec) % 2 === 0 ? -0.2 : 0.2;
  thump(sec, 0.07, 170, 110, 0.05, pan);
  noise(sec, 0.03, 0.07, 2600, 11000, null, pan);
}

/* 4 · scene pulses */
CFG.pulses.forEach((t, i) => {
  thump(t, 0.16 - (i % 3) * 0.02, 58, 42, 0.5, 0);
  noise(t, 0.045, 0.045, 1200, 7000, null, 0.08);
});

/* 5 · report pings */
CFG.pings.forEach((t, i) => {
  tone(t, 0.45, 860 - i * 26, 0.095, 0.004, 9, i % 2 ? -0.16 : 0.16, 2);
});

/* 6 · converge riser */
noise(CFG.riser[0], CFG.riser[1] - CFG.riser[0], 0.14, 600, 7000, (t, d) => {
  const p = clamp01(t / d);
  return p * p * clamp01((d - t) / 0.14);
}, 0.05);
tone(CFG.riser[0], CFG.riser[1] - CFG.riser[0], 132, 0.045, 0.4, 0.15, 0, 1.5);

/* 7 · tag snap */
thump(CFG.snap, 0.44, 120, 36, 0.5, 0);
noise(CFG.snap, 0.09, 0.24, 700, 12000, (t) => Math.exp(-t * 45), 0.1);
tone(CFG.snap, 0.28, 1280, 0.08, 0.002, 16, -0.18, 1.5);

/* 8 · end-card resolve */
const endStart = Math.max(0, CFG.silenceFrom - 0.02);
tone(endStart, 0.9, 330, 0.05, 0.02, 4, 0, 1.5);

/* master: soft saturation + peak normalise */
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1);
  R[i] = Math.tanh(R[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = peak > 0 ? 0.7 / peak : 1;
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
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), o); o += 2;
}
const outPath = path.join(ROOT, 'out', 'audio', CFG.out);
await writeFile(outPath, data);
console.log(`wrote ${outPath}  (${CFG.dur.toFixed(2)} s, ${data.length} bytes)`);
