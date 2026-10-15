// 법당 라디오: 유튜브 공식 플레이어로 반야심경 독경을 반복 재생한다.
// 유튜브 정책상 소리만 따로 틀 수 없어서 플레이어를 화면에 보이게 두고, 닫으면 멈춘다.
import { YT_ORIGIN, YT_VIDEO_ID } from './config.js';
import { state } from './store.js';
import { $ } from './ui.js';

const COMMAND_RETRY_MS = 1500; // 플레이어가 막 떴을 때는 명령을 못 받을 수 있어 한 번 더 보낸다

let iframe = null;

function command(func) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), YT_ORIGIN);
}

const syncMute = () => command(state.muted ? 'mute' : 'unMute');

function playerUrl() {
  const params = new URLSearchParams({
    autoplay: '1',
    loop: '1',
    playlist: YT_VIDEO_ID, // loop는 playlist를 같이 줘야 동작한다
    rel: '0',
    playsinline: '1',
    enablejsapi: '1',
    mute: state.muted ? '1' : '0',
    origin: location.origin,
  });
  return `${YT_ORIGIN}/embed/${YT_VIDEO_ID}?${params}`;
}

function createPlayer() {
  iframe = document.createElement('iframe');
  iframe.src = playerUrl();
  iframe.title = '법당 라디오 - 반야심경 독경';
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.addEventListener('load', () => { syncMute(); setTimeout(syncMute, COMMAND_RETRY_MS); });
  $('radio-slot').appendChild(iframe);
}

function open() {
  $('radio').hidden = false;
  $('btn-radio').classList.add('on');
  if (iframe) command('playVideo'); else createPlayer();
}

function close() {
  command('pauseVideo');
  $('radio').hidden = true;
  $('btn-radio').classList.remove('on');
}

export function initRadio() {
  $('btn-radio').addEventListener('click', () => ($('radio').hidden ? open() : close()));
  $('radio-close').addEventListener('click', close);
  window.addEventListener('mutechange', syncMute);
}
