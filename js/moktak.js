import { BONNOE, MILESTONE } from './config.js';
import { playChime, playMoktak } from './sound.js';
import { save, state } from './store.js';
import { $, isModalOpen, toast } from './ui.js';

const HIT_MS = 90;
const BONNOE_MS = 1700;
const BONNOE_SPREAD_PX = 120;

function renderStats() {
  $('today').textContent = state.today.toLocaleString();
  $('total').textContent = state.total.toLocaleString();
}

function flyBonnoe(moktak) {
  const r = moktak.getBoundingClientRect();
  const el = document.createElement('div');
  const word = document.createElement('s');
  word.textContent = BONNOE[Math.floor(Math.random() * BONNOE.length)];
  el.className = 'bonnoe';
  el.append(word, ' 물러가라');
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top - 10}px`;
  el.style.setProperty('--dx', `${(Math.random() - 0.5) * BONNOE_SPREAD_PX}px`);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), BONNOE_MS);
}

function strike() {
  const moktak = $('moktak');
  playMoktak();
  moktak.classList.remove('hit'); void moktak.offsetWidth; moktak.classList.add('hit');
  setTimeout(() => moktak.classList.remove('hit'), HIT_MS);

  state.today++; state.total++; save(); renderStats();
  flyBonnoe(moktak);
  if (state.today % MILESTONE === 0) { playChime(); toast(`🙏 백팔번뇌 소멸 ×${state.today / MILESTONE}`); }
}

function initAutoStrike() {
  let timer;
  const chips = document.querySelectorAll('#auto-row .chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.toggle('on', c === chip));
      clearInterval(timer);
      const bpm = Number(chip.dataset.bpm);
      if (bpm) timer = setInterval(strike, 60000 / bpm);
    });
  });
}

export function initMoktak() {
  $('moktak').addEventListener('pointerdown', (e) => { e.preventDefault(); strike(); });
  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest?.('input, textarea');
    if (e.code !== 'Space' || typing || isModalOpen()) return;
    e.preventDefault();
    strike();
  });
  initAutoStrike();
  renderStats();
}
