// 공유 카드 그리기: 인스타 피드·카톡에 잘 맞는 4:5 이미지를 캔버스로 만든다
const W = 1080;
const H = 1350;
const FONT = '"Gowun Batang", serif';
const GOLD = '#f6d996';
const INK = '#f3e9d6';
const INK_DIM = '#a99c86';
const STAR_COUNT = 110;
const SITE_LABEL = 'online-temple.vercel.app';
export const GRADE_COLORS = { 대길: '#ffd65a', 길: '#7bd389', 소길: '#7ab8ff', 흉: '#ff6b5a' };

function drawSky(g) {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b0a14'); bg.addColorStop(0.55, '#17101a'); bg.addColorStop(1, '#2a1a14');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < STAR_COUNT; i++) {
    g.globalAlpha = 0.2 + Math.random() * 0.5;
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(Math.random() * W, Math.random() * H * 0.7, Math.random() * 2 + 0.6, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  const halo = g.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, 520);
  halo.addColorStop(0, 'rgba(255,233,168,0.22)'); halo.addColorStop(1, 'rgba(232,184,90,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
}

function drawLantern(g, x, y, size, color) {
  const glow = g.createRadialGradient(x, y, 0, x, y, size * 2.4);
  glow.addColorStop(0, color + '88'); glow.addColorStop(1, color + '00');
  g.fillStyle = glow; g.beginPath(); g.arc(x, y, size * 2.4, 0, Math.PI * 2); g.fill();
  const paper = g.createRadialGradient(x, y - size * 0.15, 0, x, y, size * 1.1);
  paper.addColorStop(0, '#fff6d8'); paper.addColorStop(0.45, color); paper.addColorStop(1, '#5a2420');
  g.fillStyle = paper; g.beginPath(); g.ellipse(x, y, size * 0.9, size, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e8b85a';
  g.fillRect(x - size * 0.48, y - size * 1.2, size * 0.96, size * 0.24);
  g.fillRect(x - size * 0.48, y + size * 0.96, size * 0.96, size * 0.24);
}

// 한 줄 폭을 넘으면 어절 단위로 줄을 바꾼다
function wrapText(g, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawCentered(g, text, y, { size, color = INK, weight = 400, maxWidth = W - 160, lineHeight = 1.5 }) {
  g.font = `${weight} ${size}px ${FONT}`;
  g.fillStyle = color;
  g.textAlign = 'center';
  const lines = wrapText(g, text, maxWidth);
  lines.forEach((l, i) => g.fillText(l, W / 2, y + i * size * lineHeight));
  return y + lines.length * size * lineHeight;
}

function drawFrame(g, { kicker, footer }) {
  drawSky(g);
  drawLantern(g, 150, 190, 46, '#ff6b5a');
  drawLantern(g, 930, 230, 38, '#ffb347');
  drawLantern(g, 120, 1010, 30, '#7ab8ff');
  drawLantern(g, 960, 960, 34, '#ffe066');
  drawCentered(g, '번뇌 소멸 법당', 150, { size: 46, color: GOLD, weight: 700 });
  drawCentered(g, kicker, 230, { size: 40, color: INK_DIM });
  drawCentered(g, footer, 1170, { size: 34, color: INK_DIM });
  drawCentered(g, SITE_LABEL, 1240, { size: 38, color: GOLD, weight: 700 });
}

export async function loadCardFont() {
  // 웹폰트가 늦게 뜨면 기본 서체로 그려지므로 미리 불러둔다
  try { await Promise.all([document.fonts.load(`700 100px ${FONT}`), document.fonts.load(`400 40px ${FONT}`)]); } catch {}
}

/** @param {{ name: string, date: string, grade: string, line: string }} f */
export function drawFortuneCard(g, { name, date, grade, line }) {
  drawFrame(g, { kicker: `${name}님의 오늘의 점괘 · ${date}`, footer: '당신의 오늘 점괘도 뽑아보세요 🎋' });
  g.shadowColor = GRADE_COLORS[grade]; g.shadowBlur = 60;
  drawCentered(g, grade, 640, { size: 300, color: GRADE_COLORS[grade], weight: 700 });
  g.shadowBlur = 0;
  drawCentered(g, line, 820, { size: 58, maxWidth: W - 220 });
}

// 소멸한 번뇌 수에 따라 한 줄 평을 붙인다
const BONNOE_VERDICTS = [
  [1000, '해탈 직전입니다. 오늘은 칼퇴하세요'],
  [324, '백팔번뇌를 세 바퀴 돌았습니다'],
  [108, '백팔번뇌 완주. 마음이 한결 가볍습니다'],
  [30, '번뇌가 슬슬 물러가는 중입니다'],
  [0, '첫 목탁이 가장 어렵습니다'],
];

/** @param {{ name: string, date: string, count: number }} b */
export function drawBonnoeCard(g, { name, date, count }) {
  drawFrame(g, { kicker: `${name}님의 번뇌 소멸 인증 · ${date}`, footer: '같이 목탁 치러 오세요 🙏' });
  drawCentered(g, '오늘 소멸한 번뇌', 470, { size: 56, color: INK_DIM });
  g.shadowColor = GOLD; g.shadowBlur = 50;
  drawCentered(g, `${count.toLocaleString()}개`, 700, { size: 220, color: GOLD, weight: 700 });
  g.shadowBlur = 0;
  const verdict = BONNOE_VERDICTS.find(([min]) => count >= min)[1];
  drawCentered(g, verdict, 860, { size: 56 });
}

export function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  return canvas;
}
