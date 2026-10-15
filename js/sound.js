// 소리는 녹음 파일 없이 Web Audio로 합성한다. 무음 모드면 아무것도 만들지 않는다.
import { state } from './store.js';

let ctx;
const audio = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());

export function unlockAudio() {
  if (!state.muted) audio().resume();
}

function tone(ac, { freq, vol, start, dur, drop = 1, type = 'sine' }) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (drop !== 1) o.frequency.exponentialRampToValueAtTime(freq * drop, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ac.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

// 나무 타격 '딱' 소리
function knock(ac, t) {
  const buf = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
  n.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.5; g.gain.value = 0.35;
  n.connect(bp).connect(g).connect(ac.destination);
  n.start(t);
}

export function playMoktak() {
  if (state.muted) return;
  const ac = audio(), t = ac.currentTime;
  const pitch = 1 + (Math.random() - 0.5) * 0.04;
  tone(ac, { freq: 620 * pitch, vol: 0.5, start: t, dur: 0.22, drop: 0.82 });
  tone(ac, { freq: 980 * pitch, vol: 0.18, start: t, dur: 0.09, drop: 0.82 });
  knock(ac, t);
}

export function playChime() {
  if (state.muted) return;
  const ac = audio(), t = ac.currentTime;
  [1318, 1760, 2093].forEach((freq, i) => tone(ac, { freq, vol: 0.05, start: t + i * 0.12, dur: 2.5 }));
}

function noiseBuffer(ac, seconds, shape = () => 1) {
  const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * shape(i / d.length);
  return buf;
}

// 종이 타는 '타닥타닥' 소리: 짧은 잡음을 불규칙하게 흩뿌린다
export function playCrackle(seconds) {
  if (state.muted) return;
  const ac = audio(), t = ac.currentTime;
  const pops = Math.round(seconds * 14);
  for (let i = 0; i < pops; i++) {
    const n = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
    n.buffer = noiseBuffer(ac, 0.012, (p) => (1 - p) ** 2);
    hp.type = 'highpass'; hp.frequency.value = 1500 + Math.random() * 2500;
    g.gain.value = 0.05 + Math.random() * 0.12;
    n.connect(hp).connect(g).connect(ac.destination);
    n.start(t + Math.random() * seconds);
  }
}

// ---------- 고양이 ----------
const PURR_BREATH_S = 0.95;   // 들숨+날숨 한 번
const PURR_INHALE_RATIO = 0.42;
const PURR_HZ = { inhale: 22, exhale: 27 }; // 성대가 떨리는 횟수: 날숨이 조금 더 빠르고 크다

// 진짜 골골송은 사인파가 아니라 '드르륵' 하는 짧은 펄스의 연속이고, 숨 쉴 때마다 커졌다 작아진다
function purrBuffer(ac, seconds) {
  const sr = ac.sampleRate, buf = ac.createBuffer(1, sr * seconds, sr), d = buf.getChannelData(0);
  let phase = 0, lp = 0;
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const breath = (t % PURR_BREATH_S) / PURR_BREATH_S;
    const inhale = breath < PURR_INHALE_RATIO;
    const part = inhale ? breath / PURR_INHALE_RATIO : (breath - PURR_INHALE_RATIO) / (1 - PURR_INHALE_RATIO);
    const breathEnv = Math.sin(Math.PI * part) ** 0.6 * (inhale ? 0.55 : 1);
    phase = (phase + (inhale ? PURR_HZ.inhale : PURR_HZ.exhale) / sr) % 1;
    const pulse = Math.exp(-phase * 7);
    lp += (Math.random() * 2 - 1 - lp) * 0.06; // 거친 잡음을 둥글게
    const fade = Math.min(1, t / 0.15, (seconds - t) / 0.3);
    d[i] = lp * pulse * breathEnv * fade * 4;
  }
  return buf;
}

// 쓰다듬는 순간 내는 짧은 '므르릉?' 소리
function trill(ac, t) {
  const o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
  const am = ac.createOscillator(), amGain = ac.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(480, t);
  o.frequency.linearRampToValueAtTime(720, t + 0.22);
  bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 2.5;
  am.frequency.value = 30; amGain.gain.value = 0.05;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.06, t + 0.04);
  g.gain.linearRampToValueAtTime(0.0001, t + 0.26);
  am.connect(amGain).connect(g.gain);
  o.connect(bp).connect(g).connect(ac.destination);
  o.start(t); am.start(t); o.stop(t + 0.3); am.stop(t + 0.3);
}

export function playPurr(seconds = 2.4) {
  if (state.muted) return;
  const ac = audio(), t = ac.currentTime;
  trill(ac, t);
  const n = ac.createBufferSource(), lp = ac.createBiquadFilter(), hp = ac.createBiquadFilter(), g = ac.createGain();
  n.buffer = purrBuffer(ac, seconds);
  lp.type = 'lowpass'; lp.frequency.value = 650;
  hp.type = 'highpass'; hp.frequency.value = 45;
  g.gain.value = 0.55;
  n.connect(hp).connect(lp).connect(g).connect(ac.destination);
  n.start(t + 0.2);
}

// ---------- 강아지 ----------
const BARK_GAP_S = 0.2;

// '왕' 한 번: 톱니파의 음높이를 확 올렸다 내리고, 숨소리 섞인 잡음을 살짝 얹는다
function bark(ac, t) {
  const o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t);
  o.frequency.linearRampToValueAtTime(760, t + 0.03);
  o.frequency.exponentialRampToValueAtTime(380, t + 0.13);
  bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 1.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  o.connect(bp).connect(g).connect(ac.destination);
  o.start(t); o.stop(t + 0.16);

  const n = ac.createBufferSource(), nbp = ac.createBiquadFilter(), ng = ac.createGain();
  n.buffer = noiseBuffer(ac, 0.08, (p) => (1 - p) ** 2);
  nbp.type = 'bandpass'; nbp.frequency.value = 1800; nbp.Q.value = 0.8; ng.gain.value = 0.12;
  n.connect(nbp).connect(ng).connect(ac.destination);
  n.start(t);
}

// '헥헥': 짧은 숨소리 잡음을 일정한 간격으로
function pant(ac, t, times = 4) {
  for (let i = 0; i < times; i++) {
    const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    n.buffer = noiseBuffer(ac, 0.11, (p) => Math.sin(Math.PI * p));
    bp.type = 'bandpass'; bp.frequency.value = i % 2 ? 1500 : 2100; bp.Q.value = 1.5;
    g.gain.value = 0.09;
    n.connect(bp).connect(g).connect(ac.destination);
    n.start(t + i * 0.19);
  }
}

export function playBark() {
  if (state.muted) return;
  const ac = audio(), t = ac.currentTime;
  bark(ac, t);
  bark(ac, t + BARK_GAP_S);
  pant(ac, t + 0.6);
}
