// 하늘에 떠 있는 연등(내 것 + 다른 사람 것)을 그리고, 합장 수에 따라 밝기를 바꾼다
import { LANTERN_FADE_MS, MAX_BOW_GLOW } from './config.js';
import { $, clsx } from './ui.js';

const STAR_COUNT = 60;
const FRESH_MS = 7000;
const GLOW_PER_BOW = 0.12;
// 겹침 판정용 크기: 연등 몸통 + 그 아래 소원·법명 두 줄짜리 글씨 상자
const SPOT_TRIES = 200;
const LANTERN_W_PX = 34;
const LANTERN_BOX_H_PX = 84;  // 몸통 + 소원·법명 글씨
const LANTERN_BODY_H_PX = 48; // 몸통만
const BOX_GAP_PX = 6;
// 라디오 카드 뒤에 숨는 것보다 다른 연등과 살짝 겹치는 게 낫다
const OBSTACLE_WEIGHT = 50;
const EDGE_LEFT_PX = 46; // 글씨가 화면 밖으로 잘리지 않게
const EDGE_RIGHT_PX = 80;

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
function lanternSpot() {
  const y = 6 + Math.random() * 72;
  if (y < 22) return { x: 5 + Math.random() * 88, y };
  const side = Math.random() < 0.5 ? 3 : 66;
  return { x: side + Math.random() * 28, y };
}

function toBox({ x, y }, sky, halfW, height) {
  const left = Math.min(Math.max((x / 100) * sky.width, EDGE_LEFT_PX), sky.width - EDGE_RIGHT_PX);
  const top = (y / 100) * sky.height;
  const cx = left + LANTERN_W_PX / 2;
  return { left, top, l: cx - halfW, r: cx + halfW, t: top, b: top + height + BOX_GAP_PX };
}

const overlapArea = (a, b) =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

// 후보 자리를 여러 개 뽑아 이미 떠 있는 연등과 가장 덜 겹치는 곳을 고른다 (꽉 차면 최소로 겹치는 곳)
// halfW·height: 이번 연등이 차지할 상자 크기 (짧은 소원은 자리를 덜 차지한다)
function findFreeSpot(halfW, height) {
  const sky = $('sky').getBoundingClientRect();
  const obstacles = [...document.querySelectorAll('[data-obstacle]:not([hidden])')].map((el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left - sky.left, r: r.right - sky.left, t: r.top - sky.top, b: r.bottom - sky.top };
  });
  const taken = [...board.values()].map((e) => e.box);
  let best = null, bestScore = Infinity;
  for (let i = 0; i < SPOT_TRIES && bestScore > 0; i++) {
    const box = toBox(lanternSpot(), sky, halfW, height);
    const score = taken.reduce((sum, b) => sum + overlapArea(box, b), 0)
      + OBSTACLE_WEIGHT * obstacles.reduce((sum, b) => sum + overlapArea(box, b), 0);
    if (score < bestScore) { best = box; bestScore = score; }
  }
  return { box: { ...best, sky }, score: bestScore };
}

function buildEl(l, { fresh, mine }) {
  const el = document.createElement('div');
  el.className = clsx('lantern', fresh && 'fresh', mine && 'mine');
  el.dataset.id = l.id;
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

// 다 떠오른 뒤의 글씨 폭으로 자리를 잡는다 (떠오르는 동안엔 글씨가 잠깐 더 넓게 펼쳐진다)
function placeEl(el) {
  const fresh = el.classList.contains('fresh');
  el.classList.remove('fresh');
  el.style.visibility = 'hidden';
  $('sky').appendChild(el); // 글씨 폭을 재려면 먼저 화면에 붙여야 한다
  const tagW = Math.max(LANTERN_W_PX, el.querySelector('.tag').offsetWidth);
  let { box, score } = findFreeSpot(tagW / 2 + BOX_GAP_PX / 2, LANTERN_BOX_H_PX);
  // 하늘이 꽉 차서 글씨까지 둘 자리가 없으면, 연등만 두고 글씨는 누를 때만 보여준다
  if (score > 0) {
    const bodyOnly = findFreeSpot(LANTERN_W_PX / 2 + BOX_GAP_PX, LANTERN_BODY_H_PX);
    if (bodyOnly.score < score) ({ box } = bodyOnly);
    el.classList.toggle('quiet', bodyOnly.score < score);
  }
  // 창 크기가 바뀌어도 비슷한 자리에 있도록 %로 둔다
  el.style.left = `${(box.left / box.sky.width) * 100}%`;
  el.style.top = `${(box.top / box.sky.height) * 100}%`;
  el.style.visibility = '';
  if (fresh) el.classList.add('fresh');
  return box;
}

export function showLantern(l, { fresh, mine, owner, expireAt, onExpire }) {
  if (board.has(l.id)) return;
  const { el, who } = buildEl(l, { fresh, mine });
  const entry = { el, who, bows: l.bows || 0, mine, owner, name: l.name, bowedBy: new Set() };
  renderBows(entry, l.name);
  entry.box = placeEl(el);
  entry.timer = setTimeout(() => { removeLantern(l.id); onExpire?.(); }, Math.max(0, expireAt - Date.now()));
  board.set(l.id, entry);
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
