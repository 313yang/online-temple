// 번뇌 태우기: 종이에 적은 번뇌를 향로 위에서 아래부터 태운다. 혼자만 보고, 어디에도 저장하지 않는다.
import { playCrackle } from './sound.js';
import { $, bindModal, toast } from './ui.js';

const BURN_MS = 4000;
const DROP_MS = 600;
const ASH_EVERY_MS = 70;
const MAX_TOAST_WORD = 14;

function makePaper(text) {
  const paper = document.createElement('div');
  const words = document.createElement('div');
  const edge = document.createElement('div');
  paper.className = 'paper';
  words.className = 'paper-text';
  edge.className = 'burn-edge';
  words.textContent = text;
  paper.append(words, edge);
  paper.style.setProperty('--burn', `${BURN_MS}ms`);
  paper.style.setProperty('--tilt', `${(Math.random() - 0.5) * 8}deg`);
  return paper;
}

// 타고 있는 가장자리에서 재가 흩날린다
function scatterAsh(paper, startedAt) {
  const r = paper.getBoundingClientRect();
  const progress = (Date.now() - startedAt) / BURN_MS;
  const ash = document.createElement('div');
  ash.className = 'ash';
  ash.style.left = `${r.left + Math.random() * r.width}px`;
  ash.style.top = `${r.bottom - r.height * progress}px`;
  ash.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
  document.body.appendChild(ash);
  setTimeout(() => ash.remove(), 1800);
}

function burn(text) {
  const burner = $('burner').getBoundingClientRect();
  const paper = makePaper(text);
  paper.style.left = `${burner.left + burner.width / 2}px`;
  paper.style.top = `${burner.top}px`;
  document.body.appendChild(paper);

  setTimeout(() => {
    const startedAt = Date.now();
    paper.classList.add('burning');
    playCrackle(BURN_MS / 1000);
    const ashTimer = setInterval(() => scatterAsh(paper, startedAt), ASH_EVERY_MS);
    setTimeout(() => {
      clearInterval(ashTimer);
      paper.remove();
      const short = text.length > MAX_TOAST_WORD ? `${text.slice(0, MAX_TOAST_WORD)}…` : text;
      toast(`🔥 「${short}」 재가 되어 흩어졌습니다`);
    }, BURN_MS);
  }, DROP_MS);
}

export function initBurn() {
  const { close } = bindModal('burn-modal', { trigger: 'btn-burn', focus: 'burn-text' });
  $('burn-ok').addEventListener('click', () => {
    const text = $('burn-text').value.trim();
    if (!text) return $('burn-text').focus();
    $('burn-text').value = '';
    close();
    burn(text);
  });
}
