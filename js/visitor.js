// 법당에 놀러 오는 동물 공통 동작: 가끔 향로 높이로 화면을 가로지르고, 쓰다듬으면 잠깐 멈춘다
import { $, floatEmoji, toast } from './ui.js';

// 짧은 시간에 이만큼 연달아 쓰다듬으면 '정신없이 쓰다듬었다'로 본다
const FRENZY_PETS = 6;
const FRENZY_WINDOW_MS = 3000;

const between = ([min, max]) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * @param {{ id: string, emoji: string, walkMs: number, firstVisitMs: number[], nextVisitMs: number[],
 *   petPauseMs: number, petLines: string[], onPet: () => void, onFrenzy?: (e: PointerEvent) => void }} options
 */
export function createVisitor({ id, emoji, walkMs, firstVisitMs, nextVisitMs, petPauseMs, petLines, onPet, onFrenzy }) {
  let walking = null; // 지금 걷고 있는 Animation
  let resumeTimer;
  let petTimes = [];
  let frenzyDone = false; // 한 번 들어온 동안 한 번만

  function checkFrenzy(e) {
    const now = Date.now();
    petTimes = petTimes.filter((t) => now - t < FRENZY_WINDOW_MS).concat(now);
    if (frenzyDone || petTimes.length < FRENZY_PETS) return false;
    frenzyDone = true;
    onFrenzy?.(e);
    return true;
  }
  const el = () => $(id);

  function pet(e) {
    if (!walking) return;
    walking.pause();
    el().classList.add('sitting');
    onPet();
    floatEmoji('💗', e.clientX, e.clientY - 10);
    if (!checkFrenzy(e)) toast(`${emoji} ${pick(petLines)}`);
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      el().classList.remove('sitting');
      walking?.play();
    }, petPauseMs);
  }

  function walkAcross() {
    const node = el();
    const floor = $('burner').getBoundingClientRect().bottom;
    const toRight = Math.random() < 0.5;
    node.hidden = false; // 보이게 한 뒤에야 크기를 잴 수 있다
    const width = node.offsetWidth;
    const [from, to] = toRight ? [-width, innerWidth] : [innerWidth, -width];
    node.style.top = `${floor - node.offsetHeight}px`;
    node.classList.toggle('flip', !toRight);
    walking = node.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: walkMs });
    walking.onfinish = () => {
      node.hidden = true;
      walking = null;
      scheduleVisit(nextVisitMs);
    };
  }

  function scheduleVisit(range) {
    setTimeout(() => (document.hidden ? scheduleVisit(range) : walkAcross()), between(range));
  }

  return {
    init() {
      el().addEventListener('pointerdown', pet);
      scheduleVisit(firstVisitMs);
    },
    // 개발 중 바로 불러보기용
    summon() { if (!walking) walkAcross(); },
  };
}
