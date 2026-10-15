import { STORAGE_KEY } from './config.js';

// toISOString()은 UTC라 한국에선 오전 9시에 날짜가 바뀌므로 현지 날짜를 쓴다
export const todayKey = () => new Date().toLocaleDateString('sv-SE');
const DEFAULTS = { total: 0, today: 0, lanterns: [], name: '', muted: false };

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    if (s.day !== todayKey()) { s.day = todayKey(); s.today = 0; }
    return { ...DEFAULTS, ...s };
  } catch {
    return { ...DEFAULTS, day: todayKey() };
  }
}

export const state = load();

export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}
