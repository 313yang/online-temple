import { initBurn } from './burn.js';
import { initCat } from './cat.js';
import { initDog } from './dog.js';
import { PUBLIC_ROOM } from './config.js';
import { connectFortune, fortunePeer, initFortune } from './fortune.js';
import { openGate } from './gate.js';
import { initIncense } from './incense.js';
import { drawStars } from './lantern-view.js';
import { connectLanterns, initLanterns, lanternPeer } from './lanterns.js';
import { initMoktak } from './moktak.js';
import { joinHall } from './p2p.js';
import { initRadio } from './radio.js';
import { playChime, unlockAudio } from './sound.js';
import { $ } from './ui.js';

const PEER_FEATURES = [lanternPeer, fortunePeer];
const hallLabel = (room) => (room ? `${room} 법당` : '공개 법당');

// 여러 기능의 P2P 이벤트를 하나로 묶는다
const combinePeers = (features, onCount) => ({
  onCount,
  onPeerJoin: (peerId) => features.forEach((f) => f.onPeerJoin(peerId)),
  onPeerLeave: (peerId) => features.forEach((f) => f.onPeerLeave(peerId)),
  actions: Object.assign({}, ...features.map((f) => f.actions)),
});

async function connect(room) {
  const label = hallLabel(room);
  const renderCount = (n) => { $('presence').textContent = `🪷 ${label} · 지금 함께 ${n}명`; };
  $('presence').textContent = `🪷 ${label}에 연결 중…`;
  try {
    // 방 이름이 곧 열쇠: 같은 이름을 입력한 사람끼리만 만난다
    const hall = await joinHall(room ? `room:${room}` : PUBLIC_ROOM, combinePeers(PEER_FEATURES, renderCount));
    connectLanterns(hall);
    connectFortune(hall);
  } catch (err) {
    console.warn('P2P 연결 실패', err);
    $('presence').textContent = `🪷 ${label} · 혼자 수행 중 (연결 실패)`;
  }
}

drawStars();
initMoktak();
initIncense();
initBurn();
initFortune();
initRadio();

const { room } = await openGate();
unlockAudio();
playChime();
initLanterns(room);
initCat();
initDog();
connect(room);
