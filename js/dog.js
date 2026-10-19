// 절 강아지: 가사 두건을 두른 백구. 고양이보다 발랄하게 종종걸음으로 지나가고, 쓰다듬으면 꼬리를 프로펠러처럼 흔든다.
import { bringYeomju } from './easter-egg.js';
import { playBark } from './sound.js';
import { createVisitor } from './visitor.js';

const dog = createVisitor({
  id: 'dog',
  emoji: '🐕',
  walkMs: 17000,
  firstVisitMs: [40000, 70000], // 고양이와 겹치지 않게 조금 늦게 첫 등장
  nextVisitMs: [70000, 200000],
  petPauseMs: 2200,
  petLines: ['멍!', '헥헥헥', '(꼬리를 프로펠러처럼 흔든다)', '(발라당 배를 보여준다)', '왕 (번뇌가 하나 줄었다)'],
  onPet: playBark,
  onFrenzy: (e) => bringYeomju({ id: 'dog', name: '강아지', emoji: '🐕' }, e),
});

export const initDog = dog.init;
export const summonDog = dog.summon;
