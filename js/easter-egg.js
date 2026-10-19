// 이스터에그: 고양이·강아지를 정신없이 쓰다듬으면 어디서 염주를 물어온다
import { YEOMJU_HASH, YEOMJU_URL } from './config.js';
import { playChime } from './sound.js';
import { $, bindModal, floatEmoji } from './ui.js';

let modal;

function giftUrl(animalId) {
  const url = new URL(YEOMJU_URL);
  url.search = new URLSearchParams({ utm_source: 'online-temple', utm_medium: 'easter_egg', utm_campaign: animalId });
  return `${url}${YEOMJU_HASH}`;
}

/** @param {{ id: string, name: string, emoji: string }} animal */
export function bringYeomju(animal, e) {
  floatEmoji('📿', e.clientX, e.clientY - 20);
  $('gift-title').textContent = `${animal.emoji} ${animal.name}가 어디서 염주를 물어왔다!`;
  $('gift-link').href = giftUrl(animal.id);
  playChime();
  window.gtag?.('event', 'easter_egg', { animal: animal.id });
  modal.open();
}

export function initEasterEgg() {
  modal = bindModal('gift-modal');
  $('gift-link').addEventListener('click', () => {
    window.gtag?.('event', 'easter_egg_click', { destination: 'yeomju' });
    modal.close();
  });
}
