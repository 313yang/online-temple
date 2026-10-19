// 공유 카드: 점괘·번뇌 소멸 인증을 이미지로 만들어 공유한다.
// 휴대폰은 공유 시트(카톡·인스타 등)로, 안 되는 곳은 이미지 저장 + 링크 복사로 대신한다.
import { DEFAULT_NAME, SITE_URL } from './config.js';
import { createCanvas, drawBonnoeCard, drawFortuneCard, loadCardFont } from './share-card.js';
import { state, todayKey } from './store.js';
import { $, toast } from './ui.js';

const myName = () => state.name || DEFAULT_NAME;
const dateLabel = () => todayKey().replaceAll('-', '.');

function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function shareImage(canvas, { kind, filename, text }) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const file = new File([blob], filename, { type: 'image/png' });
  const message = `${text}\n${SITE_URL}`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: message });
      window.gtag?.('event', 'share', { method: 'web_share', content_type: kind });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // 사용자가 공유 창을 닫음
    }
  }
  download(blob, filename);
  try { await navigator.clipboard.writeText(message); } catch {}
  window.gtag?.('event', 'share', { method: 'download', content_type: kind });
  toast('📤 카드 이미지를 저장하고 링크를 복사했어요');
}

async function shareFortune() {
  const f = state.fortune?.day === todayKey() ? state.fortune : null;
  if (!f) return toast('먼저 오늘의 점괘를 뽑아주세요');
  await loadCardFont();
  const canvas = createCanvas();
  drawFortuneCard(canvas.getContext('2d'), { name: myName(), date: dateLabel(), grade: f.grade, line: f.line });
  await shareImage(canvas, { kind: 'fortune', filename: `오늘의점괘-${f.grade}.png`, text: `🎋 오늘의 점괘: ${f.grade} — ${f.line}` });
}

async function shareBonnoe() {
  await loadCardFont();
  const canvas = createCanvas();
  drawBonnoeCard(canvas.getContext('2d'), { name: myName(), date: dateLabel(), count: state.today });
  await shareImage(canvas, { kind: 'bonnoe', filename: `번뇌소멸-${state.today}개.png`, text: `🙏 오늘 번뇌 ${state.today.toLocaleString()}개 소멸` });
}

export function initShare() {
  $('fortune-share').addEventListener('click', shareFortune);
  $('btn-share-bonnoe').addEventListener('click', shareBonnoe);
}
