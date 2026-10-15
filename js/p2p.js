// 서버·DB 없이 WebRTC로 같은 방에 지금 접속한 사람끼리만 주고받는다.
// 공개 Nostr 릴레이는 서로를 찾는 데만 쓰이고, 내용은 브라우저끼리 직접 오간다.
import { HEARTBEAT_MS, P2P_APP_ID, P2P_RELAYS, PEER_TIMEOUT_MS, TRYSTERO_URL } from './config.js';

// 탭을 닫아도 WebRTC 연결 끊김 감지가 늦어서, 작별 인사 + 심장박동으로 직접 접속자를 관리한다
function createPresence(onChange, onLeave) {
  const lastSeen = new Map(); // peerId -> 마지막으로 소식 들은 시각
  // peerId는 접속할 때마다 새로 생기므로, 한 번 떠난 id에서 늦게 도착한 메시지는 무시한다
  const departed = new Set();
  const seen = (peerId) => {
    if (departed.has(peerId)) return false;
    lastSeen.set(peerId, Date.now());
    onChange(lastSeen.size + 1);
    return true;
  };
  const forget = (peerId) => {
    departed.add(peerId);
    lastSeen.delete(peerId);
    onLeave(peerId);
    onChange(lastSeen.size + 1);
  };
  const sweep = () => lastSeen.forEach((at, peerId) => { if (Date.now() - at > PEER_TIMEOUT_MS) forget(peerId); });
  return { seen, forget, sweep, count: () => lastSeen.size + 1 };
}

/**
 * @param {string} roomKey
 * @param {{ onPeerJoin, onPeerLeave, onCount, actions: Record<string, (data, peerId) => void> }} handlers
 * @returns {{ send: (action: string, data: unknown, target?: string) => void }}
 */
export async function joinHall(roomKey, { onPeerJoin, onPeerLeave, onCount, actions }) {
  const { joinRoom } = await import(TRYSTERO_URL);
  const room = joinRoom({ appId: P2P_APP_ID, relayConfig: { urls: P2P_RELAYS } }, roomKey);
  const presence = createPresence(onCount, onPeerLeave);
  const senders = {};

  Object.entries(actions).forEach(([name, onMessage]) => {
    const action = room.makeAction(name);
    action.onMessage = (data, { peerId }) => { if (presence.seen(peerId)) onMessage(data, peerId); };
    senders[name] = action;
  });
  const presenceAction = room.makeAction('presence');
  presenceAction.onMessage = (data, { peerId }) => (data === 'bye' ? presence.forget(peerId) : presence.seen(peerId));
  room.onPeerJoin = (peerId) => { if (presence.seen(peerId)) onPeerJoin(peerId); };
  room.onPeerLeave = presence.forget;

  setInterval(() => { presenceAction.send('here'); presence.sweep(); }, HEARTBEAT_MS);
  // room.leave()를 같이 부르면 'bye'가 나가기 전에 연결이 닫혀버린다
  window.addEventListener('pagehide', () => presenceAction.send('bye'));
  onCount(presence.count());

  return { send: (name, data, target) => senders[name].send(data, target ? { target } : undefined) };
}
