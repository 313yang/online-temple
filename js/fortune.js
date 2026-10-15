// 오늘의 점괘: 하루에 한 번 뽑고, 같은 방에 있는 사람들과 결과를 나눠 본다
import { DEFAULT_NAME, MAX_NAME_LEN } from './config.js';
import { playChime } from './sound.js';
import { save, state, todayKey } from './store.js';
import { $, bindModal, toast } from './ui.js';

const SHAKE_MS = 1400;
const FORTUNES = [
  { grade: '대길', weight: 15, lines: ['오늘 올린 PR, 코멘트 없이 승인됩니다', '점심 메뉴 고민 없이 맛집에 당첨됩니다', '칼퇴의 기운이 강하게 들어옵니다'] },
  { grade: '길', weight: 35, lines: ['오후 회의가 15분 일찍 끝날 상입니다', '커피가 유난히 맛있는 하루입니다', '미뤄둔 일이 생각보다 쉽게 풀립니다'] },
  { grade: '소길', weight: 35, lines: ['무난함이 곧 복입니다', '큰일은 없으나 메일이 조금 많겠습니다', '오늘은 버티는 것이 수행입니다'] },
  { grade: '흉', weight: 15, lines: ['퇴근 5분 전을 조심하십시오', "'잠깐 시간 되세요?'가 다가옵니다", '배포는 내일로 미루는 것이 좋겠습니다'] },
];
const GRADES = FORTUNES.map((f) => f.grade);

let hall = null;
const others = new Map(); // peerId -> { name, grade }
const myName = () => state.name || DEFAULT_NAME;
const myFortune = () => (state.fortune?.day === todayKey() ? state.fortune : null);

function draw() {
  let roll = Math.random() * FORTUNES.reduce((sum, f) => sum + f.weight, 0);
  const picked = FORTUNES.find((f) => (roll -= f.weight) < 0) ?? FORTUNES.at(-1);
  const line = picked.lines[Math.floor(Math.random() * picked.lines.length)];
  return { day: todayKey(), grade: picked.grade, line };
}

function renderRoom() {
  const list = $('fortune-room');
  list.innerHTML = '';
  const mine = myFortune();
  const rows = [...(mine ? [{ name: `${myName()} (나)`, grade: mine.grade }] : []), ...others.values()];
  $('fortune-room-wrap').hidden = rows.length === 0;
  rows.forEach(({ name, grade }) => {
    const li = document.createElement('li');
    const g = document.createElement('b');
    g.textContent = grade;
    g.dataset.grade = grade;
    li.append(`${name} `, g);
    list.appendChild(li);
  });
}

function render() {
  const mine = myFortune();
  $('fortune-draw').hidden = !!mine;
  $('fortune-result').hidden = !mine;
  if (mine) {
    $('fortune-grade').textContent = mine.grade;
    $('fortune-grade').dataset.grade = mine.grade;
    $('fortune-line').textContent = mine.line;
  }
  $('fortune-sub').textContent = mine ? `오늘은 ${mine.grade}` : '하루 한 번';
  renderRoom();
}

function shakeAndDraw() {
  const tube = $('fortune-tube');
  tube.classList.add('shaking');
  $('fortune-shake').disabled = true;
  setTimeout(() => {
    tube.classList.remove('shaking');
    $('fortune-shake').disabled = false;
    state.fortune = draw();
    save(); render(); playChime();
    hall?.send('fortune', { name: myName(), grade: state.fortune.grade, fresh: true });
  }, SHAKE_MS);
}

function onFortune(data, peerId) {
  if (!GRADES.includes(data?.grade)) return;
  const name = String(data.name || DEFAULT_NAME).slice(0, MAX_NAME_LEN);
  others.set(peerId, { name, grade: data.grade });
  renderRoom();
  if (data.fresh) toast(`🎋 ${name}님의 오늘 점괘: ${data.grade}`);
}

export const fortunePeer = {
  onPeerJoin: (peerId) => {
    const mine = myFortune();
    if (mine) hall?.send('fortune', { name: myName(), grade: mine.grade }, peerId);
  },
  onPeerLeave: (peerId) => { others.delete(peerId); renderRoom(); },
  actions: { fortune: onFortune },
};

export const connectFortune = (h) => { hall = h; };

export function initFortune() {
  bindModal('fortune-modal', { trigger: 'btn-fortune', onOpen: render });
  $('fortune-shake').addEventListener('click', shakeAndDraw);
  render();
}
