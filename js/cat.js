// 법당 고양이: 염주를 목에 걸고 천천히 산책한다. 쓰다듬으면 골골거린다.
import { bringYeomju } from './easter-egg.js';
import { playPurr } from './sound.js';
import { createVisitor } from './visitor.js';

const cat = createVisitor({
  id: 'cat',
  emoji: '🐈',
  walkMs: 24000, // 천천히 산책하듯
  firstVisitMs: [15000, 30000],
  nextVisitMs: [60000, 180000],
  petPauseMs: 2500,
  petLines: ['냐옹', '골골골…', '(눈을 지그시 감는다)', '(꼬리를 살랑인다)', '냥 (번뇌가 하나 줄었다)'],
  onPet: playPurr,
  onFrenzy: (e) => bringYeomju({ id: 'cat', name: '고양이', emoji: '🐈' }, e),
});

export const initCat = cat.init;
export const summonCat = cat.summon;
