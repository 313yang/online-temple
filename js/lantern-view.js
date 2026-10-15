// 하늘에 떠 있는 연등(내 것 + 다른 사람 것)을 그리고, 합장 수에 따라 밝기를 바꾼다
import { LANTERN_FADE_MS, MAX_BOW_GLOW } from './config.js';
import { $, clsx } from './ui.js';

const STAR_COUNT = 60;
const FRESH_MS = 7000;
const GLOW_PER_BOW = 0.12;

const board = new Map(); // lanternId -> { el, who, timer, bows, mine, bowedBy, owner }

export function drawStars() {
  const sky = $('sky');
  for (let i = 0; i < STAR_COUNT; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 4}s`;
    sky.appendChild(s);
  }
}

// 불상 뒤에 가리지 않도록: 하늘 위쪽은 어디든, 아래쪽은 좌우 가장자리에만
export function lanternSpot() {
  const y = 6 + Math.random() * 72;
  if (y < 22) return { x: 5 + Math.random() * 88, y };
  const side = Math.random() < 0.5 ? 3 : 66;
  return { x: side + Math.random() * 28, y };
}

function buildEl(l, { fresh, mine }) {
  const el = document.createElement('div');
  el.className = clsx('lantern', fresh && 'fresh', mine && 'mine');
  el.dataset.id = l.id;
  el.style.left = `clamp(46px, ${l.x}%, calc(100% - 80px))`; // 글씨가 화면 밖으로 잘리지 않게
  el.style.top = `${l.y}%`;
  el.style.setProperty('--c', l.color);
  if (!fresh) el.style.animationDuration = '0s';

  const body = document.createElement('div');
  body.className = 'body';
  body.style.animationDelay = `${-Math.random() * 5}s`;
  const tag = document.createElement('div');
  const wish = document.createElement('div');
  const who = document.createElement('div');
  tag.className = 'tag'; wish.className = 'wish'; who.className = 'who';
  wish.textContent = l.text;
  tag.append(wish, who);
  el.append(body, tag);
  if (fresh) setTimeout(() => el.classList.remove('fresh'), FRESH_MS);
  return { el, who };
}

function renderBows(entry, name) {
  entry.who.textContent = entry.bows ? `${name} · 🙏 ${entry.bows}` : name;
  entry.el.style.setProperty('--glow', 1 + Math.min(entry.bows, MAX_BOW_GLOW) * GLOW_PER_BOW);
}

function extinguish(el) {
  el.classList.add('gone');
  setTimeout(() => el.remove(), LANTERN_FADE_MS);
}

export function showLantern(l, { fresh, mine, owner, expireAt, onExpire }) {
  if (board.has(l.id)) return;
  const { el, who } = buildEl(l, { fresh, mine });
  const entry = { el, who, bows: l.bows || 0, mine, owner, name: l.name, bowedBy: new Set() };
  entry.timer = setTimeout(() => { removeLantern(l.id); onExpire?.(); }, Math.max(0, expireAt - Date.now()));
  board.set(l.id, entry);
  renderBows(entry, l.name);
  $('sky').appendChild(el);
}

export function removeLantern(id) {
  const entry = board.get(id);
  if (!entry) return;
  clearTimeout(entry.timer);
  extinguish(entry.el);
  board.delete(id);
}

export function removeOwnerLanterns(owner) {
  board.forEach((entry, id) => { if (entry.owner === owner) removeLantern(id); });
}

// 같은 사람이 같은 연등에 두 번 합장해도 한 번만 센다. 반영됐으면 연등 정보를 돌려준다.
export function applyBow(id, bowerId) {
  const entry = board.get(id);
  if (!entry || entry.bowedBy.has(bowerId)) return null;
  entry.bowedBy.add(bowerId);
  entry.bows++;
  renderBows(entry, entry.name);
  return { mine: entry.mine, bows: entry.bows };
}

export const lanternInfo = (id) => board.get(id);
