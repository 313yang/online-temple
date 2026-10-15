const TOAST_MS = 2600;

export const $ = (id) => document.getElementById(id);
export const clsx = (...names) => names.filter(Boolean).join(' ');

let toastTimer;
export function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), TOAST_MS);
}

/** 배경 클릭·[data-close] 버튼으로 닫히는 모달 */
export function bindModal(id, { trigger, focus, onOpen } = {}) {
  const modal = $(id);
  const open = () => {
    modal.classList.add('open');
    onOpen?.();
    if (focus) setTimeout(() => $(focus).focus(), 50);
  };
  const close = () => modal.classList.remove('open');
  if (trigger) $(trigger).addEventListener('click', open);
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-close]')) close(); });
  return { open, close };
}

export const isModalOpen = () => !!document.querySelector('.modal.open');

// 클릭한 자리에서 이모지가 살짝 떠오르다 사라진다
export function floatEmoji(emoji, x, y) {
  const el = document.createElement('div');
  el.className = 'float-emoji';
  el.textContent = emoji;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}
