// 소원연등: 내 연등 관리, 다른 사람 연등 수신, 합장 주고받기
import {
  DEFAULT_NAME, LANTERN_COLORS, LANTERN_TTL_MS, MAX_LANTERNS_PER_PEER, MAX_NAME_LEN, MAX_WISH_LEN,
} from './config.js';
import { applyBow, lanternInfo, removeOwnerLanterns, showLantern } from './lantern-view.js';
import { playChime } from './sound.js';
import { save, state } from './store.js';
import { $, bindModal, clsx, floatEmoji, toast } from './ui.js';

let room = '';
let hall = null; // P2P 연결 전에는 null → 보내기는 조용히 건너뛴다
const myName = () => state.name || DEFAULT_NAME;
const alive = (l) => Date.now() - l.at < LANTERN_TTL_MS;
const myLanterns = () => state.lanterns.filter((l) => l.room === room && alive(l));

const forWire = (l) => ({
  id: l.id, text: l.text, color: l.color, name: l.name, bows: l.bows || 0,
  remainMs: l.at + LANTERN_TTL_MS - Date.now(),
});

function sanitize(raw) {
  const num = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
  if (!raw || typeof raw.text !== 'string' || !raw.text.trim()) return null;
  if (!LANTERN_COLORS.includes(raw.color)) return null;
  return {
    id: String(raw.id).slice(0, 24),
    text: raw.text.trim().slice(0, MAX_WISH_LEN),
    name: String(raw.name || DEFAULT_NAME).slice(0, MAX_NAME_LEN),
    color: raw.color,
    bows: num(raw.bows, 0, 9999),
    remainMs: num(raw.remainMs, 0, LANTERN_TTL_MS),
  };
}

function renderSub() {
  const n = myLanterns().length;
  $('lantern-sub').textContent = n ? `${n}개 밝히는 중 · 5분` : '5분간 하늘에';
}

function forgetMine(id) {
  state.lanterns = state.lanterns.filter((l) => l.id !== id);
  save(); renderSub();
}

const showMine = (l, fresh) => showLantern(l, {
  fresh, mine: true, owner: 'me', expireAt: l.at + LANTERN_TTL_MS, onExpire: () => forgetMine(l.id),
});

function lightLantern(text, color) {
  if (myLanterns().length >= MAX_LANTERNS_PER_PEER) return toast(`연등은 한 번에 ${MAX_LANTERNS_PER_PEER}개까지 밝힐 수 있어요`);
  const l = { id: Math.random().toString(36).slice(2, 12), text, color, name: myName(), room, bows: 0, at: Date.now() };
  state.lanterns.push(l);
  save(); showMine(l, true); renderSub();
  hall?.send('lanterns', [forWire(l)]);
  playChime(); toast('🏮 소원이 하늘에 닿기를');
}

function bowTo(id, x, y) {
  const info = lanternInfo(id);
  if (!info) return;
  if (info.mine) return toast('내 연등이에요. 다른 분의 연등에 합장해 보세요');
  if (!applyBow(id, 'me')) return toast('이미 합장한 연등이에요');
  floatEmoji('🙏', x, y);
  hall?.send('bow', { id, name: myName() });
}

// ---------- P2P 이벤트 ----------
function onLanterns(list, peerId) {
  if (!Array.isArray(list)) return;
  list.slice(0, MAX_LANTERNS_PER_PEER).map(sanitize).forEach((l) => {
    if (l && l.remainMs > 0) showLantern(l, { fresh: true, mine: false, owner: peerId, expireAt: Date.now() + l.remainMs });
  });
}

function onBow(bow, peerId) {
  const id = String(bow?.id), name = String(bow?.name || DEFAULT_NAME).slice(0, MAX_NAME_LEN);
  const result = applyBow(id, peerId);
  if (!result?.mine) return;
  const l = state.lanterns.find((x) => x.id === id);
  if (l) { l.bows = result.bows; save(); }
  toast(`🙏 ${name}님이 내 연등에 합장했어요`);
}

export const lanternPeer = {
  onPeerJoin: (peerId) => { const list = myLanterns(); if (list.length) hall?.send('lanterns', list.map(forWire), peerId); },
  onPeerLeave: (peerId) => removeOwnerLanterns(peerId),
  actions: { lanterns: onLanterns, bow: onBow },
};

export const connectLanterns = (h) => { hall = h; };

function initModal() {
  let color = LANTERN_COLORS[0];
  LANTERN_COLORS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = clsx('color', i === 0 && 'sel');
    b.style.setProperty('--c', c);
    b.addEventListener('click', () => {
      color = c;
      document.querySelectorAll('.color').forEach((x) => x.classList.toggle('sel', x === b));
    });
    $('colors').appendChild(b);
  });
  const { close } = bindModal('wish-modal', { trigger: 'btn-wish', focus: 'wish-text' });
  $('wish-ok').addEventListener('click', () => {
    const text = $('wish-text').value.trim();
    if (!text) return $('wish-text').focus();
    lightLantern(text, color);
    $('wish-text').value = '';
    close();
  });
}

export function initLanterns(currentRoom) {
  room = currentRoom;
  state.lanterns = state.lanterns.filter(alive);
  save();
  myLanterns().forEach((l) => showMine(l, false));
  renderSub();
  initModal();
  $('sky').addEventListener('click', (e) => {
    const el = e.target.closest('.lantern');
    if (el) bowTo(el.dataset.id, e.clientX, e.clientY);
  });
}
