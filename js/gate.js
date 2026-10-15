// 입장 화면: 법명·방 이름·무음 여부를 정하고 들어간다
import { MAX_NAME_LEN, MAX_ROOM_LEN, ROOM_PARAM } from './config.js';
import { save, state } from './store.js';
import { $, toast } from './ui.js';

const clean = (v, max) => v.trim().replace(/\s+/g, ' ').slice(0, max);

function renderMute() {
  $('gate-mute').classList.toggle('on', state.muted);
  $('gate-mute').textContent = state.muted ? '🔕 무음으로 입장' : '🔔 소리 켜고 입장';
  $('btn-mute').textContent = state.muted ? '🔕' : '🔔';
  $('btn-mute').setAttribute('aria-label', state.muted ? '소리 켜기' : '무음으로 바꾸기');
}

function toggleMute() {
  state.muted = !state.muted;
  save(); renderMute();
}

function setRoomInUrl(room) {
  const url = new URL(location.href);
  if (room) url.searchParams.set(ROOM_PARAM, room); else url.searchParams.delete(ROOM_PARAM);
  history.replaceState(null, '', url);
}

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(location.href);
    toast('🔗 초대 링크를 복사했어요');
  } catch {
    toast('복사에 실패했어요. 주소창의 링크를 공유해 주세요');
  }
}

/** 입장 버튼을 누르면 { name, room } 으로 resolve 된다 */
export function openGate() {
  $('gate-name').value = state.name;
  $('gate-room').value = new URL(location.href).searchParams.get(ROOM_PARAM) ?? '';
  $('gate-mute').addEventListener('click', toggleMute);
  $('btn-mute').addEventListener('click', toggleMute);
  $('btn-invite').addEventListener('click', copyInvite);
  renderMute();

  return new Promise((resolve) => {
    $('gate-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.name = clean($('gate-name').value, MAX_NAME_LEN);
      save();
      const room = clean($('gate-room').value, MAX_ROOM_LEN);
      setRoomInUrl(room);
      $('gate').classList.add('hidden');
      resolve({ name: state.name, room });
    }, { once: true });
  });
}
