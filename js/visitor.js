// 법당에 놀러 오는 동물 공통 동작: 가끔 향로 높이로 화면을 가로지르고, 쓰다듬으면 잠깐 멈춘다
import { $, floatEmoji, toast } from './ui.js';

const between = ([min, max]) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * @param {{ id: string, emoji: string, walkMs: number, firstVisitMs: number[], nextVisitMs: number[],
 *   petPauseMs: number, petLines: string[], onPet: () => void }} options
 */
export function createVisitor({ id, emoji, walkMs, firstVisitMs, nextVisitMs, petPauseMs, petLines, onPet }) {
  let walking = null; // 지금 걷고 있는 Animation
  let resumeTimer;
  const el = () => $(id);

  function pet(e) {
    if (!walking) return;
    walking.pause();
    el().classList.add('sitting');
    onPet();
    floatEmoji('💗', e.clientX, e.clientY - 10);
    toast(`${emoji} ${pick(petLines)}`);
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
