import { INCENSE_BURN_MS, MAX_STICKS } from './config.js';
import { $, toast } from './ui.js';

const STICK_MIN_PX = 12;
const STICK_BURN_PX = 54;
const STICK_GAP_PX = 17;
const SMOKE_LIFE = 260;
const LIGHT_MESSAGES = ['마음이 조금 가벼워집니다', '향 냄새가 법당에 퍼집니다', '숨을 한 번 깊게 쉬어보세요'];

const sticks = [];
const remaining = (s) => Math.max(0, 1 - (Date.now() - s.start) / INCENSE_BURN_MS);

function renderSticks() {
  const box = $('sticks');
  box.innerHTML = '';
  sticks.forEach((s) => {
    const el = document.createElement('div');
    el.className = remaining(s) > 0 ? 'stick lit' : 'stick burnt';
    el.style.height = `${STICK_MIN_PX + STICK_BURN_PX * remaining(s)}px`;
    box.appendChild(el);
  });
  const lit = sticks.filter((s) => remaining(s) > 0).length;
  $('incense-sub').textContent = lit ? `${lit}자루 타는 중` : `${MAX_STICKS}자루까지`;
}

function lightStick() {
  for (let i = sticks.length - 1; i >= 0; i--) if (remaining(sticks[i]) === 0) sticks.splice(i, 1);
  if (sticks.length >= MAX_STICKS) return toast('향은 세 자루면 충분합니다');
  sticks.push({ start: Date.now() });
  renderSticks();
  toast(LIGHT_MESSAGES[sticks.length - 1]);
}

function startSmoke() {
  const cv = $('smoke'), c2 = cv.getContext('2d');
  const particles = [];
  const emit = () => sticks.forEach((s, i) => {
    if (remaining(s) === 0 || Math.random() >= 0.5) return;
    const x = cv.width / 2 + (i - (sticks.length - 1) / 2) * STICK_GAP_PX;
    particles.push({ x, y: cv.height - (STICK_MIN_PX + STICK_BURN_PX * remaining(s)) + 50, vx: 0, life: 0, phase: Math.random() * 6 });
  });
  const loop = () => {
    c2.clearRect(0, 0, cv.width, cv.height);
    emit();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++; p.y -= 0.6; p.vx += (Math.random() - 0.5) * 0.05;
      p.x += p.vx + Math.sin((p.life + p.phase * 20) / 18) * 0.35;
      c2.fillStyle = `rgba(220,215,225,${Math.max(0, 0.22 * (1 - p.life / SMOKE_LIFE))})`;
      c2.beginPath(); c2.arc(p.x, p.y, 2 + p.life * 0.06, 0, Math.PI * 2); c2.fill();
      if (p.life > SMOKE_LIFE || p.y < -10) particles.splice(i, 1);
    }
    requestAnimationFrame(loop);
  };
  loop();
}

export function initIncense() {
  $('btn-incense').addEventListener('click', lightStick);
  setInterval(renderSticks, 2000);
  startSmoke();
}
