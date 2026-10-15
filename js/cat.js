// 법당 고양이: 가끔 불단 앞을 가로질러 지나가고, 쓰다듬으면 잠깐 멈춰서 골골거린다
import { playPurr } from './sound.js';
import { $, floatEmoji, toast } from './ui.js';

const WALK_MS = 24000; // 천천히 산책하듯
const FIRST_VISIT_MS = [15000, 30000];
const NEXT_VISIT_MS = [60000, 180000];
const PET_PAUSE_MS = 2500;
const CAT_WIDTH_PX = 84;
const PET_LINES = ['냐옹', '골골골…', '(눈을 지그시 감는다)', '(꼬리를 살랑인다)', '냥 (번뇌가 하나 줄었다)'];

const between = ([min, max]) => min + Math.random() * (max - min);

let walking = null; // 지금 걷고 있는 Animation
let resumeTimer;

function pet(e) {
  if (!walking) return;
  walking.pause();
  $('cat').classList.add('sitting');
  playPurr();
  floatEmoji('💗', e.clientX, e.clientY - 10);
  toast(`🐈 ${PET_LINES[Math.floor(Math.random() * PET_LINES.length)]}`);
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(() => {
    $('cat').classList.remove('sitting');
    walking?.play();
  }, PET_PAUSE_MS);
}

function walkAcross() {
  const cat = $('cat');
  // 향로 바로 옆 바닥 높이를 걷는다
  const floor = $('burner').getBoundingClientRect().bottom;
  const toRight = Math.random() < 0.5;
  const from = toRight ? -CAT_WIDTH_PX : innerWidth;
  const to = toRight ? innerWidth : -CAT_WIDTH_PX;
  cat.hidden = false; // 보이게 한 뒤에야 높이를 잴 수 있다
  cat.style.top = `${floor - cat.offsetHeight}px`;
  cat.classList.toggle('flip', !toRight);
  walking = cat.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: WALK_MS });
  walking.onfinish = () => {
    cat.hidden = true;
    walking = null;
    scheduleVisit(NEXT_VISIT_MS);
  };
}

function scheduleVisit(range) {
  setTimeout(() => (document.hidden ? scheduleVisit(range) : walkAcross()), between(range));
}

export function initCat() {
  $('cat').addEventListener('pointerdown', pet);
  scheduleVisit(FIRST_VISIT_MS);
}

// 개발 중 바로 불러보기용
export const summonCat = () => { if (!walking) walkAcross(); };
